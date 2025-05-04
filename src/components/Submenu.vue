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
                    <el-tag type="success" v-for="i in userStore.userinfo.role" style="margin-right: 5px;"
                        effect="plain">
                        {{ i }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="状态" :span="2">
                    <el-tag :type="userStore.status_ve ? 'success' : 'danger'" style="margin-right: 5px;"
                        :effect="userStore.status_ve ? 'light' : 'dark'">
                        {{ userStore.status_ve ? '✅' : '🚫' }}ve服务器
                    </el-tag>
                    <el-tag :type="userStore.status_app ? 'success' : 'danger'"
                        :effect="userStore.status_app ? 'light' : 'dark'"
                        @click="handleSyncPassword">
                        {{ userStore.status_app ? '✅' : '🚫' }}app服务器
                    </el-tag>
                </el-descriptions-item>

            </el-descriptions>
            <!-- Action Buttons -->
            <template v-for="i in actionButtons">
                <el-divider />
                <el-button :type="i.type" style="width: 100%;" @click="i.function" round>{{ i.text }}</el-button>
            </template>
        </div>



    </el-card>
</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { modifyPassword } from '@/api/api_ve';
import { el_alert } from '@/utils';
const userStore = useUserStore()
const loading = ref(true)
const avatarSrc = ref<string>("")
// Action Buttons
const handleSyncPassword = () => {
    ElMessageBox.confirm(
        '使用统一认证登入时，如果课程平台密码与认证密码不相同, 将无法提供由轻新课堂APP服务器接口提供的当日课程等功能。您可以选择同步认证密码和课程平台的密码?',
        '同步密码',
        {
            confirmButtonText: '同步',
            cancelButtonText: '蒜鸟',
            type: 'info',
        }
    )
        .then(() => {
            modifyPassword(userStore.password)
        })
        .catch(() => {
            el_alert({
                type: 'info',
                message: '同步了也没啥影响，建议同步',
            })
        })
}

const actionButtons = computed(() => [
    { text: '进入课程平台', type: 'success', function: userStore.go_kcpt },
    { text: '同步密码以连接app服务器', type: 'primary', function: handleSyncPassword},
    { text: '退出登录', type: 'danger', function: userStore.handlelogout },

])


onMounted(async () => {
    await userStore.checkAuth_force()
    loading.value = false
    setTimeout(() => {
        avatarSrc.value = userStore.Cache['avatar'];
    }, 200);
})
onUnmounted(() => {
    document.querySelectorAll('.el-popper').forEach(el => el.remove())
})
</script>
<style lang="scss" scoped></style>