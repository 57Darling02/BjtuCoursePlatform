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
                <el-tag type="warning" v-if="countWaitMakeup(userStore.homeworkList)" round>{{
                    countWaitMakeup(userStore.homeworkList) }}项待补交</el-tag>
                <el-tag type="warning" round>{{ countUncompleted(userStore.homeworkList) }}项待完成</el-tag>
                <el-tag type="danger" v-if="countExpired(userStore.homeworkList)" round>{{
                    countExpired(userStore.homeworkList) }}项过期</el-tag>
                <el-tag type="info" round>共{{ userStore.homeworkList.length }}项</el-tag>
            </el-space>
            <el-collapse v-model="active_colomn" accordion>
                <div class="fade-item">
                    <el-collapse-item v-for="(group, courseId, index) in groupedByCourse" :key="courseId" :name="courseId" 
                        class="a-card ">
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
                        <div class="a-card hwitem" v-if="active_colomn != courseId">
                            <el-skeleton :rows="group.items.length * 3" v-if="group.items.length > 0" animated
                                class="skeleton-header" />
                            <el-skeleton :rows="1" animated class="skeleton-header" v-else />
                        </div>
                        <el-row v-for="(hw, index) in group.items" :key="hw.id" class="a-card hwitem fade-item" :gutter="12"  :style="{ '--delay': (0.2 + index * 0.05) + 's' }"
                            @click="handleClick(hw)" v-else>
                            <PublicHwPanel :activehomework="hw" />
                        </el-row>
                        

                    </el-collapse-item>
                </div>

            </el-collapse>
        </div>
    </template>
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
import PublicHwPanel from '@/components/PublicHwPanel.vue';
import HwDialog from '@/components/HwDialog.vue';
import {
    countExpired,
    countUncompleted,
    countWaitMakeup,
    emitter,
    groupHomeworksByCourse,
} from '@/utils';
const userStore = useUserStore();


const activeHomework = ref<HomeworkItem | null>(null)
const HomeworkDialogVisible = ref(false);
const isLoading = ref(false);
if (!userStore?.homeworkList || userStore.homeworkList?.length == 0) isLoading.value = true;


const groupedByCourse = computed(() => groupHomeworksByCourse(userStore.homeworkList));

const handleClick = (hw: HomeworkItem) => {
    activeHomework.value = hw;
    HomeworkDialogVisible.value = true;
}

const refreshHomeworksTask = async () => {
    if (!userStore?.homeworkList || userStore.homeworkList?.length == 0) {
        isLoading.value = true;
    }
    try {
        await userStore.refreshHomeworks();
    } finally {
        isLoading.value = false;
    }
}

const refreshHomeworkDetailsTask = async () => {
    await userStore.refreshHomeworkDetails();
}
const active_colomn = ref('0')
emitter.on('UPDATE_HOMEWORKS', () => {
    try {
        isLoading.value = true;
        userStore.homeworkList = [];
        HomeworkDialogVisible.value = false;
        userStore.addTaskToQueue(refreshHomeworksTask);
        userStore.addTaskToQueue(refreshHomeworkDetailsTask);
    } catch (error) {
        console.error('获取作业列表失败:', error)
    }
})

onMounted(() => {
    try {
        userStore.addTaskToQueue(refreshHomeworksTask);
        userStore.addTaskToQueue(refreshHomeworkDetailsTask);
    } catch (error) {
        console.error('获取作业列表失败:', error)
    }
})
</script>
<style lang="scss" scoped>
.hwitem {
    background-color: rgba(224, 219, 219, 0.425);
    width: 95%;
    padding-left: 23px;
}
</style>
