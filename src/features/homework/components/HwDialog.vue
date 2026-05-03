<template>
    <el-tabs type="card" :lazy="true" v-model="active_tab"
        style="width: 100%;height: 100%;display: 100%; border-radius: 12px;">
        <el-tab-pane label="相关信息" name="相关信息" style="display: flex;height: 100%;">
            <el-scrollbar height="100%" style="width: 100%;">
                <PublicHwPanel ref="publicHwPanelRef" :activehomework="ActiveHomework" />
                <el-button
                    v-if="developerModeEnabled"
                    type="warning"
                    plain
                    round
                    :loading="detailLoading"
                    :disabled="detailLoading"
                    @click="handleDeveloperTest"
                >
                    开发者测试
                </el-button>
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
                        <el-button type="primary" @click="handleEditHw" style="width: 95%" round>修改作业</el-button>
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
                <el-tab-pane v-for="(submission, index) in topFiveSubmissions" style="height: 100%;"
                    :label="submission.stu_name" :name="index">
                    <el-scrollbar height="100%" style="width: 100%;">
                        <div v-if="active_tab == '优秀作业' && active_tab3 == index" class="submission-detail-card">
                            <el-space wrap class="submission-meta">
                                <el-tag type="success" round>优秀作业</el-tag>
                                <el-tag v-if="submission.score !== null && submission.score !== ''" type="warning" round>
                                    分数: {{ submission.score }}
                                </el-tag>
                                <el-tag type="info" round>
                                    排名: {{ getSubmissionRank(submission.id) }}/{{ ActiveHomework.submitCount }}
                                </el-tag>
                                <el-tag v-if="submission.finalScore" type="primary" round>
                                    最终分: {{ submission.finalScore }}
                                </el-tag>
                            </el-space>

                            <el-descriptions :column="2" border class="submission-descriptions">
                                <el-descriptions-item label="姓名">{{ submission.stu_name }}</el-descriptions-item>
                                <el-descriptions-item label="学号">{{ submission.stu_num || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="提交时间">{{ submission.createTime || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="组名">{{ submission.groupName || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="评阅方式">{{ submission.review_method || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="提交状态">{{ formatSubmissionStatus(submission) }}</el-descriptions-item>
                            </el-descriptions>

                            <!-- <a
                                class="submission-download-link"
                                :href="`api/downloadZyFj.shtml?path=&filename=${submission.stu_name}&id=${submission.id}`"
                                :download="submission.stu_id"
                            >
                                下载该同学作业
                            </a> -->

                            <el-divider content-position="left">作业评价</el-divider>
                            <div class="submission-content" v-html="submission.content || '<p>暂无内容</p>'" />
                        </div>
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
                        <div v-if="active_tab2 == index" class="submission-detail-card">
                            <el-space wrap class="submission-meta">
                                <el-tag v-if="i.score !== null && i.score !== ''" type="warning" round>
                                    分数: {{ i.score }}
                                </el-tag>
                                <el-tag type="info" round>
                                    排名: {{ getSubmissionRank(i.id) }}/{{ ActiveHomework.submitCount }}
                                </el-tag>
                                <el-tag v-if="i.is_excellent == '1'" type="success" round>优秀</el-tag>
                                <el-tag v-if="i.finalScore" type="primary" round>最终分: {{ i.finalScore }}</el-tag>
                                <el-tag v-if="i.return_num > 0" type="danger" round>被打回 {{ i.return_num }} 次</el-tag>
                            </el-space>

                            <el-descriptions :column="2" border class="submission-descriptions">
                                <el-descriptions-item label="姓名">{{ i.stu_name }}</el-descriptions-item>
                                <el-descriptions-item label="学号">{{ i.stu_num || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="提交时间">{{ i.createTime || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="组名">{{ i.groupName || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="评阅方式">{{ i.review_method || '--' }}</el-descriptions-item>
                                <el-descriptions-item label="提交状态">{{ formatSubmissionStatus(i) }}</el-descriptions-item>
                            </el-descriptions>

                            <el-space wrap class="submission-actions">
                                <!-- <a
                                    class="submission-download-link"
                                    :href="`api/downloadZyFj.shtml?path=&filename=${i.stu_name}&id=${i.id}`"
                                    :download="i.stu_id"
                                >
                                    下载该同学作业
                                </a>
                                <a
                                    class="submission-download-link"
                                    :href="`api/back/coursePlatform/homeWork.shtml?method=batchDownloadWorks&id=${ActiveHomework.id}`"
                                >
                                    下载所有人作业
                                </a> -->
                            </el-space>

                            <el-divider content-position="left">作业内容</el-divider>
                            <div class="submission-content" v-html="i.content || '<p>暂无内容</p>'" />
                        </div>
                    </el-scrollbar>
                </el-tab-pane>
            </el-tabs>
        </el-tab-pane>
    </el-tabs>
</template>
<script lang='ts' setup>
import { computed, ref, type PropType } from 'vue'
import { type HomeworkItem, type StudentSubmission } from '@/api';
import PublicHwPanel from './PublicHwPanel.vue';
import Hwcontent from '@/features/homework/components/Hwcontent.vue'
import HwStucontent from '@/features/homework/components/HwStucontent.vue'
import { useUserStore } from '@/stores/user'

import { deleteHomework, getHomeworkDetail_pg } from '@/api/api_ve';
import { developerModeEnabled, el_alert, emitter } from '@/utils';
const props = defineProps({
    activehomework: {
        type: Object as PropType<HomeworkItem>,
        required: true
    }
})
const userStore = useUserStore()
const ActiveHomework = props.activehomework
const active_tab = ref('相关信息')
const active_tab2 = ref(0)
const active_tab3 = ref(0)
const detailLoading = ref(false)
const publicHwPanelRef = ref<InstanceType<typeof PublicHwPanel> | null>(null)
const allSubmissions = computed(() => ActiveHomework.detail?.courseNoteList ?? [])
const topFiveSubmissions = computed(() => {
    const topFiveIds = new Set(ActiveHomework.detail?.topFive ?? [])
    return allSubmissions.value.filter((submission) => topFiveIds.has(submission.id))
})

const getSubmissionRank = (submissionId: number) => {
    const rank = allSubmissions.value.findIndex((submission) => submission.id === submissionId)
    return rank >= 0 ? rank + 1 : '--'
}

const formatSubmissionStatus = (submission: StudentSubmission) => {
    if (submission.return_flag === '1') return '被打回'
    if (submission.pgFlag === 's') return '待批改'
    return '已批改'
}

const ensureHomeworkDetailLoaded = async (options: { force?: boolean } = {}) => {
    if (detailLoading.value) return
    detailLoading.value = true
    try {
        await userStore.refreshHomeworkDetail(ActiveHomework.id, {
            silent: true,
            force: options.force ?? false,
        })
    } finally {
        detailLoading.value = false
    }
}

if (ActiveHomework.detail?.my_homework) {
    getHomeworkDetail_pg(ActiveHomework.detail?.my_homework, ActiveHomework.id, 1)
}

const handleDeveloperTest = async () => {
    const teacherIdInput = await ElMessageBox.prompt(
        '注意，如果老师正在使用教师账号批改作业，这会导致老师掉线，请谨慎使用！',
        '越权探测',
        {
            confirmButtonText: '执行',
            cancelButtonText: '取消',
            inputPlaceholder: '请输入课程教师的 教师工号',
            closeOnClickModal: false,
        }
    ).catch(() => null)

    if (!teacherIdInput) return
    const teacherId = teacherIdInput.value.trim()
    if (!teacherId) {
        el_alert({ title: '参数不完整', message: '请输入 teacher_id 后再执行开发者测试', type: 'warning' })
        return
    }

    try {
        const { restored } = await userStore.runWithTemporaryAccount(
            { username: teacherId, password: 'devtest', loginType: '2' },
            () => ensureHomeworkDetailLoaded({ force: true })
        )
        el_alert({
            title: '测试完成',
            message: restored
                ? `已切换教师账号并执行 getHomeWorkDetailList 请求，courseId=${ActiveHomework.course_id}`
                : '请求已执行，但原账号恢复重连失败，请手动重连一次',
            type: restored ? 'success' : 'warning',
        })
    } catch (error) {
        console.error('开发者测试失败:', error)
        el_alert({
            title: '测试失败',
            message: error instanceof Error ? error.message : '切换账号或请求作业详情失败',
            type: 'error',
        })
    }
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
        '确认删除作业?此接口已被封禁',
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

const handleEditHw = () => {
    active_tab.value = '相关信息'
    publicHwPanelRef.value?.openSubmitDialog()
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

.submission-detail-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 4px 0 12px;
}

.submission-meta,
.submission-actions {
    row-gap: 8px;
}

.submission-descriptions {
    :deep(.el-descriptions__label) {
        width: 88px;
    }
}

.submission-content {
    line-height: 1.75;
    color: #334155;
    word-break: break-word;
}

.submission-download-link {
    color: #315d97;
    text-decoration: none;
}

.submission-download-link:hover {
    text-decoration: underline;
}
</style>
