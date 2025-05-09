<template>
   <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 985px;width: 100%;">
      <transition name="el-fade-in">
         <div>
            <DayCourseModule v-if="userStore.status_app" />
         </div>
      </transition>


      <div>
         <HomeWorkModule />
      </div>
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import HomeWorkModule from '@/module/HomeWorkModule.vue'
import DayCourseModule from '@/module/DayCourseModule.vue';
const userStore = useUserStore();
</script>
