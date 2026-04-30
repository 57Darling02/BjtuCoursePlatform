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
                <el-descriptions-item label="状态" :span="2">
                    <div class="status-row" @click="handleReconnect">
                        <el-tag round :type="userStore.status_ve ? 'success' : 'danger'"
                            :effect="userStore.status_ve ? 'light' : 'dark'">
                            {{ reconnecting ? '🔄' : userStore.status_ve ? '✅' : '🚫' }}网页端
                        </el-tag>
                        <el-tag round :type="userStore.status_app ? 'success' : 'danger'"
                            :effect="userStore.status_app ? 'light' : 'dark'">
                            {{ reconnecting ? '🔄' : userStore.status_app ? '✅' : '🚫' }}app
                        </el-tag>
                    </div>
                </el-descriptions-item>

            </el-descriptions>


            <NavMoudule />
            <el-divider />
            <el-row>
                <el-text style="font-size: 14px; font-weight: bold; color: var(--el-text-color-primary); margin-bottom: 10px;">
                    个人中心
                </el-text>
            </el-row>
            <!-- Action Buttons -->
            <el-space wrap>
                <el-button v-for="i in actionButtons" :type="i.type" style="" @click="i.function" round>{{ i.text
                    }}</el-button>

            </el-space>

        </div>



    </el-card>
</template>
<script lang='ts' setup>
import NavMoudule from '@/module/NavModule.vue'
import { useUserStore } from '@/stores/user'
import { onMounted, onUnmounted, ref } from 'vue';
const userStore = useUserStore()
const loading = ref(true)
const reconnecting = ref(false)
const avatarSrc = ref<string>("")
const actionButtons = [
    { text: '同步密码', type: 'primary', function: userStore.handleSyncPassword },
    { text: '进入课程平台', type: 'success', function: userStore.go_kcpt },
    { text: '退出登录', type: 'danger', function: userStore.handlelogout },
]

const handleReconnect = async () => {
    if (reconnecting.value) return
    reconnecting.value = true
    try {
        await userStore.reconnect()
    } finally {
        reconnecting.value = false
    }
}

onMounted(async () => {
    reconnecting.value = true
    try {
        await userStore.reconnect({ notify: false })
    } finally {
        reconnecting.value = false
    }
    loading.value = false
    setTimeout(() => {
        avatarSrc.value = userStore.Cache['avatar'];
    }, 200);
})
onUnmounted(() => {
    document.querySelectorAll('.el-popper').forEach(el => el.remove())
})
</script>
<style lang="scss" scoped>
.status-row {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    cursor: pointer;
}
</style>
