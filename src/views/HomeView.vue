<template>
   <div class="view-page-shell">
      <DayCourseModule v-if="userStore.connectionStatus" />
      <HomeWorkModule />
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import HomeWorkModule from '@/module/HomeWorkModule.vue'
import DayCourseModule from '@/module/DayCourseModule.vue';
const userStore = useUserStore();
</script>
