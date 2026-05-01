<template>
    <template v-if="isLoading">
        <div class="module-surface module-loading">
            <el-skeleton :rows="1" animated class="skeleton-header" />
            <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton" style="margin: 12px 0;" />
        </div>
    </template>
    <template v-else>
        
        <div class="module-surface">
            <div class="module-header">
                <el-text class="module-title">课程列表</el-text>
                <el-space class="module-tags" wrap :size="5">
                    <el-tag type="warning" round>共{{ userStore.courseList.length }} 门</el-tag>
                </el-space>
            </div>
            <el-collapse v-model="active_colomn" accordion>
                <div class="fade-item" v-for="(item, index) in userStore.courseList" :style="{ '--delay': (0.2 + index * 0.05) + 's' }">
                    <el-collapse-item :key="item.id" :name="item.name" class="a-card">
                        <template #title>
                            <el-space wrap>
                                <el-text>{{ item.name }}</el-text>
                            </el-space>
                        </template>
                        <el-row v-for="(i, index) in functionList" :style="{ '--delay': (0.2 + index * 0.05) + 's' }"
                            class="a-card hwitem fade-item" :gutter="12" @click="i.function(item)">
                            <span class="course-action">
                                <i :class="['course-action-icon', i.icon]" aria-hidden="true"></i>
                                <span>{{ i.text }}</span>
                            </span>
                        </el-row>
                    </el-collapse-item>

                </div>

            </el-collapse>
        </div>
    </template>

</template>
<script lang='ts' setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user'
import type { CourseInfo } from '@/api';
const userStore = useUserStore();
import router from '@/router';
const isLoading = ref(false);
const active_colomn = ref(userStore.courseList.length > 0 ? userStore.courseList[0].name : ''); // 默认展开第一门课程
const functionList = [
    {
        text: '查看课件',
        icon: 'fa-solid fa-file-lines',
        type: 'info',
        function: (courseInfo: CourseInfo) => {
            const route = router.resolve({
                name: 'courseware',
                query: {
                    course_num: courseInfo.course_num,
                    fz_id: courseInfo.fz_id,
                    xq_code: courseInfo.xq_code
                }
            });
            window.open(route.href, '_blank');
        }
    },
    {
        text: '查看课程回放',
        icon: 'fa-solid fa-circle-play',
        type: 'info',
        function: (courseInfo: CourseInfo) => {
            const route = router.resolve({
                name: 'course-replay',
                query: {
                    courseId: courseInfo.course_num,
                    cId: courseInfo.id,
                    xkhId: courseInfo.fz_id,
                    xqCode: courseInfo.xq_code,
                    teacherId: courseInfo.teacher_id,
                    courseToPage: 10480,
                    dataSource: 1,
                }
            });
            window.open(route.href, '_blank');
        }
    },
]







</script>
<style lang="scss" scoped>
.module-surface {
    padding: 16px 18px;
    border-radius: 20px;
}

.module-loading {
    flex: 1;
}

.module-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.module-title {
    font-size: 16px;
    font-weight: 600;
    color: #2f3f57;
}

.module-tags {
    flex: 1;
}

.hwitem {
    background-color: rgba(240, 245, 252, 0.82);
    width: 95%;
    padding: 10px 23px;
    cursor: pointer;
}

.course-action {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: #324765;
    font-size: 14px;
    line-height: 1.4;
}

.course-action-icon {
    width: 16px;
    text-align: center;
    color: #5a78a5;
    font-size: 13px;
    transform: translateY(-0.5px);
}

.hwitem:hover .course-action {
    color: #223856;
}

.hwitem:hover .course-action-icon {
    color: #345b8f;
}
</style>
