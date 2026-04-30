<template>
    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 985px;width: 100%;">
        <div class="a-card-static">
                <NavMoudule />
            </div>
        <template v-if="isLoading">
            <div class="a-card-static" style="flex: 1;">
                <el-skeleton :rows="1" animated class="skeleton-header" />
                <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton"
                    style="margin: 12px 0;" />
            </div>
        </template>
        <template v-else>
            
            <div class="a-card-static" v-html="compiledMarkdown"></div>
            <!-- <iframe class="a-card-static" src="/readme.html" style="min-height: 500px;"/> -->
            <el-space class="a-card-static" wrap>
                
                <ProfieldCard :avatar="Darling02" name="57Darling02" position="" bio="朴素的胆小鬼" />
                <ProfieldCard :avatar="stdm" name="上条当咩" position="" bio="也许是个体育生" />
  
            </el-space>
        </template>
        
    </div>

</template>
<script lang='ts' setup>
import { onMounted, ref } from 'vue';

import NavMoudule from '@/module/NavModule.vue'
import ProfieldCard from '@/components/ProfileCard.vue'
const isLoading = ref(true);
import stdm from '@/assets/team/stdm.jpg'
import Darling02 from '@/assets/team/57Darling02.jpg'

const compiledMarkdown = ref('');

const fetchMarkdown = async () => {
    try {
        const baseUrl = 'https://alist.57d02.cn/d/Huawei/.Alist/Nginx/BJTUCoursePlatForm/README.md?sign=hULDNWPRyFFSokskbIGYXXEH2s7l6t3i1WII3d5GGO8=:0';
        // 添加时间戳参数，确保每次请求 URL 不同
        const urlWithTimestamp = `${baseUrl}&timestamp=${new Date().getTime()}`;
        const response = await fetch(urlWithTimestamp);
        const markdownText = await response.text();
        compiledMarkdown.value = (markdownText);
    } catch (error) {
        console.error('获取 Markdown 文件失败:', error);
    } finally {
        isLoading.value = false;
    }
};
onMounted(() => {
    fetchMarkdown();
});
</script>
<style lang="scss" scoped></style>
