<template>
    <el-row :gutter="20" style="width: 100%;">
        <el-col class="course_name">{{ hw.course_name }} {{ ['作业', '报告', '实验'][hw.subType as number] }}</el-col>
        <el-col :xs="24" :sm="16" :md="16">
            <h3 class="title">{{ hw.title }}</h3>
            <el-space wrap>
                <el-tag type="info"><i class="fa-solid fa-calendar-days tag-icon" />{{ hw.create_date.split(' ')[0] }}</el-tag>
                <el-tag type="info"><i class="fa-solid fa-ban tag-icon" />{{ hw.end_time.split(' ')[0] }}</el-tag>
                <el-tag><i class="fa-solid fa-users tag-icon" />已完成:{{ hw.submitCount }}/{{ hw.allCount }}</el-tag>
                <el-tag type="warning" v-if="isReturned"><i class="fa-solid fa-reply tag-icon" />被打回</el-tag>
                <el-tag type="danger" v-if="hw.status == 0 && hw.subStatus != 2 && !isReturned">
                    <i class="fa-solid fa-hourglass-half tag-icon" />
                    <el-countdown
                        :style="{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }"
                        value-style="color: #666; font-size: 14px; font-weight: 700; height:100%; display:flex "
                        format="DD[天] HH:mm:ss"
                        :value="countdownTarget" /></el-tag>
                <el-tag type="success" v-if="hw.detail && hw.detail.score">
                    <i class="fa-solid fa-pen-to-square tag-icon" />分数:{{ hw.detail.score }}/{{ hw.full_score }}</el-tag>
                <el-tag type="info" v-if="hw.detail && hw.detail.rank">
                    <i class="fa-solid fa-ranking-star tag-icon" />排名:{{ hw.detail.rank }}/{{ hw.submitCount }}</el-tag>
            </el-space>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8">
            <el-button round style="width: 100%" class="a-card" :class="button_status.type" @click="openSubmitDialog">
                <i class="fa-solid status-icon" :class="button_status.icon" />
                {{ button_status.text }}
            </el-button>
        </el-col>
    </el-row>

    <el-dialog align-center v-model="addhwdialog" width="90%" :title="hw.title" v-if="hw" destroy-on-close
        append-to-body style="border-radius: 12px;">

        <AddHwPanel
            v-if="showaddhw"
            :hwid="hw.id"
            :courseId="`${hw.course_id}`"
            :force_push="forceOpenSubmit && isForcePushScenario"
            :return_num="hw.return_num || 0"
            :fz="hw.fz ?? 0"
        />
        <div v-else class="blocked-submit-tip">
            <el-text v-if="isReturned">
                作业已被老师打回，可修改后重新提交。
            </el-text>
            <el-text v-else-if="hw.status == 1">
                您的作业状态已经提交过了，如果再次提交，将会覆盖之前的作业。
            </el-text>
            <el-text v-else-if="hw.status == 2">
                您的作业状态已经完成了批改，如果再次提交，将会覆盖之前的作业，并且成绩会被重置。
            </el-text>
            <el-text v-else-if="hw.subStatus == 2 && hw.status == 0">
                作业已过截止时间，且当前不允许补交。如果您确实需要提交，请点击下方的“我就是要交！”按钮（后果自负！！！）。
            </el-text>
            <el-button
                v-if="canForceOpenSubmitPanel"
                type="danger"
                plain
                round
                @click="forceOpenSubmitPanel"
            >
                我就是要交！
            </el-button>
        </div>
    </el-dialog>


</template>
<script lang='ts' setup>
import type { HomeworkItem } from '@/api';
import { computed, onMounted, onUnmounted, ref, type PropType } from 'vue';
import AddHwPanel from '@/features/homework/components/AddHwPanel.vue';
import { emitter } from '@/utils';
const props = defineProps({
    activehomework: {
        type: Object as PropType<HomeworkItem>,
        required: true
    }
})
const hw = computed(() => props.activehomework)
const addhwdialog = ref(false)
const forceOpenSubmit = ref(false)
const isReturned = computed(() => hw.value.returned === true || String(hw.value.return_flag ?? '') === '1' || hw.value.sub_status_text === '被打回')
const countdownTarget = computed(() => {
    const now = Date.now();
    const endTime = new Date(hw.value.end_time).getTime();
    const makeupTime = hw.value.makeup_time ? new Date(hw.value.makeup_time).getTime() : endTime;
    return now < endTime ? endTime : makeupTime;
});

const canSubmitAgain = computed(() => hw.value.is_repeat === 1 || isReturned.value)
const canOpenSubmitPanel = computed(() => {
    if (hw.value.status === 2) return false
    if (hw.value.status === 1) return canSubmitAgain.value
    if (hw.value.subStatus === 2 && !isReturned.value) return false
    return true
})
const isForcePushScenario = computed(() => hw.value.status === 0 && hw.value.subStatus === 2 && !isReturned.value)
const showaddhw = computed(() => canOpenSubmitPanel.value || forceOpenSubmit.value)
const canForceOpenSubmitPanel = computed(() => {
    if (canOpenSubmitPanel.value) return false
    if (hw.value.status === 1 || hw.value.status === 2) return true
    return isForcePushScenario.value
})

const openSubmitDialog = () => {
    forceOpenSubmit.value = false
    addhwdialog.value = true
}

const forceOpenSubmitPanel = () => {
    forceOpenSubmit.value = true
}
const button_status = computed(() => {
    if (isReturned.value) {
        return { text: '待重交', type: 'warning', icon: 'fa-reply' }
    }
    if (hw.value.status == 0) {
        if (hw.value.subStatus == 0) {
            return { text: '待提交', type: 'warning', icon: 'fa-hourglass-half' }
        } else if (hw.value.subStatus == 1) {
            return { text: '待补', type: 'danger', icon: 'fa-hourglass-half' }
        } else {
            return { text: '过期', type: 'danger', icon: 'fa-clock' }
        }
    } else if (hw.value.status == 1) {
        return { text: '已提交', type: 'success', icon: 'fa-circle-check' }
    } else {
        return { text: '已批改', type: 'success', icon: 'fa-square-check' }
    }
})
const handleUpdateHomeworks = () => {
    addhwdialog.value = false;
    forceOpenSubmit.value = false
}

onMounted(() => {
    emitter.on('UPDATE_HOMEWORKS', handleUpdateHomeworks)
})

onUnmounted(() => {
    emitter.off('UPDATE_HOMEWORKS', handleUpdateHomeworks)
})

defineExpose({
    openSubmitDialog,
})

</script>
<style lang="scss" scoped>
.course_name {
    font-size: 0.8em;
    color: #b4b9be;

}

.warning {
    background: rgba(255, 165, 0, 0.2);
    color: #FFA500;
}

.danger {
    background: rgba(255, 0, 0, 0.2);
    color: #FF0000;
}

.success {
    background: rgba(0, 128, 0, 0.2);
    color: #006400;
}

.tag-icon {
    margin-right: 4px;
}

.status-icon {
    margin-right: 6px;
}

.blocked-submit-tip {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
</style>
