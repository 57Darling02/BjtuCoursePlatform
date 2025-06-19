<template>
    <el-row :gutter="20" style="width: 100%;">
        <el-col class="course_name">{{ hw.course_name }} {{ ['作业', '报告', '实验'][hw.subType as number] }}</el-col>
        <el-col :xs="24" :sm="16" :md="16">
            <h3 class="title">{{ hw.title }}</h3>
            <el-space wrap>
                <el-tag type="info">📅{{ hw.create_date.split(' ')[0] }}</el-tag>
                <el-tag type="info">🚫{{ hw.end_time.split(' ')[0] }}</el-tag>
                <el-tag>👥已完成:{{ hw.submitCount }}/{{ hw.allCount }}</el-tag>
                <el-tag type="danger" v-if="hw.status == 0 && hw.subStatus != 2"><el-countdown
                        :style="{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }"
                        value-style="color: #666; font-size: 14px; font-weight: 700; height:100%; display:flex "
                        format="⏳DD[天] HH:mm:ss"
                        :value="countdownTarget" /></el-tag>
                <el-tag type="success" v-if="hw.detail && hw.detail.score">
                    ✍️分数:{{ hw.detail.score }}/{{ hw.full_score }}</el-tag>
                <el-tag type="info" v-if="hw.detail && hw.detail.rank">
                    rank:{{ hw.detail.rank }}/{{ hw.submitCount }}</el-tag>
            </el-space>
        </el-col>
        <el-col :xs="24" :sm="8" :md="8">
            <el-button round style="width: 100%" class="a-card" :class="button_status.type" @click="addhwdialog = true">
                {{ button_status.text }}
            </el-button>
        </el-col>
    </el-row>

    <el-dialog align-center v-model="addhwdialog" width="90%" :title="hw.title" v-if="hw" destroy-on-close
        append-to-body style="border-radius: 12px;">

        <AddHwPanel v-if="showaddhw" :hwid="hw.id" :courseId="`${hw.course_id}`" :force_push="hw.subStatus == 2" />
        <div v-else>
            <el-text v-if="hw.status == 1">
                您的作业状态已经提交过了，如果再次提交，将会覆盖之前的作业。
            </el-text>
            <el-text v-else-if="hw.status == 2">
                您的作业状态已经完成了批改，如果再次提交，将会覆盖之前的作业，并且成绩会被重置。
            </el-text>
            <el-text v-else-if="hw.subStatus == 2 && hw.status == 0">
                你个大笨蛋！你的作业已经过期了，而且老师不允许你补交。将尝试强行帮你交上去，如果老师问起来，请你装傻。不然封了以后大家都没得交。
            </el-text>
            <el-divider />
            <el-button type="primary" @click="showaddhw = true">
                继续提交
            </el-button>
        </div>
    </el-dialog>


</template>
<script lang='ts' setup>
import type { HomeworkItem } from '@/api';
import { computed, ref, type PropType } from 'vue';
import AddHwPanel from '@/components/AddHwPanel.vue';
import { emitter } from '@/utils';
const props = defineProps({
    activehomework: {
        type: Object as PropType<HomeworkItem>,
        required: true
    }
})
const hw = computed(() => props.activehomework)
const addhwdialog = ref(false)
const countdownTarget = computed(() => {
    const now = Date.now();
    const endTime = new Date(hw.value.end_time).getTime();
    const makeupTime = hw.value.makeup_time ? new Date(hw.value.makeup_time).getTime() : endTime;
    return now < endTime ? endTime : makeupTime;
});

const showaddhw = ref(hw.value.status === 0 && hw.value.subStatus === 0)
const button_status = computed(() => {
    if (hw.value.status == 0) {
        if (hw.value.subStatus == 0) {
            return { text: '⏰待提交', type: 'warning' }
        } else if (hw.value.subStatus == 1) {
            return { text: '⏰待补', type: 'danger' }
        } else {
            return { text: '⏰过期', type: 'danger' }
        }
    } else if (hw.value.status == 1) {
        return { text: '✅已完成', type: 'success' }
    } else {
        return { text: '✅已批改', type: 'success' }
    }
})
emitter.on('UPDATE_HOMEWORKS', () => {
    addhwdialog.value = false;
    showaddhw.value = hw.value.status === 0 && hw.value.subStatus === 0;
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
</style>