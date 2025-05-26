<template>
   <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 985px;width: 100%;">
      <CourseModule></CourseModule>
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import CourseModule from '@/module/CourseModule.vue';
const userStore = useUserStore();
userStore.isLoading = true;
import { onMounted } from 'vue';
onMounted(() => {
    userStore.isLoading = false;
});
</script>
