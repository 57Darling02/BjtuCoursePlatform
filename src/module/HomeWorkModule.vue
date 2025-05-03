<template>

    <template v-if="isLoading">
        <div class="a-card-static" style="flex: 1;">
            <el-skeleton :rows="1" animated class="skeleton-header" />
            <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton" style="margin: 12px 0;" />
        </div>
    </template>
    <template v-else>
        <div class="a-card-static">
            <el-space wrap :size="5">
                <el-tag type="warning" v-if="countWaitMakeup(userStore.homeworkList)">{{
                    countWaitMakeup(userStore.homeworkList) }}项待补交</el-tag>
                <el-tag type="warning">{{ countUncompleted(userStore.homeworkList) }}项待完成</el-tag>
                <el-tag type="danger" v-if="countExpired(userStore.homeworkList)">{{
                    countExpired(userStore.homeworkList) }}项过期</el-tag>
                <el-tag type="info">共{{ userStore.homeworkList.length }}项</el-tag>
            </el-space>
            <el-collapse v-model="active_colomn" accordion>
                <el-collapse-item v-for="(group, courseId) in groupedByCourse" :key="courseId" :name="courseId"
                    class="a-card">
                    <template #title>
                            <el-space wrap>
                                <el-text>{{ group.courseName }}</el-text>
                                <el-space :size="2">
                                    <el-tag type="warning" v-if="countWaitMakeup(group.items)">{{
                                        countWaitMakeup(group.items) }}项待补交</el-tag>
                                    <el-tag type="warning" v-if="countUncompleted(group.items)">{{
                                        countUncompleted(group.items)
                                        }}项待完成</el-tag>
                                    <el-tag type="danger" v-if="countExpired(group.items)">{{
                                        countExpired(group.items) }}项过期</el-tag>
                                    <el-tag type="info">共{{ group.items.length }}项</el-tag>
                                </el-space>
                            </el-space>
                    </template>
                    <el-row v-for="hw in group.items" :key="hw.id" class="a-card hwitem" :gutter="12"
                        @click="handleClick(hw)" v-if="active_colomn == courseId">
                        <PublicHwPanel :activehomework="hw" />
                    </el-row>
                    <el-skeleton :rows="group.items.length * 3" v-else-if="group.items.length > 0" animated
                        class="skeleton-header" />
                    <el-skeleton :rows="1" animated class="skeleton-header" v-else />
                </el-collapse-item>
            </el-collapse>
        </div>
    </template>
    <el-dialog v-if="activeHomework" v-model="HomeworkDialogVisible" :title="activeHomework.course_name" width="90%"
        min-width="300px" style="display: flex;flex-direction: column;" top="8vh" destroy-on-close>
        <HwDialog :activehomework="activeHomework" style="flex: 1;" />
    </el-dialog>
</template>
<script lang='ts' setup>
import { computed, onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user'
import type { HomeworkItem } from '@/api';
import PublicHwPanel from '@/components/PublicHwPanel.vue';
import HwDialog from '@/components/HwDialog.vue';
import { el_alert } from '@/utils';
import { getAllHomeworkItem, getAllStudentSubmissions } from '@/api/api_ve';
const userStore = useUserStore();


const activeHomework = ref<HomeworkItem | null>(null)
const HomeworkDialogVisible = ref(false);
const isLoading = ref(true);

const countUncompleted = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 0).length;

const countExpired = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 2).length;

const countWaitMakeup = (list: HomeworkItem[]) =>
    list.filter(hw => hw.status === 0 && hw.subStatus === 1).length;
const sortedHomework = computed(() => {
    return [...userStore.homeworkList].sort((a, b) => {
        const aUncompleted = a.status === 0;
        const bUncompleted = b.status === 0;

        // 未提交且已截止待补交
        const aIsOverdueButCanMakeup = aUncompleted && a.subStatus === 1;
        const bIsOverdueButCanMakeup = bUncompleted && b.subStatus === 1;

        // 未提交且未截止
        const aIsNotOverdue = aUncompleted && a.subStatus === 0;
        const bIsNotOverdue = bUncompleted && b.subStatus === 0;

        // 已过期或者已完成
        const aIsExpiredOrCompleted = !aUncompleted || a.subStatus === 2;
        const bIsExpiredOrCompleted = !bUncompleted || b.subStatus === 2;

        // 第一优先级：未提交且已截止待补交优先
        if (aIsOverdueButCanMakeup !== bIsOverdueButCanMakeup) {
            return aIsOverdueButCanMakeup ? -1 : 1;
        }

        if (aIsOverdueButCanMakeup) {
            const now = Date.now();
            const aMakeupTime = a.makeup_time ? new Date(a.makeup_time).getTime() : Infinity;
            const bMakeupTime = b.makeup_time ? new Date(b.makeup_time).getTime() : Infinity;
            // 剩余补交时间少的排在前面
            return aMakeupTime - bMakeupTime;
        }

        // 第二优先级：未提交且未截止
        if (aIsNotOverdue !== bIsNotOverdue) {
            return aIsNotOverdue ? -1 : 1;
        }

        if (aIsNotOverdue) {
            const now = Date.now();
            const aEndTime = new Date(a.end_time).getTime();
            const bEndTime = new Date(b.end_time).getTime();
            // 剩余时间少的排在前面
            return aEndTime - bEndTime;
        }

        // 第三优先级：已过期或者已完成
        if (aIsExpiredOrCompleted !== bIsExpiredOrCompleted) {
            return aIsExpiredOrCompleted ? 1 : -1;
        }

        if (aIsExpiredOrCompleted) {
            const aCreateTime = new Date(a.create_date).getTime();
            const bCreateTime = new Date(b.create_date).getTime();
            // 按创建时间先后排序
            return bCreateTime - aCreateTime;
        }

        return 0;
    }).filter(hw => hw.status == 0 && hw.subStatus != 2);
});

