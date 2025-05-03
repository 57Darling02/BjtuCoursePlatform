<script setup lang="ts">
import Bg_StarrySky from '@/components/Bg_StarrySky.vue'
</script>

<template>
  <div id="mainview">
    <RouterView/>
  </div>
  <Bg_StarrySky style="z-index: -1;"/>
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
  padding: 2rem;
  transition: all 0.3s ease;
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
}

.a-card-static {
  @extend %card-base;
  margin-right: 10px;
  margin-left: 10px;
}
</style>
