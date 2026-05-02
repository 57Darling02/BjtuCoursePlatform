<template>
    <PanelShell title="作业概览">
        <template #meta>
            <el-space v-if="userStore.homeworkList.length > 0" wrap :size="5">
                <el-tag type="warning" v-if="countWaitMakeup(userStore.homeworkList)" round>{{
                    countWaitMakeup(userStore.homeworkList) }}项待补交</el-tag>
                <el-tag type="warning" round>{{ countUncompleted(userStore.homeworkList) }}项待完成</el-tag>
                <el-tag type="danger" v-if="countExpired(userStore.homeworkList)" round>{{
                    countExpired(userStore.homeworkList) }}项过期</el-tag>
                <el-tag type="info" round>共{{ userStore.homeworkList.length }}项</el-tag>
            </el-space>
        </template>
        <template #actions>
            <el-button
                class="module-refresh-btn"
                text
                :loading="userStore.homeworkListLoading"
                :disabled="userStore.homeworkListLoading"
                @click="triggerManualRefresh"
            >
                <i v-if="!userStore.homeworkListLoading" class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                {{ homeworkUpdatedAtText }}
            </el-button>
        </template>
        <el-collapse v-model="activeColumn" accordion @change="handleCollapseChange">
            <div class="fade-item">
                <el-collapse-item v-for="(group, courseId) in groupedByCourse" :key="courseId" :name="courseId"
                    class="a-card">
                    <template #title>
                        <el-space wrap>
                            <el-text>{{ group.courseName }}</el-text>
                            <el-space :size="2">
                                <el-tag type="warning" round v-if="countWaitMakeup(group.items)">{{
                                    countWaitMakeup(group.items) }}项待补交</el-tag>
                                <el-tag type="warning" round v-if="countUncompleted(group.items)">{{
                                    countUncompleted(group.items)
                                    }}项待完成</el-tag>
                                <el-tag type="danger" round v-if="countExpired(group.items)">{{
                                    countExpired(group.items) }}项过期</el-tag>
                                <el-tag type="info" round>共{{ group.items.length }}项</el-tag>
                            </el-space>
                        </el-space>
                    </template>
                    <transition-group
                        v-if="shouldRenderGroup(courseId)"
                        name="hw-stagger"
                        tag="div"
                        class="homework-list"
                    >
                        <el-row
                            v-for="(hw, index) in group.items"
                            :key="hw.id"
                            class="a-card hwitem fade-item"
                            :gutter="12"
                            :style="{ '--delay': (0.2 + index * 0.05) + 's' }"
                            @click="handleClick(hw)"
                        >
                            <PublicHwPanel :activehomework="hw" />
                        </el-row>
                    </transition-group>
                </el-collapse-item>
            </div>
        </el-collapse>
    </PanelShell>
    <el-dialog v-if="activeHomework" v-model="HomeworkDialogVisible" :title="activeHomework.title"
        style="flex-direction: column;display: flex;overflow: hidden;" fullscreen destroy-on-close
        body-class="full-dialog-body" header-class="full-dialog-header">
        <HwDialog :activehomework="activeHomework" />
    </el-dialog>
</template>
<script lang='ts' setup>


import { computed, onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user'
import type { HomeworkItem } from '@/api';
import PanelShell from '@/shared/ui/PanelShell.vue';
import PublicHwPanel from '@/features/homework/components/PublicHwPanel.vue';
import HwDialog from '@/features/homework/components/HwDialog.vue';
import {
    countExpired,
    countUncompleted,
    countWaitMakeup,
    emitter,
    groupHomeworksByCourse,
} from '@/utils';
const userStore = useUserStore();

const THREE_MINUTES = 3 * 60 * 1000

const activeHomework = ref<HomeworkItem | null>(null)
const HomeworkDialogVisible = ref(false);

const groupedByCourse = computed(() => groupHomeworksByCourse(userStore.homeworkList));
const renderedCourseIds = ref<Set<string>>(new Set())

const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '--/--/-- --:--'

    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}/${month}/${day} ${hours}:${minutes}`
}

const homeworkUpdatedAtText = computed(() => {
    return formatTimestamp(userStore.dataTimestamps.homeworkList || 0)
})

const normalizeCourseId = (value: unknown) => {
    if (value === undefined || value === null) return ''
    return String(value)
}

const ensureRenderedCourse = (value: unknown) => {
    const normalized = normalizeCourseId(value)
    if (!normalized) return
    renderedCourseIds.value.add(normalized)
}

const shouldRenderGroup = (courseId: unknown) => renderedCourseIds.value.has(normalizeCourseId(courseId))

const handleCollapseChange = (value: unknown) => {
    if (Array.isArray(value)) {
        value.forEach(ensureRenderedCourse)
        return
    }
    ensureRenderedCourse(value)
}

const handleClick = (hw: HomeworkItem) => {
    activeHomework.value = hw;
    HomeworkDialogVisible.value = true;
}

const getNavigationType = () => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (navigationEntry?.type) return navigationEntry.type
    const legacyNavigation = (performance as Performance & { navigation?: { type?: number } }).navigation
    if (legacyNavigation?.type === 1) return 'reload'
    if (legacyNavigation?.type === 0) return 'navigate'
    return undefined
}

const isManualPageReload = () => getNavigationType() === 'reload'

const shouldRefreshHomeworkList = () => {
    const lastSyncedAt = userStore.dataTimestamps.homeworkList || 0
    if (!lastSyncedAt) return true
    return Date.now() - lastSyncedAt > THREE_MINUTES
}

const syncHomeworkOnEnter = () => {
    const manualReload = isManualPageReload()
    const forceRefreshHomeworkList = manualReload || shouldRefreshHomeworkList()

    userStore.addTaskToQueue(async () => {
        await userStore.reconnectOnFirstEntryIfDisconnected()
    })

    if (manualReload) {
        void userStore.refreshUserInfo({ force: true, silent: true })
    }

    userStore.addTaskToQueue(async () => {
        await userStore.refreshHomeworks({ force: forceRefreshHomeworkList })
    })
}

const triggerManualRefresh = () => {
    if (userStore.homeworkListLoading) return
    userStore.addTaskToQueue(async () => {
        await userStore.reconnectOnFirstEntryIfDisconnected({ notifyOnFailure: true })
        await userStore.refreshHomeworks({ force: true })
    })
}

const initialCourseId = Object.keys(groupedByCourse.value)[0] ?? ''
const activeColumn = ref<string>(initialCourseId)
ensureRenderedCourse(initialCourseId)
emitter.on('UPDATE_HOMEWORKS', () => {
    try {
        HomeworkDialogVisible.value = false;
        if (userStore.homeworkListLoading) return
        userStore.addTaskToQueue(async () => {
            await userStore.refreshHomeworks({ force: true })
        });
    } catch (error) {
        console.error('获取作业列表失败:', error)
    }
})

onMounted(() => {
    try {
        syncHomeworkOnEnter()
    } catch (error) {
        console.error('获取作业列表失败:', error)
    }
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

.hwitem {
    background-color: rgba(240, 245, 252, 0.82);
    width: 95%;
    padding-left: 23px;
}

.homework-list {
    contain: layout paint;
}

.hw-stagger-enter-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.hw-stagger-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.hw-stagger-leave-active {
    display: none;
}
</style>
