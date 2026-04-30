<template>
    <el-card shadow="never" style="border: none;">
        <el-skeleton v-if="loading" :rows="5" animated />
        <div class="sidebar-container" v-show="userStore.userinfo" v-else>
            <el-descriptions direction="vertical" :column="2" size="default">
                <el-descriptions-item label="" align="center" :rowspan="2">
                    <el-avatar :size="70" fit="cover" loading="lazy" :src="avatarSrc" @error="() => true" />
                </el-descriptions-item>

                <!-- 基础信息 -->
                <el-descriptions-item label="姓名">
                    {{ userStore.userinfo.name || '--' }}

                </el-descriptions-item>
                <el-descriptions-item :label="userStore.userinfo.roleCode === 'xs' ? '学号' : '工号'">
                    {{ userStore.userinfo.id || '--' }}
                </el-descriptions-item>
                <el-descriptions-item label="学院">
                    {{ userStore.userinfo.department || '未分配' }}
                </el-descriptions-item>
                <el-descriptions-item label="专业" v-if="userStore.userinfo.major">
                    {{ userStore.userinfo.major || '未分配' }}
                </el-descriptions-item>
                <el-descriptions-item label="身份" :span="2">
                    <el-tag round type="success" v-for="i in userStore.userinfo.role" style="margin-right: 5px;"
                        effect="plain">
                        {{ i }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="资料同步" :span="2">
                    {{ profileSyncedAt }}
                </el-descriptions-item>
                <el-descriptions-item label="会话状态" :span="2">
                    <div class="status-row" :title="statusHint" @click="handleStatusAction">
                        <span>{{ statusSyncedAt }}，</span>
                        <el-tag round :type="statusOk ? 'success' : 'danger'" :effect="statusOk ? 'light' : 'dark'">
                            {{ statusOk ? '✅已连接' : '🚫未连接' }}
                        </el-tag>
                    </div>
                </el-descriptions-item>
            </el-descriptions>
        </div>
    </el-card>
</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import { computed, onMounted, ref } from 'vue';
const userStore = useUserStore()
const loading = computed(() => userStore.isLoading && !userStore.userinfo)
const reconnecting = ref(false)
const avatarSrc = computed(() => userStore.Cache['avatar'] || userStore.userinfo?.avatarPath || '')
const statusOk = computed(() => userStore.connectionStatus === true)
const formatSyncTime = (timestamp: number) => {
    if (!timestamp) return '尚未同步'
    return new Date(timestamp).toLocaleString()
}
const profileSyncedAt = computed(() => formatSyncTime(userStore.dataTimestamps.userInfo))
const statusSyncedAt = computed(() => formatSyncTime(userStore.dataTimestamps.status))
const statusHint = computed(() => statusOk.value ? '点击刷新状态' : '点击尝试重连')

const runStatusRefresh = async () => {
    if (reconnecting.value) return
    reconnecting.value = true
    try {
        await userStore.refreshConnectionStatus({ silent: true })
    } finally {
        reconnecting.value = false
    }
}

const handleStatusAction = async () => {
    if (reconnecting.value) return
    reconnecting.value = true
    try {
        if (statusOk.value) {
            await userStore.refreshConnectionStatus({ silent: true })
            return
        }
        await userStore.reconnect()
    } finally {
        reconnecting.value = false
    }
}

onMounted(() => {
    void runStatusRefresh()
})
</script>
<style lang="scss" scoped>
.sidebar-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.status-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    color: #334155;
    font-size: 13px;
}
</style>
