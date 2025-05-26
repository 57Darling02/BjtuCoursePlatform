<template>
    <el-row>
        <el-text class="custom-style"
            style="font-size: 14px; font-weight: bold; color: var(--el-text-color-primary); margin-bottom: 10px;">
            传送门
        </el-text>
    </el-row>
    <el-space wrap>
        <el-button v-for="btn in actionButtons" :key="btn.routeName" :type="btn.type" style="" @click="btn.jump" round>
            {{ btn.text }}
        </el-button>
    </el-space>
</template>

<script lang="ts" setup>
import router from '@/router';
import { computed } from 'vue';
import { useRoute } from 'vue-router';  // 新增：获取当前路由

// 1. 定义按钮配置（核心配置，后续新增按钮只需修改此处）
const buttonConfigs = [
    { text: '主页/作业', routeName: 'homespace' },
    { text: '课程学习', routeName: 'learnspace' },
];

// 2. 获取响应式路由对象
const route = useRoute();

// 3. 动态计算按钮属性（关键逻辑）
const actionButtons = computed(() =>
    buttonConfigs.map(btn => ({
        ...btn,
        type: route.name === btn.routeName || route.matched.some(r => r.name === btn.routeName) ? 'success' : 'info',  // 路由匹配逻辑
        jump: () => {
            router.push({ name: btn.routeName });  // 跳转函数
        }
    }))
);

</script>