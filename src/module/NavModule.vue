<template>
    <!-- Action Buttons -->
    <el-space wrap>
        <el-button v-for="i in actionButtons" :type="i.type" style="" @click="i.function" round>{{ i.text
        }}</el-button>
    </el-space>
</template>

<script lang="ts" setup>
import router from '@/router';
import { nextTick } from 'vue';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore()

const actionButtons = [
    { text: '主页/作业', type: 'info', function: () => { router.push({ name: 'homespace' });nextTick() } },
    { text: '课程学习', type: 'info', function: () => { router.push({ name: 'learnspace' });nextTick() } },
    { text: '同步密码', type: 'primary', function: userStore.handleSyncPassword },
    { text: '进入课程平台', type: 'success', function: userStore.go_kcpt },
    { text: '退出登录', type: 'danger', function: userStore.handlelogout },
]


</script>

<style scoped>
.custom-style .el-segmented {
    --el-segmented-item-selected-color: var(--el-text-color-primary);
    --el-segmented-item-selected-bg-color: #ffd100;
    --el-border-radius-base: 16px;
}
</style>