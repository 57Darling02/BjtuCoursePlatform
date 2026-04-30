<template>
    <el-tabs type="card" :lazy="true" v-model="active_tab"
        style="width: 100%;height: 100%;display: 100%; border-radius: 12px;">
        <el-tab-pane label="相关信息" name="相关信息" style="display: flex;height: 100%;">
            <el-scrollbar height="100%" style="width: 100%;">
                <PublicHwPanel :activehomework="ActiveHomework" />
                <el-divider />
                <Hwcontent :id="ActiveHomework.id" />
            </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="我的作业" name="我的作业" v-if="ActiveHomework.detail && ActiveHomework.detail?.my_homework"
            class="scroll-tab-pane">
            <el-scrollbar height="100%" style="width: 100%;">
                <h3 v-if="ActiveHomework.status == 2">✒️分数:{{ ActiveHomework.detail?.score }}</h3>
                <HwStucontent :id="ActiveHomework.detail?.my_homework" :ipId="ActiveHomework.id"
                    v-if="active_tab == '我的作业'" />

                <h3 v-if="ActiveHomework.detail?.comment">🧑‍🏫老师评价:{{ ActiveHomework.detail?.is_excellent == 1 ? '🤩' :
                    '' }}</h3>
                <div v-html="ActiveHomework.detail?.comment" />
                <el-divider v-if="ActiveHomework.detail?.comment" />
                <el-row>
                    <el-col :span="18">
                        <el-button type="primary" @click="" style="width: 95%" round>修改作业</el-button>
                    </el-col>
                    <el-col :span="6">
                        <el-button type="danger" @click="handleDelHw" style="width: 95%" round>删除作业</el-button>
                    </el-col>
                </el-row>
            </el-scrollbar>
        </el-tab-pane>
        <el-tab-pane label="优秀作业" name="优秀作业" style="height: 100%;"
            v-if="ActiveHomework?.detail?.topFive?.length && ActiveHomework?.detail?.topFive?.length > 0">
            <el-tabs tab-position="right" v-if="ActiveHomework.detail.courseNoteList" style="height: 100%;"
                v-model="active_tab3">
                <el-tab-pane v-for="(i, index) in ActiveHomework.detail.topFive" style="height: 100%;"
                    :label="`${ActiveHomework.detail.courseNoteList[index].stu_name}`" :name="index">
                    <el-scrollbar height="100%" style="width: 100%;">
                        <h3>✒️分数:{{ ActiveHomework.detail.courseNoteList[index].score }}
                            🪜排名:{{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                        <!-- <Hwcontent :id="i" v-if="active_tab == '优秀作业' && active_tab3 == index" /> -->
                        <a :href="`api/downloadZyFj.shtml?path=&filename=${ActiveHomework.detail.courseNoteList[index].stu_name}&id=${ActiveHomework.detail.courseNoteList[index].id}`"
                            :download="ActiveHomework.detail.courseNoteList[index].stu_id"
                            style="color: inherit; text-decoration: none">
                            下载(不知道会下到谁的作业)
                        </a>
                        
                        <h3>🧑‍🏫老师评价:{{ ActiveHomework.detail.courseNoteList[index].is_excellent == '1' ? '🤩' : ''
                            }}</h3>
                        <div v-html="ActiveHomework.detail.courseNoteList[index].content" />
                    </el-scrollbar>
                </el-tab-pane>
            </el-tabs>
        </el-tab-pane>
        <el-tab-pane label="其他人" name="其他人" style="height: 100%;"
            v-if="ActiveHomework?.detail?.courseNoteList?.length && ActiveHomework?.detail?.courseNoteList?.length > 0">
            <el-tabs tab-position="right" style="height: 100%;"
                v-if="ActiveHomework.detail.courseNoteList && active_tab == '其他人'" v-model="active_tab2">
                <el-tab-pane v-for="(i, index) in ActiveHomework.detail.courseNoteList" :label="`${i.stu_name}`"
                    style="height: 100%;" :name="index">
                    <el-scrollbar height="100%" style="width: 100%;">
                        <h3 v-if="ActiveHomework.detail.courseNoteList[index].score">✒️分数:{{
                            ActiveHomework.detail.courseNoteList[index].score }};
                            {{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                        <a
                            :href="`api/back/coursePlatform/homeWork.shtml?method=batchDownloadWorks&id=${ActiveHomework.id}`">下载所有人作业</a>
                        <!-- <a :href="`api/downloadZyFj.shtml?filename=${ActiveHomework.detail.courseNoteList[index].stu_name}&id=${ActiveHomework.detail.courseNoteList[index].id}`"
                            :download="ActiveHomework.detail.courseNoteList[index].stu_id"
                            style="color: inherit; text-decoration: none">
                            下载
                        </a> -->
                        <!-- <button @click="console.log(`api/downloadZyFj.shtml?filename=${ActiveHomework.detail.courseNoteList[index].stu_name}&id=${ActiveHomework.detail.courseNoteList[index].id}`,ActiveHomework.detail.courseNoteList[index])">aaa</button> -->
                        <h3>🧑‍🏫老师评价:{{ i.is_excellent == '1' ? '🤩' : '' }}</h3>
                        <div v-html="i.content" />
                    </el-scrollbar>
                </el-tab-pane>
            </el-tabs>
        </el-tab-pane>
    </el-tabs>
</template>
<script lang='ts' setup>
import { ref, type PropType } from 'vue'
import { type HomeworkItem } from '@/api';
import PublicHwPanel from './PublicHwPanel.vue';
import Hwcontent from '@/components/Hwcontent.vue'
import HwStucontent from '@/components/HwStucontent.vue'

import { deleteHomework, getHomeworkDetail_pg } from '@/api/api_ve';
import { emitter } from '@/utils';
const props = defineProps({
    activehomework: {
        type: Object as PropType<HomeworkItem>,
        required: true
    }
})
const ActiveHomework = props.activehomework
const active_tab = ref('相关信息')
const active_tab2 = ref(0)
const active_tab3 = ref(0)

if (ActiveHomework.detail?.my_homework) {
    getHomeworkDetail_pg(ActiveHomework.detail?.my_homework, ActiveHomework.id, 1)
}


const handleDelHw = () => {
    if (ActiveHomework.status == 2) {
        ElMessage({
            type: 'error',
            message: '已批改的作业不能删除，不许删!',
        })
        return
    } else if (ActiveHomework.subStatus == 2) {
        ElMessage({
            type: 'error',
            message: '老师不允许补交，不许删！',
        })
        // return
    }
    ElMessageBox.confirm(
        '确认删除作业?',
        '删除作业', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        roundButton: true,
        customStyle: {
            borderRadius: '12px', // 圆角  
        },
        type: 'warning',
    }).then(async () => {
        // 调用删除接口
        ActiveHomework.detail?.my_homework && await deleteHomework(ActiveHomework.detail?.my_homework)
        emitter.emit('UPDATE_HOMEWORKS')
        ElNotification({
            title: '删除成功',
            message: '作业已删除',
            type: 'success',
            duration: 800,
        })
    }).catch(() => {
        ElNotification({
            title: '提示',
            message: '取消删除操作',
            type: 'info',
            duration: 800,
        })
    })

}


</script>
<style lang="scss" scoped>
:deep(.el-dialog__body) {
    flex: 1;
    display: flex;
}

.scroll-tab-pane {
    height: 100%;
    display: flex;

    /* 滚动区域样式 */
    .custom-scroll {
        flex: 1;

        :deep(.el-scrollbar__wrap) {
            max-height: 100vh;
            /* 限制最大高度 */
            overflow-x: hidden;
        }
    }
}
</style>
