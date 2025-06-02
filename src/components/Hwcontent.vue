<template>
    <template v-if="isLoading">
        <div class="a-card">
            <el-skeleton :rows="2" animated class="skeleton-header" />
        </div>
        <div class="a-card">
            <el-skeleton :rows="1" animated class="skeleton-header" />
            <el-skeleton v-for="m in 2" :key="m" :rows="2" animated class="homework-skeleton" style="margin: 12px 0;" />
        </div>
    </template>
    <template v-else>
        <el-dialog v-model="prewiewVisible" style="display: flex;flex-direction: column;background-color: antiquewhite;" :title="prewiewfile.file_name" fullscreen append-to-body destroy-on-close>
            <div style="width: 100%;height: fit-content;background-color: aliceblue;">
                <iframe style="width: 100%;height: 85vh;" v-if="prewiewfile.convert_url != null" :src="`/static/pdfjs-5.2.133-dist/web/viewer.html?file=/api/pdf/${prewiewfile.convert_url}`"
                frameborder="0"></iframe>
            </div>
        </el-dialog>
        <div v-html="homeworkdetail.content" />
        <el-divider />
        <div class="file" v-for="(i, index) in homeworkdetail.FileList" :key="index">
            <h3>附件{{ index + 1 }}:{{ i.file_name }}
                <el-button type="info" @click="prewiewVisible = true; prewiewfile = i;"
                    v-if="i.convert_url?.endsWith('docx') || i.convert_url?.endsWith('pdf')" round>预览</el-button>
                <el-button type="primary" @click="" round><a :href="`/api/pdf/${i.convert_url}`" :download="i.file_name"
                        style="color: inherit; text-decoration: none">
                        下载
                    </a></el-button>
            </h3>
            <el-divider />
        </div>

    </template>


</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getHomeworkDetail, getHomeworkDetail_pg } from '@/api/api_ve';
import { type HomeWorkDetail, type HomeworkFile } from '@/api';
import { useUserStore } from '@/stores/user'
import { el_alert } from '@/utils';
const userStore = useUserStore()
const props = defineProps({
    id: {
        type: Number,
        required: true,
    },
});
const homeworkdetail = ref<HomeWorkDetail>({} as HomeWorkDetail)
const prewiewVisible = ref(false)
const prewiewfile = ref({} as HomeworkFile)
const isLoading = ref(true)

onMounted(async () => {
    try {
        homeworkdetail.value = await getHomeworkDetail(props.id)
        
    } catch (error) {
        await userStore.checkAuth_ve()
        el_alert({
            title:'错误',
            message:'奇怪？怎么找不到作业详情',
            type:'error'
        })
    } finally {
        isLoading.value = false;
    }
})
</script>

<style scoped>
</style>