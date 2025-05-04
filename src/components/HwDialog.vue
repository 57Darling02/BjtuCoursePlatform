<template>
    <el-tabs type="border-card" :lazy="true" v-model="active_tab" style="width: 100%;height: 100%;display: 100%;">
        <el-tab-pane label="相关信息" name="相关信息" style="display: flex;height: 100%;">
            <el-scrollbar height="100%">>
                <PublicHwPanel :activehomework="ActiveHomework" />
                <el-divider />
                <Hwcontent :id="ActiveHomework.id" />
            </el-scrollbar>


        </el-tab-pane>

        <el-tab-pane label="我的作业" name="我的作业" v-if="ActiveHomework.detail && ActiveHomework.detail?.my_homework"
            class="scroll-tab-pane">
            <el-scrollbar height="100%">
                <h3 v-if="ActiveHomework.detail?.score">✒️分数:{{ ActiveHomework.detail?.score }}</h3>
                <Hwcontent :id="ActiveHomework.detail?.my_homework" v-if="active_tab == '我的作业'" />
                <h3 v-if="ActiveHomework.detail?.comment">🧑‍🏫老师评价:{{ ActiveHomework.detail?.is_excellent == 1 ? '🤩' :
                    '' }}</h3>
                <div v-html="ActiveHomework.detail?.comment" />
            </el-scrollbar>

        </el-tab-pane>

        <el-tab-pane label="优秀作业" name="优秀作业" style="height: 100%;"
            v-if="ActiveHomework?.detail?.topFive?.length && ActiveHomework?.detail?.topFive?.length > 0">
                <el-tabs tab-position="right" v-if="ActiveHomework.detail.courseNoteList" style="height: 100%;"
                    v-model="active_tab3">
                    <el-tab-pane v-for="(i, index) in ActiveHomework.detail.topFive" style="height: 100%;"
                        :label="`${ActiveHomework.detail.courseNoteList[index].stu_name}`" :name="index">
                        <el-scrollbar height="100%">
                            <h3>✒️分数:{{ ActiveHomework.detail.courseNoteList[index].score }}
                                🪜排名:{{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                            <Hwcontent :id="i" v-if="active_tab == '优秀作业' && active_tab3 == index" />
                            <h3>🧑‍🏫老师评价:{{ ActiveHomework.detail.courseNoteList[index].is_excellent == '1' ? '🤩' : ''
                            }}</h3>
                            <div v-html="ActiveHomework.detail.courseNoteList[index].content" />
                        </el-scrollbar>
                    </el-tab-pane>
                </el-tabs>


        </el-tab-pane>
        <el-tab-pane label="关羽赏花" name="关羽赏花" style="height: 100%;"
            v-if="ActiveHomework?.detail?.courseNoteList?.length && ActiveHomework?.detail?.courseNoteList?.length > 0">
                <el-tabs tab-position="right" style="height: 100%;"
                    v-if="ActiveHomework.detail.courseNoteList && active_tab == '关羽赏花'" v-model="active_tab2">
                    <el-tab-pane v-for="(i, index) in ActiveHomework.detail.courseNoteList" :label="`${i.stu_name}`" style="height: 100%;"
                        :name="index">
                        <el-scrollbar height="100%">
                            <h3>✒️分数:{{ ActiveHomework.detail.courseNoteList[index].score }};
                                {{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                            <Hwcontent :id="i.id" v-if="active_tab2 == index" />
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

</script>
<style lang="scss" scoped>
/* 深度选择器穿透组件样式 */
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