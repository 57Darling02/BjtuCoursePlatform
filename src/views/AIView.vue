<template>
    <div class="view-page-shell">
        <template v-if="isLoading">
            <div class="ai-loading-shell view-soft-surface">
                <el-skeleton :rows="1" animated class="skeleton-header" />
                <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton"
                    style="margin: 12px 0;" />
            </div>
        </template>
        <template v-else>
            <DayCourseModule />
            <div class="ai-frame-shell view-soft-surface">
                <iframe class="ai-frame" src="https://aiservice.bjtu.edu.cn/robots/?#/cover" />
            </div>
        </template>
    </div>

</template>
<script lang='ts' setup>
import { ref } from 'vue';
import DayCourseModule from '@/module/DayCourseModule.vue'

const isLoading = ref(false);



</script>
<style lang="scss" scoped>
.ai-loading-shell {
    flex: 1;
    padding: 18px;
}

.ai-frame-shell {
    min-height: 800px;
    padding: 12px;
    display: flex;
}

.ai-frame {
    width: 100%;
    flex: 1;
    border: 0;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.86);
}
</style>
