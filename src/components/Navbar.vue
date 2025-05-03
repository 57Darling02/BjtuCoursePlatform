<template>
    <div id="nav" style="flex: 1;">
        <el-row style="width: 100%;height: 100%;">
            <el-col :span="12" justify="start">
                <div style="display: flex;width: 100%;height: 100%;justify-content: start; font-weight: 700;" id="title">
                    <el-text @click="visible = true">课程平台青春版</el-text>
                </div>
            </el-col>
            <el-col :span="12" justify="end">
                <div style="display: flex;height: 100%;justify-content: end;" id="menu">
                    <el-icon @click="visible = true"><UserFilled /></el-icon>
                </div>
            </el-col>
        </el-row>
    </div>
    <el-drawer v-model="visible" :size="300" :append-to-body="true" :destroy-on-close="true"
        :before-close="handleBeforeClose">
        <Submenu v-if="visible"/>
    </el-drawer>
</template>

<script lang='ts' setup>
import { UserFilled } from '@element-plus/icons-vue'
import { ref } from 'vue'
import Submenu from './Submenu.vue';
const visible = ref(false)
const handleBeforeClose = (done: () => void) => {
    // 立即销毁子组件
    visible.value = false
    // 等待下一帧执行关闭动画
    setTimeout(done, 200)
}
</script>


<style lang="scss">
.ep-bg-purple {
    background-color: black;
    height: 100%;
}

#nav {
    border-bottom: 1px solid transparent;
    /* 初始设置为透明边框 */
    box-shadow: 0 0 0 rgba(202, 199, 199, 0);
    border-bottom-left-radius: 15px;
    border-bottom-right-radius: 15px;
    background-color: rgba(255, 255, 255, 0.888);
}

#menu,
#title
{
    align-items: center;
    padding-right: 10px;
    padding-left: 10px;
    
}

.action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 0;
}
</style>