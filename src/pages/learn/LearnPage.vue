<template>
   <div class="view-page-shell">
      <TodayScheduleSection />
      <CourseListSection></CourseListSection>
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import CourseListSection from '@/features/course/containers/CourseListSection.vue'
import TodayScheduleSection from '@/features/schedule/containers/TodayScheduleSection.vue'
const userStore = useUserStore();
userStore.isLoading = true;
import { onMounted } from 'vue';
onMounted(() => {
   userStore.isLoading = false;
});
</script>
