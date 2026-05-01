<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { ScrollbarInstance } from 'element-plus'
import { throttle } from 'lodash-es'
import Navbar from '@/components/Navbar.vue'
import { useUserStore } from '@/stores/user'
import { showAboutDialog } from '@/utils/aboutDialog'
const version = '2.0.0'; // 版本号 大版本.小版本.修复版本/patch版本
const userStore = useUserStore()
const last_scrollY = ref(0)
const scrollbarRef = ref<ScrollbarInstance>()
const show_navbar = ref(true)

const scroll = throttle(({ scrollTop }: { scrollTop: number }) => {
  const wrap = scrollbarRef.value?.wrapRef
  if (!wrap) return
  const [clientHeight, scrollHeight] = [wrap.clientHeight, wrap.scrollHeight]
  const normalizedScrollTop = ~~scrollTop 
  const remaining = scrollHeight - normalizedScrollTop - clientHeight
  show_navbar.value = (remaining <= 1 || normalizedScrollTop < last_scrollY.value)
  last_scrollY.value = normalizedScrollTop
}, 200, { trailing: true })

const footer_content = ['Powered by 57Darling02 © 2025']

const showNotice = () => {
  ElMessageBox.confirm(
    '欢迎使用课程平台青春版！',
    '重要提示',
    {
      confirmButtonText: '前往备用站点',
      // cancelButtonText: '暂不迁移',
      type: 'warning',
    }
  ).then(() => {
    // window.location.href = 'http://hw.57d02.cn:8080';
  }).catch(() => {
    // showNotice();
  });
}
onMounted(() => {
  userStore.addTaskToQueue(async () => {
    await userStore.reconnectOnFirstEntryIfDisconnected()
  })
  userStore.refreshUserInfo({ silent: true })
  scrollbarRef.value?.update()
  const current_version = localStorage.getItem('version')
  if (current_version === version) return
  void showAboutDialog(version).catch(() => undefined)
  localStorage.setItem('version', version)
  // showNotice()
})
onUnmounted(() => scroll.cancel())
</script>
<template>
  <transition name="el-fade-in">
    <div id="header_container" v-show="show_navbar">
      <Navbar />
    </div>
  </transition>
  <el-scrollbar ref="scrollbarRef" always @scroll="scroll">
    <div id="nav_fill_space" />
    <div style="width: 100%; height: 100%; display: flex; justify-content: center;">
      <RouterView />
    </div>
    <el-divider />
    <el-space id="footer" wrap>
      <el-tag effect="light" type="success" v-for="i in footer_content" round>
        {{ i }}
      </el-tag>
      <el-tag effect="light" type="success" round>
        本站总访问量<span id="vercount_value_site_pv">-</span>次
      </el-tag>
    </el-space>
  </el-scrollbar>
</template>
<style lang="scss" scoped>
$header_container-size: 50px;
$footer_size: 50px;

#header_container {
  top: 0;
  left: 0;
  width: 100vw;
  height: $header_container-size;
  z-index: 100;
  position: fixed;
  display: flex;
}

#nav_fill_space {
  height: $header_container-size;
}

#footer {
  display: flex;
  // background-color: aliceblue;
  width: 100vw;
  height: $footer_size;
  bottom: 0;
  align-items: center;
  justify-content: center;
}
</style>
