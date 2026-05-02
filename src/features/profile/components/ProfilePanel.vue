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
                <el-descriptions-item :span="2">
                    <div class="status-panel" :class="statusPanelClass">
                        <div class="status-main">
                            <div class="status-indicator">
                                <span class="status-dot" />
                                <span class="status-title">{{ statusTitle }}</span>
                            </div>
                            <el-text size="small" class="status-subtext">
                                {{ statusSubtext }}
                            </el-text>
                        </div>
                        <el-button class="status-action" size="default" :type="statusActionType" plain
                            :loading="isCheckingStatus" :disabled="isCheckingStatus" @click="handleStatusAction">
                            <i v-if="!isCheckingStatus" class="fa-solid fa-rotate-right" aria-hidden="true"></i>
                            {{ statusActionText }}
                        </el-button>
                    </div>
                </el-descriptions-item>
                <el-descriptions-item :span="2">
                    <div class="developer-mode-row">
                        <span class="developer-mode-label">开发者模式</span>
                        <el-switch v-model="developerModeEnabled" :before-change="beforeDeveloperModeSwitchChange" />
                    </div>
                </el-descriptions-item>
            </el-descriptions>
            <el-button class="full-refresh-btn" type="primary" plain :loading="fullRefreshing"
                :disabled="reconnecting || fullRefreshing" @click="handleFullRefresh" round>
                <i v-if="!fullRefreshing" class="fa-solid fa-rotate" aria-hidden="true"></i>
                重新加载全部数据
            </el-button>
            <el-button class="relogin-btn" type="danger" plain :disabled="reconnecting || fullRefreshing"
                @click="handleRelogin" round>
                <i class="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
                退出登录
            </el-button>
        </div>
    </el-card>
</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import { beforeDeveloperModeSwitchChange, developerModeEnabled, emitter } from '@/utils';
import { computed, onMounted, ref } from 'vue';
const userStore = useUserStore()
const loading = computed(() => userStore.isLoading && !userStore.userinfo)
const reconnecting = ref(false)
const fullRefreshing = ref(false)
const avatarSrc = computed(() => userStore.Cache['avatar'] || userStore.userinfo?.avatarPath || '')
const isCheckingStatus = computed(() => reconnecting.value || fullRefreshing.value)
const sessionStatus = computed<'ok' | 'bad'>(() => {
    return userStore.connectionStatus === true ? 'ok' : 'bad'
})
const statusPanelClass = computed(() => `is-${sessionStatus.value}`)
const statusTitle = computed(() => {
    return sessionStatus.value === 'ok' ? '会话已连接' : '会话未连接'
})
const statusSubtext = computed(() => {
    return sessionStatus.value === 'ok'
        ? '可以正常访问课程平台数据。'
        : '会话已过期，请尝试重连。'
})
const statusActionType = computed(() => {
    return sessionStatus.value === 'ok' ? 'primary' : 'danger'
})
const statusActionText = computed(() => {
    return sessionStatus.value === 'ok' ? statusSyncedAt.value : '点击尝试重连'
})
const formatSyncTime = (timestamp: number) => {
    if (!timestamp) return '尚未同步'
    return new Date(timestamp).toLocaleString()
}
const statusSyncedAt = computed(() => formatSyncTime(userStore.dataTimestamps.status))

const runStatusRefresh = async () => {
    if (reconnecting.value || fullRefreshing.value) return
    reconnecting.value = true
    try {
        await userStore.refreshConnectionStatus({ silent: true })
    } finally {
        reconnecting.value = false
    }
}

const handleStatusAction = async () => {
    if (reconnecting.value || fullRefreshing.value) return
    reconnecting.value = true
    try {
        if (userStore.connectionStatus === true) {
            await userStore.refreshConnectionStatus({ silent: true })
            return
        }
        await userStore.reconnect()
    } finally {
        reconnecting.value = false
    }
}

const handleFullRefresh = async () => {
    if (fullRefreshing.value || reconnecting.value) return
    fullRefreshing.value = true
    try {
        await userStore.reconnectOnFirstEntryIfDisconnected({ notifyOnFailure: true })
        await userStore.refreshConnectionStatus({ silent: true, force: true })
        userStore.refreshUserInfo({ force: true, silent: true })
        await new Promise<void>((resolve) => {
            userStore.addTaskToQueue(async () => {
                await userStore.refreshHomeworks({ force: true, silent: true })
                resolve()
            })
        })
        emitter.emit('REFRESH_DAY_COURSE')
    } finally {
        fullRefreshing.value = false
    }
}

const handleRelogin = () => {
    void userStore.handlelogout()
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

.relogin-btn {
    width: 100%;
    margin-left: 0;
}

.full-refresh-btn {
    width: 100%;
    margin-left: 0;
}

.full-refresh-btn .fa-rotate {
    margin-right: 6px;
    font-size: 12px;
}

.status-panel {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.status-panel.is-ok {
    border-color: #bbf7d0;
    background: linear-gradient(180deg, #f7fee7 0%, #f0fdf4 100%);
}

.status-panel.is-bad {
    border-color: #fecaca;
    background: linear-gradient(180deg, #fef2f2 0%, #fff1f2 100%);
}

.status-main {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}

.status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.14);
}

.status-panel.is-ok .status-dot {
    background: #16a34a;
    box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.14);
}

.status-title {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
}

.status-subtext {
    color: #475569;
    line-height: 1.45;
}

.status-action {
    width: 100%;
    justify-content: center;
}

.status-action .fa-rotate-right {
    margin-right: 6px;
    font-size: 12px;
}

.developer-mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.developer-mode-label {
    color: var(--el-text-color-primary);
    font-size: 14px;
}
</style>
