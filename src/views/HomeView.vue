<template>
   <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 985px;width: 100%;">
      <div class="a-card-static">
         <NavModule/>
      </div>
         <div>
            <DayCourseModule v-if="userStore.status_app" />
         </div>
      
      
      <div>
         <HomeWorkModule />
      </div>
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import HomeWorkModule from '@/module/HomeWorkModule.vue'
import DayCourseModule from '@/module/DayCourseModule.vue';
import NavModule from '@/module/NavModule.vue';
const userStore = useUserStore();
</script>
