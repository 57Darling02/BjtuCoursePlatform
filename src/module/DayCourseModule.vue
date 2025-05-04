<template>
    <template v-if="isLoading">
        <div class="a-card-static" style="flex: 1;">
            <el-skeleton :rows="1" animated class="skeleton-header" />
            <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton" style="margin: 12px 0;" />
        </div>
    </template>
    <template v-else>
        <div class="a-card-static">
            <el-tag type="info">{{ data?.length ? `今日共${data?.length}节` : '今日无课' }}</el-tag>&nbsp;
            <el-tag type="danger">剩余{{ remainCourse.length }}节</el-tag>&nbsp;
            <CourseScheduleItemPanel v-for="i in remainCourse" :coursescheduleitem="i" />
            <div class="a-card" v-if="remainCourse.length == 0">
                <el-text>没课啦(*￣3￣)╭</el-text>
                <h4>美好的一天从没课开始...</h4>
            </div>
        </div>
    </template>

</template>
<script lang='ts' setup>
import { computed, onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import type { CourseScheduleItem } from '@/api';
import CourseScheduleItemPanel from '@/components/CourseScheduleItemPanel.vue';
import { getDayCourse } from '@/api/api_app';
import { el_alert } from '@/utils';

const userStore = useUserStore();

const isLoading = ref(true);
const data = ref<CourseScheduleItem[]>()
const formatDate = (date: Date) => {
    return [
        date.getFullYear(),
        (date.getMonth() + 1).toString().padStart(2, '0'),
        date.getDate().toString().padStart(2, '0')
    ].join('');
}

const remainCourse = computed(() => {
    return data.value?.filter(item =>
        new Date() <= new Date(item.classEndTime)
    ) || []
})
onMounted(async () => {
    try {
        const cacheTime = userStore.Cache['DayCourse_time']
            ? new Date(JSON.parse(userStore.Cache['DayCourse_time']))
            : null;
        const isSameDay = cacheTime && formatDate(cacheTime) === formatDate(new Date());
        if (!userStore.Cache['DayCourse'] || !cacheTime || !isSameDay) {
            
            const freshData = await getDayCourse(formatDate(new Date()));
            userStore.Cache['DayCourse'] = JSON.stringify(freshData);
            userStore.Cache['DayCourse_time'] = JSON.stringify(new Date());
            data.value = freshData;
            el_alert({
                title: '课程表更新',
                message: `${new Date().toLocaleString()},今日共${freshData.length}节`,
                type: 'sccess',
            })
        } else {
            data.value = JSON.parse(userStore.Cache['DayCourse']) || [];
        }
        if (data.value) {
            data.value = data.value.reduce((acc: CourseScheduleItem[], curr) => {
                const existing = acc.find(item =>
                (item.classroomName === curr.classroomName
                    && item.classBeginTime === curr.classBeginTime
                    && item.classEndTime === curr.classEndTime
                    && item.teachTime === curr.teachTime
                ));
                if (existing) {
                    // 直接追加字符串用空格分隔
                    existing.teacherName += ` ${curr.teacherName}`;
                    existing.teacherId += ` ${curr.teacherId}`;
                    existing.teacherAcademy += ` ${curr.teacherAcademy}`;
                } else {
                    acc.push(curr);
                }
                return acc;
            }, []);
        }
    } finally {
        isLoading.value = false
    }
})
</script>
<style lang="scss" scoped></style>