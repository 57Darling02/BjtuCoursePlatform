<script setup lang="ts">
import Loading from './components/Loading.vue';
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
userStore.isLoading = true;

const showNotice = () => {
  ElMessageBox.confirm(
    '由于课程平台官方追着封ip，请迁移至http备用站点继续使用服务。',
    '重要提示',
    {
      confirmButtonText: '前往备用站点',
      cancelButtonText: '暂不迁移',
      type: 'warning',
    }
  ).then(() => {
    window.location.href = 'http://hw.57d02.cn:8080';
  }).catch(() => {
    showNotice();
  });
}
// showNotice();
onMounted(() => {
  setTimeout(() => {
    userStore.isLoading = false;
  }, 500);
})

</script>

<template>
  <Loading v-if="userStore.isLoading" />

  <div id="mainview">
    <RouterView />
  </div>
</template>

<style lang="scss">
$white_bg: rgba(255, 255, 255, 0.888);

#mainview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

%card-base {
  background: $white_bg;
  border-radius: 12px;
  padding: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin: 10px 0;
  position: relative;
  z-index: 2;
}

.a-card {
  @extend %card-base;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }

  padding: 1.5;
}

.a-card-static {
  @extend %card-base;
  margin-right: 10px;
  margin-left: 10px;
  padding: 1.5rem;
}
</style>
