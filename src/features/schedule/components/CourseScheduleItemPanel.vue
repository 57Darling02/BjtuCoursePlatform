<template>
    <template v-if="isLoading">
        <div class="a-card-static">
            <el-skeleton :rows="2" animated class="skeleton-header" />
        </div>
    </template>
    <template v-else>
        <div class="a-card">
            <el-col class="type">
                {{ coursescheduleitem.courseType }}
                {{ coursescheduleitem.teachTime }}
                {{ coursescheduleitem.weekDay }}

            </el-col>
            <el-row>
                <el-col :xs="24" :sm="18" :md="18">
                    <h3 class="title">{{ coursescheduleitem.courseName }}<el-tag type="warning"
                            v-if="is_active">上课中</el-tag></h3>
                    <el-space wrap>
                        <el-tag type="info" effect="dark"><i class="fa-solid fa-location-dot"></i>&nbsp;{{
                            coursescheduleitem.classroomName }}</el-tag>
                        <el-tag type="info" effect="dark"><i class="fa-regular fa-clock"></i>&nbsp;{{
                            formatTime(coursescheduleitem.classBeginTime) }} -
                            {{ formatTime(coursescheduleitem.classEndTime) }}</el-tag>
                        <el-tag type="info"><i class="fa-solid fa-person-chalkboard"></i>&nbsp;{{
                            coursescheduleitem.teacherName }}</el-tag>
                    </el-space>
                </el-col>
                <el-col :xs="24" :sm="6" :md="6">
                    <el-button v-if="showCountdownTag" round style="width: 100%" class="a-card" type="danger"
                        :plain="!is_active" @click="openReplayPage">
                        <el-countdown value-style="color: #b4b9be; font-size: 14px; font-weight: 700; display:flex ; "
                            :format="`[${is_active ? '离下课' : '距上课'}]HH:mm:ss ${is_active ? '看直播' : '先看回放'}`"
                            :value="countdownTarget" />
                    </el-button>
                </el-col>
            </el-row>
        </div>
    </template>

</template>
<script lang='ts' setup>
import type { CourseScheduleItem } from '@/api';
import router from '@/router';
import { useUserStore } from '@/stores/user';
import { onMounted, ref, type PropType } from 'vue'
const props = defineProps({
    coursescheduleitem: {
        type: Object as PropType<CourseScheduleItem>,
        required: true
    }
})
const userStore = useUserStore()
const isLoading = ref(true)
const coursescheduleitem = props.coursescheduleitem
const is_expired = new Date() > new Date(coursescheduleitem.classEndTime)
const is_active = !is_expired && new Date() >= new Date(coursescheduleitem.classBeginTime)
const countdownTarget = new Date(is_active ? coursescheduleitem.classEndTime : coursescheduleitem.classBeginTime).getTime()
const showCountdownTag = !is_expired || is_active
const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    })
}

const openReplayPage = () => {
    const matchedCourse = userStore.courseList.find(course =>
        String(course.id) === String(coursescheduleitem.courseId)
        || String(course.course_num) === String(coursescheduleitem.courseNum)
    )

    const routeCourseId = matchedCourse?.course_num || coursescheduleitem.courseNum || coursescheduleitem.courseId
    const routeCid = matchedCourse ? String(matchedCourse.id) : coursescheduleitem.courseId

    if (!routeCourseId || !routeCid) return

    const query: Record<string, string | number> = {
        courseId: routeCourseId,
        cId: routeCid,
        teacherId: String(matchedCourse?.teacher_id ?? coursescheduleitem.teacherId ?? ''),
        timeTableId: coursescheduleitem.uuid,
        courseToPage: 10480,
        dataSource: 1,
    }

    if (matchedCourse?.fz_id) {
        query.xkhId = matchedCourse.fz_id
    }

    if (matchedCourse?.xq_code) {
        query.xqCode = matchedCourse.xq_code
    }

    const route = router.resolve({
        name: 'course-replay',
        query
    })

    window.open(route.href, '_blank')
}


onMounted(() => {
    isLoading.value = false
})

</script>
<style lang="scss" scoped>
.type {
    font-size: 0.8em;
    color: #b4b9be;
}

.status-countdown :deep(.el-statistic__content) {
    color: inherit;
    font-size: inherit;
    line-height: inherit;
}

.status-countdown :deep(.el-statistic__number) {
    font-weight: 700;
}
</style>
