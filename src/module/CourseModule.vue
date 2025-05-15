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
                <el-tag type="warning" round>共{{ userStore.courseList.length }} 门</el-tag>
            </el-space>
            <el-collapse v-model="active_colomn" accordion>
                <el-collapse-item v-for="item in userStore.courseList" :key="item.id" :name="item.name" class="a-card">
                    <template #title>
                        <el-space wrap>
                            <el-text>{{ item.name }}</el-text>
                        </el-space>
                    </template>
                    <el-row v-for="i in functionList" class="a-card hwitem" :gutter="12"
                        v-if="active_colomn == item.name" @click="i.function(item)">
                        {{ i.text }}
                    </el-row>
                </el-collapse-item>

            </el-collapse>
        </div>
    </template>
    <el-dialog v-if="activeCourseInfo" v-model="DialogVisible" :title="activeCourseInfo.name"
        style="flex-direction: column;display: flex;overflow: hidden;" fullscreen destroy-on-close
        body-class="full-dialog-body" header-class="full-dialog-header">
        <CoursewarePanel :course_num="activeCourseInfo.course_num" :fz_id="activeCourseInfo.fz_id" :xq_code="activeCourseInfo.xq_code"/>
    </el-dialog>
</template>
<script lang='ts' setup>
import {  ref } from 'vue';
import { useUserStore } from '@/stores/user'
import type { CourseInfo } from '@/api';
import CoursewarePanel from '@/views/CoursewarePanel.vue';
const active_colomn = ref('0')
const userStore = useUserStore();


const activeCourseInfo = ref<CourseInfo | null>(null)
const DialogVisible = ref(false);
const isLoading = ref(false);

const functionList = [
    { text: '查看课件', type: 'info', function: (courseInfo: CourseInfo) => { activeCourseInfo.value = courseInfo; DialogVisible.value = true } },
    { text: '查看课程回放', type: 'info', function: (courseInfo: CourseInfo) => { activeCourseInfo.value = courseInfo; DialogVisible.value = true } },
]







</script>
<style lang="scss" scoped>
.hwitem {
    background-color: rgba(224, 219, 219, 0.425);
    width: 95%;
    padding-left: 23px;
}
</style>