const groupedByCourse = computed(() => {
    const initialGroups = {
        '0': {
            courseName: "待办作业",
            items: sortedHomework.value // 使用已排序的待办作业
        }
    } as Record<string, { courseName: string; items: HomeworkItem[] }>;
    return userStore.homeworkList.reduce((acc, hw) => {
        const courseName = hw.course_name;
        if (!acc[hw.course_id]) {
            acc[hw.course_id] = {
                courseName,
                items: []
            };
        }
        acc[hw.course_id].items.push(hw);
        return acc;
    }, initialGroups);
});

const handleClick = (hw: HomeworkItem) => {
    activeHomework.value = hw;
    HomeworkDialogVisible.value = true;
}

const UPDATE_HOMEWORKSTask = async () => {
    if (!await userStore.checkAuth_ve()) return;
    try {
        if (userStore.courseList.length === 0) return;
        isLoading.value = true;
        userStore.homeworkList = await getAllHomeworkItem(userStore.courseList.map(course => course.id));
        el_alert({
            title: '作业信息更新',
            message: `${new Date().toLocaleString()}`,
            type: 'success',
            showClose: true,
            duration: 1000
        });
    } catch (error) {
        el_alert({
            title: '作业加载失败',
            message: `${error}`,
            type: 'error',
            showClose: true,
            duration: 0
        });
    } finally {
        isLoading.value = false;
    }
}

const update_homeworkdetail_Task = async () => {
    if (!await userStore.checkAuth_ve()) return;
    try {
        if (userStore.courseList.length === 0) {
            el_alert({
                title: '',
                message: '无课程信息',
                type: 'warning',
                showClose: true,
                duration: 1000
            });
            return;
        };
        for (const homework of userStore.homeworkList) {
            const allSubmissions = (await getAllStudentSubmissions(homework.id)).sort((a, b) => {
                const scoreA = a.score as number | null
                const scoreB = b.score as number | null
                if (scoreA === null) return 1
                if (scoreB === null) return -1
                return scoreB - scoreA
            })
            homework.detail = {
                my_homework: homework.detail?.my_homework,
                courseNoteList: allSubmissions,
                topFive: allSubmissions.filter((item) => item.pgFlag !== 's').slice(0, 5).map((item) => item.id)
            }
            const mhw = allSubmissions.filter((item) => item.pgFlag !== 's').find((item) => item.id == homework.detail?.my_homework)
            if (mhw) {
                homework.status = 2;
                homework.detail.score = Number(mhw.score);
                homework.detail.rank = allSubmissions.filter((item) => item.pgFlag !== 's').findIndex((item) => item.id == homework.detail?.my_homework) + 1;
                homework.detail.is_excellent = Number(mhw.is_excellent);
                homework.detail.average_score = allSubmissions.filter((item) => item.pgFlag !== 's').map((item) => Number(item.score)).reduce((a, b) => a + b, 0) / allSubmissions.filter((item) => item.pgFlag !== 's').length;
                homework.detail.comment = mhw.content;
            }
        }
        el_alert({
            title: '作业细节更新',
            message: `${new Date().toLocaleString()}`,
            type: 'success',
            showClose: true,
            duration: 1000
        });
    } catch (error) {
        el_alert({
            title: '作业细节加载失败',
            message: `${error}`,
            type: 'error',
            showClose: true,
            duration: 0
        });
    } finally {
        // isLoading.value = false;
    }
}
const active_colomn = ref('0')


onMounted(() => {
    try {
        userStore.addTaskToQueue(UPDATE_HOMEWORKSTask);
        userStore.addTaskToQueue(update_homeworkdetail_Task);
    } catch (error) {
        console.error('获取作业列表失败:', error)
    }
})
</script>
<style lang="scss" scoped>
.hwitem {
    background-color: rgba(224, 219, 219, 0.425);
    width: 95%;
}
</style>