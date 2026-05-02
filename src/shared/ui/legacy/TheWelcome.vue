<template>
    <el-card shadow="never" style="border: none;">
        <el-skeleton v-if="loading" :rows="5" animated />
        <div class="sidebar-container" v-show="userStore.userinfo" v-else>
            <el-descriptions direction="vertical" :column="2" size="default">
                <el-descriptions-item label="" align="center" :rowspan="2">
                    <el-avatar :size="70" fit="cover" loading="lazy"
                        :src="'api/download.shtml?p=photo&f=' + userStore.userinfo.avatarPath" />
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
                    <el-tag type="success" v-for="i in userStore.userinfo.role" style="margin-right: 5px;">
                        {{ i }}
                    </el-tag>
                </el-descriptions-item>
            </el-descriptions>
            <!-- Action Buttons -->
            <template v-for="i in actionButtons">
                <el-divider />
                <el-button :type="i.type" style="width: 100%;" @click="i.function">{{ i.text }}</el-button>
            </template>
        </div>



    </el-card>
</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import { computed, onMounted, ref } from 'vue';
const userStore = useUserStore()
const loading = ref(true)

// Action Buttons
const actionButtons = computed(() => [
    { text: '进入课程平台', type: 'success', function: userStore.go_kcpt },
    { text: '检查状态', type: 'info', function: () => { } },
    { text: '修改密码', type: 'primary', function: () => { } },
    { text: '退出登录', type: 'danger', function: userStore.handlelogout },
])

onMounted(() => setTimeout(() => loading.value = false, 300))

</script>
<style lang="scss" scoped></style>