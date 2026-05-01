<script setup lang="ts">

import Loading from './components/Loading.vue';
import BgStarrySkySass from './components/Bg_StarrySkySass.vue';
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
userStore.isLoading = true;


// showNotice();
onMounted(() => {
  setTimeout(() => {
    userStore.isLoading = false;
  }, 500);
})

</script>

<template>
  <BgStarrySkySass />
  <Loading v-if="userStore.isLoading" />

  <div id="mainview">
    <RouterView />
  </div>
</template>

<style lang="scss">
$white_bg: rgba(255, 255, 255, 0.888);

#mainview {
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

@media (max-width: 768px) {
  #mainview {
    align-items: stretch;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

%card-base {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(164, 188, 221, 0.2);
  border-radius: 22px;
  padding: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 18px rgba(49, 93, 151, 0.08);
  margin: 10px 0;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(4px);
}

.a-card {
  @extend %card-base;

  &:hover {
    
    box-shadow: 0 10px 22px rgba(49, 93, 151, 0.12);
  }

  padding: 1.25rem;
}

.a-card-static {
  @extend %card-base;
  margin-right: 10px;
  margin-left: 10px;
  padding: 1.25rem;
}

.view-page-shell {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 0 4px 12px;
  box-sizing: border-box;
}

.view-soft-surface {
  border-radius: 20px;
  border: 1px solid rgba(156, 183, 218, 0.2);
  background: linear-gradient(180deg, rgba(252, 254, 255, 0.85), rgba(239, 248, 255, 0.78));
}

.el-message-box.about-message-box.a-card {
  @extend %card-base;
  box-sizing: border-box;
  width: min(92vw, 420px);
  max-width: 420px;
  margin: 0;
  padding: 1.25rem;
}

.el-message-box.about-message-box.a-card .el-message-box__content {
  padding: 4px 18px 10px;
}

.about-dialog-content {
  line-height: 1.75;
  color: #334155;
}
</style>
