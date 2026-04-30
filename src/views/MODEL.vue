<template>
    <div class="view-page-shell">
        <template v-if="isLoading">
            <div class="model-loading-shell view-soft-surface">
                <el-skeleton :rows="1" animated class="skeleton-header" />
                <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton"
                    style="margin: 12px 0;" />
            </div>
        </template>
        <template v-else>
            <DayCourseModule />
            <div class="model-panel view-soft-surface">
                hahaha
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
.model-loading-shell {
    flex: 1;
    padding: 18px;
}

.model-panel {
    min-height: 180px;
    padding: 20px;
    border-radius: 20px;
    color: #30435f;
}
</style>
