<template>
    <template v-if="isLoading">
        <div class="a-card-static" style="flex: 1;">
            <el-skeleton :rows="1" animated class="skeleton-header" />
            <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton" style="margin: 12px 0;" />
        </div>
    </template>
    <template v-else>
        <div class="a-card-static">
            <NavMoudule />
        </div>
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
                    <el-row v-for="i in functionList" class="a-card hwitem" :gutter="12" @click="i.function(item)">
                        {{ i.text }}
                    </el-row>

                </el-collapse-item>

            </el-collapse>
        </div>
    </template>

</template>
<script lang='ts' setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user'
import type { CourseInfo } from '@/api';
const userStore = useUserStore();
import NavMoudule from '@/module/NavModule.vue'
import router from '@/router';
const isLoading = ref(false);
const active_colomn = ref(userStore.courseList.length > 0 ? userStore.courseList[0].name : ''); // 默认展开第一门课程
const functionList = [
    {
        text: '查看课件',
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
        text: '查看课程回放', type: 'info', function: (courseInfo: CourseInfo) => {
            ElMessage.error({
                message: "没座！",
                duration: 500
            })
        }
    },
]







</script>
<style lang="scss" scoped>
.hwitem {
    background-color: rgba(224, 219, 219, 0.425);
    width: 95%;
    padding-left: 23px;
}
</style>