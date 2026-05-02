<template>
   <div class="view-page-shell">
      <TodayScheduleSection v-if="userStore.connectionStatus" />
      <HomeworkOverviewSection />
   </div>

</template>
<script lang='ts' setup>
import { useUserStore } from '@/stores/user'
import HomeworkOverviewSection from '@/features/homework/containers/HomeworkOverviewSection.vue'
import TodayScheduleSection from '@/features/schedule/containers/TodayScheduleSection.vue'
const userStore = useUserStore();
</script>
