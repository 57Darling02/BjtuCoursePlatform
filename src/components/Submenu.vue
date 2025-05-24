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
                    <el-tag round :type="userStore.status_ve ? 'success' : 'danger'" style="margin-right: 5px;"
                        :effect="userStore.status_ve ? 'light' : 'dark'">
                        {{ userStore.status_ve ? '✅' : '🚫' }}ve服务器
                    </el-tag>
                    <el-tag round :type="userStore.status_app ? 'success' : 'danger'"
                        :effect="userStore.status_app ? 'light' : 'dark'">
                        {{ userStore.status_app ? '✅' : '🚫' }}app服务器
                    </el-tag>
                </el-descriptions-item>
                
            </el-descriptions>
            <NavMoudule/>
        </div>



    </el-card>
</template>
<script lang='ts' setup>
import NavMoudule from '@/module/NavModule.vue'
import { useUserStore } from '@/stores/user'
import { onMounted, onUnmounted, ref } from 'vue';
const userStore = useUserStore()
const loading = ref(true)
const avatarSrc = ref<string>("")



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