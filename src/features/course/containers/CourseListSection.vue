<template>
    <PanelShell title="课程列表">
        <template #meta>
            <el-space v-if="userStore.courseList.length > 0" wrap :size="5">
                <el-tag type="warning" round>共{{ userStore.courseList.length }} 门</el-tag>
            </el-space>
        </template>
        <template #actions>
            <el-button
                class="module-refresh-btn"
                text
                :loading="userStore.courseListLoading"
                :disabled="userStore.courseListLoading"
                @click="triggerManualRefresh"
            >
                <i v-if="!userStore.courseListLoading" class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                {{ courseUpdatedAtText }}
            </el-button>
        </template>
        <el-collapse v-model="activeColumn" accordion>
            <div class="fade-item" v-for="(item, index) in userStore.courseList" :key="item.id"
                :style="{ '--delay': (0.2 + index * 0.05) + 's' }">
                <el-collapse-item :name="item.name" class="a-card">
                    <template #title>
                        <el-space wrap>
                            <el-text>{{ item.name }}</el-text>
                        </el-space>
                    </template>
                    <el-row v-for="(i, index) in functionList" :key="i.text"
                        :style="{ '--delay': (0.2 + index * 0.05) + 's' }" class="a-card hwitem fade-item" :gutter="12"
                        @click="i.function(item)">
                        <span class="course-action">
                            <i :class="['course-action-icon', i.icon]" aria-hidden="true"></i>
                            <span>{{ i.text }}</span>
                        </span>
                    </el-row>
                </el-collapse-item>
            </div>
        </el-collapse>
    </PanelShell>
</template>
<script lang='ts' setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useUserStore } from '@/stores/user'
import type { CourseInfo } from '@/api';
import PanelShell from '@/shared/ui/PanelShell.vue';
import router from '@/router';
import { formatMonthDayTime } from '@/utils';
const userStore = useUserStore();

const activeColumn = ref(userStore.courseList.length > 0 ? userStore.courseList[0].name : ''); // 默认展开第一门课程

const courseUpdatedAtText = computed(() => {
    return formatMonthDayTime(userStore.dataTimestamps.courseList || 0)
})

const triggerManualRefresh = async () => {
    if (userStore.courseListLoading) return

    try {
        await userStore.reconnectOnFirstEntryIfDisconnected({ notifyOnFailure: true })
        await userStore.refreshUserInfo({ force: true, silent: true })
    } catch (error) {
        console.error('刷新课程列表失败:', error)
    }
}

watch(() => userStore.courseList, (courseList) => {
    if (courseList.length === 0) {
        activeColumn.value = ''
        return
    }

    if (!courseList.some(course => course.name === activeColumn.value)) {
        activeColumn.value = courseList[0].name
    }
}, { immediate: true })

onMounted(() => {
    void userStore.refreshUserInfo({ silent: true })
        .catch((error) => {
            console.error('初始化课程列表失败:', error)
        })
})

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
