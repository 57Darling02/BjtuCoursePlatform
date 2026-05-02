<template>
    <PanelShell title="今日课表">
        <template #meta>
            <el-tag v-if="hasDayCourseSnapshot" :type="todaySummaryTagType" round>
                {{ todaySummaryText }}
            </el-tag>
        </template>
        <template #actions>
            <el-button
                class="module-refresh-btn"
                text
                :loading="isRefreshing"
                :disabled="isRefreshing"
                @click="triggerManualRefresh"
            >
                <i v-if="!isRefreshing" class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                {{ dayCourseUpdatedAtText }}
            </el-button>
        </template>
        <CourseScheduleItemPanel v-for="i in remainCourse" :coursescheduleitem="i" />
        <div class="a-card" v-if="hasDayCourseSnapshot && remainCourse.length == 0">
            <el-text>没课啦(*￣3￣)╭</el-text>
            <h4>美好的一天从没课开始...</h4>
        </div>
    </PanelShell>
</template>
<script lang='ts' setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import type { CourseScheduleItem } from '@/api';
import CourseScheduleItemPanel from '@/features/schedule/components/CourseScheduleItemPanel.vue';
import PanelShell from '@/shared/ui/PanelShell.vue';
import { getDayCourse } from '@/api/api_app';
import { emitter, formatMonthDay } from '@/utils';

const userStore = useUserStore();

const isRefreshing = ref(false);
const data = ref<CourseScheduleItem[]>()
const hasDayCourseSnapshot = computed(() => Array.isArray(data.value))

const formatDate = (date: Date) => {
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0')
    ].join('');
}

const formatDateLabel = (date: Date) => {
    return formatMonthDay(date)
}

const parseDayCourseCacheTime = () => {
    const rawCacheTime = userStore.Cache['DayCourse_time']
    if (!rawCacheTime) return null

    try {
        return new Date(JSON.parse(rawCacheTime))
    } catch {
        return null
    }
}

const dayCourseUpdatedAtText = computed(() => {
    const cacheTime = parseDayCourseCacheTime()
    return `${cacheTime ? formatDateLabel(cacheTime) : '--/--'}`
})

const mergeCourseScheduleItems = (items: CourseScheduleItem[]) => {
    return items.reduce((acc: CourseScheduleItem[], curr) => {
        const existing = acc.find(item =>
            item.classroomName === curr.classroomName
            && item.classBeginTime === curr.classBeginTime
            && item.classEndTime === curr.classEndTime
            && item.teachTime === curr.teachTime
        )

        if (existing) {
            existing.teacherName += ` ${curr.teacherName}`
            existing.teacherId += ` ${curr.teacherId}`
            existing.teacherAcademy += ` ${curr.teacherAcademy}`
            return acc
        }

        acc.push(curr)
        return acc
    }, [])
}

const loadDayCourse = async (options: { force?: boolean } = {}) => {
    const today = new Date()
    const cacheTime = parseDayCourseCacheTime()
    const isSameDay = cacheTime && formatDate(cacheTime) === formatDate(today)
    const shouldUseCache = !options.force && userStore.Cache['DayCourse'] && cacheTime && isSameDay

    if (shouldUseCache) {
        data.value = JSON.parse(userStore.Cache['DayCourse']) || []
    } else {
        const freshData = await getDayCourse(formatDate(today))
        userStore.Cache['DayCourse'] = JSON.stringify(freshData)
        userStore.Cache['DayCourse_time'] = JSON.stringify(today)
        data.value = freshData
    }

    if (data.value) {
        data.value = mergeCourseScheduleItems(data.value)
    }
}

const remainCourse = computed(() => {
    return data.value?.filter(item =>
        new Date() <= new Date(item.classEndTime)
    ) || []
})

const todaySummaryText = computed(() => {
    const total = data.value?.length ?? 0
    return `剩${remainCourse.value.length}节/共${total}节`
})

const todaySummaryTagType = computed(() => {
    if (!data.value?.length) return 'info'
    return remainCourse.value.length > 0 ? 'warning' : 'success'
})

const refreshDayCourse = async (options: { force?: boolean } = {}) => {
    if (isRefreshing.value) return
    isRefreshing.value = true

    try {
        await loadDayCourse(options)
    } finally {
        isRefreshing.value = false
    }
}

const triggerManualRefresh = async () => {
    await refreshDayCourse({ force: true })
}

const handleRefreshDayCourse = () => {
    void refreshDayCourse({ force: true })
}

onMounted(async () => {
    emitter.on('REFRESH_DAY_COURSE', handleRefreshDayCourse)
    await refreshDayCourse()
})

onUnmounted(() => {
    emitter.off('REFRESH_DAY_COURSE', handleRefreshDayCourse)
})
</script>
<style lang="scss" scoped>
.module-refresh-btn {
    color: #3a5c8a;
    padding-inline: 6px;
    font-weight: 500;
}

.module-refresh-btn .fa-rotate-right {
    margin-right: 6px;
    font-size: 12px;
}
</style>
