<template>
    <el-row :gutter="20" style="width: 100%;">
        <el-col class="course_name">{{ hw.course_name }} {{ ['作业', '报告', '实验'][hw.subType as number] }}</el-col>
        <el-col :xs="24" :sm="16" :md="16">
            <h3 class="title">{{ hw.title }}</h3>
            <el-space wrap>
                <el-tag type="info">📅{{ hw.create_date.split(' ')[0] }}</el-tag>
                <el-tag type="info">🚫{{ hw.end_time.split(' ')[0] }}</el-tag>
                <el-tag>👥已完成:{{ hw.submitCount }}/{{ hw.allCount }}</el-tag>
                <el-tag type="danger" v-if="hw.status == 0 && hw.subStatus != 2">⏳<el-countdown
                        :style="{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }"
                        value-style="color: #666; font-size: 14px; font-weight: 700; height:100%; display:flex "
                        format="DD[天] HH:mm:ss"
                        :value="new Date(hw.makeup_time ? hw.makeup_time : hw.end_time).getTime()" /></el-tag>
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

        <AddHwPanel v-if="showaddhw" :hwid="hw.id" :courseId="`${hw.course_id}`" />
        <div v-else>
            <el-text v-if="hw.status == 1">
                您的作业状态已经提交过了，如果再次提交，将会覆盖之前的作业。
            </el-text>
            <el-text v-else-if="hw.status == 2">
                您的作业状态已经完成了批改，如果再次提交，将会覆盖之前的作业，并且成绩会被重置。
            </el-text>
            <el-text v-else-if="hw.subStatus == 2 && hw.status == 0">
                没办法咯，您的作业已经过期了，无法再次提交。不过你可以试试,服务器接不接受我就管不着了。
                如果实在来不及交作业，建议先提交点什么东西，使用覆盖提交实现作业修改。
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