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
                        <el-tag type="info">🏫{{ coursescheduleitem.classroomName }}</el-tag>
                        <el-tag type="info">⏱️{{ formatTime(coursescheduleitem.classBeginTime) }} -
                            {{ formatTime(coursescheduleitem.classEndTime) }}</el-tag>
                        <el-tag type="info">🕵️‍♂️{{ coursescheduleitem.teacherName }}</el-tag>
                        <el-tag type="warning" v-if="!is_expired">
                            <el-countdown
                                value-style="color: #b4b9be; font-size: 14px; font-weight: 700; display:flex ; "
                                :format="`[⏳${is_active ? '距离结束还有' : '距离开始还有'}]HH:mm:ss`"
                                :value="new Date(is_active ? coursescheduleitem.classEndTime : coursescheduleitem.classBeginTime).getTime()" />
                        </el-tag>
                    </el-space>
                </el-col>
                <el-col :xs="24" :sm="6" :md="6">
                    <el-button round style="width: 100%" class="a-card" @click="" :type="is_active?'warning':'info'">
                        {{ is_active ? '直播' : '预习' }}
                    </el-button>
                </el-col>
            </el-row>
        </div>
    </template>

</template>
<script lang='ts' setup>
import type { CourseScheduleItem } from '@/api';
import { onMounted, ref, type PropType } from 'vue'
const props = defineProps({
    coursescheduleitem: {
        type: Object as PropType<CourseScheduleItem>,
        required: true
    }
})
const isLoading = ref(true)
const coursescheduleitem = props.coursescheduleitem
const is_expired = new Date() > new Date(coursescheduleitem.classEndTime)
const is_active = !is_expired && new Date() >= new Date(coursescheduleitem.classBeginTime)
const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    })
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
</style>