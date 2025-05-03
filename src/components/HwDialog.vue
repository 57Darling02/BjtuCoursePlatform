<template>
    <el-tabs type="border-card" :lazy="true" v-model="active_tab">
        <el-tab-pane label="相关信息" name="相关信息" style="display: flex;">
            <el-scrollbar height="60vh">
                <PublicHwPanel :activehomework="ActiveHomework" />
                <el-divider />
                <Hwcontent :id="ActiveHomework.id" />
            </el-scrollbar>


        </el-tab-pane>

        <el-tab-pane label="我的作业" name="我的作业" v-if="ActiveHomework.detail && ActiveHomework.detail?.my_homework">
            <el-scrollbar height="60vh">
                <h3 v-if="ActiveHomework.detail?.score">✒️分数:{{ ActiveHomework.detail?.score }}</h3>
                <Hwcontent :id="ActiveHomework.detail?.my_homework" v-if="active_tab == '我的作业'" />
                <h3 v-if="ActiveHomework.detail?.comment">🧑‍🏫老师评价:{{ ActiveHomework.detail?.is_excellent == 1 ? '🤩' :
                    '' }}</h3>
                <div v-html="ActiveHomework.detail?.comment" />
            </el-scrollbar>

        </el-tab-pane>

        <el-tab-pane label="优秀作业" name="优秀作业"
            v-if="ActiveHomework?.detail?.topFive?.length && ActiveHomework?.detail?.topFive?.length > 0">
            <el-scrollbar height="60vh">
                <el-tabs tab-position="right" style="height: 100%" v-if="ActiveHomework.detail.courseNoteList"
                    v-model="active_tab3">
                    <el-tab-pane v-for="(i, index) in ActiveHomework.detail.topFive"
                        :label="`${ActiveHomework.detail.courseNoteList[index].stu_name}`" :name="index">
                        <h3>✒️分数:{{ ActiveHomework.detail.courseNoteList[index].score }}
                            🪜排名:{{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                        <Hwcontent :id="i" v-if="active_tab == '优秀作业' && active_tab3 == index" />
                        <h3>🧑‍🏫老师评价:{{ ActiveHomework.detail.courseNoteList[index].is_excellent == '1' ? '🤩' : ''
                            }}</h3>
                        <div v-html="ActiveHomework.detail.courseNoteList[index].content" />
                    </el-tab-pane>
                </el-tabs>
            </el-scrollbar>

        </el-tab-pane>
        <el-tab-pane label="关羽赏花" name="关羽赏花"
            v-if="ActiveHomework?.detail?.courseNoteList?.length && ActiveHomework?.detail?.courseNoteList?.length > 0">
            <el-scrollbar height="60vh">
                <el-tabs tab-position="right" style="height: 60vh;"
                    v-if="ActiveHomework.detail.courseNoteList && active_tab == '关羽赏花'" v-model="active_tab2">
                    <el-scrollbar height="60vh">
                        <el-tab-pane v-for="(i, index) in ActiveHomework.detail.courseNoteList" :label="`${i.stu_name}`"
                            :name="index">
                            <h3>✒️分数:{{ ActiveHomework.detail.courseNoteList[index].score }};
                                {{ index + 1 }}/{{ ActiveHomework.submitCount }}<br /></h3>
                            <Hwcontent :id="i.id" v-if="active_tab2 == index" />
                            <h3>🧑‍🏫老师评价:{{ i.is_excellent == '1' ? '🤩' : '' }}</h3>
                            <div v-html="i.content" />
                        </el-tab-pane>
                    </el-scrollbar>

                </el-tabs>
            </el-scrollbar>


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
<style lang="scss" scoped></style>