<template>
    <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; max-width: 985px;width: 100%;">
        <template v-if="isLoading">
            <div class="a-card-static" style="flex: 1;">
                <el-skeleton :rows="1" animated class="skeleton-header" />
                <el-skeleton v-for="m in 3" :key="m" :rows="2" animated class="homework-skeleton"
                    style="margin: 12px 0;" />
            </div>
        </template>
        <template v-else>
            <div class="a-card-static">
                <NavMoudule />
            </div>
            <div class="a-card-static">
                
            </div>
        </template>
    </div>

</template>
<script lang='ts' setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user'
const userStore = useUserStore();
import NavMoudule from '@/module/NavModule.vue'

const isLoading = ref(false);



</script>
<style lang="scss" scoped>
.hwitem {
    background-color: rgba(224, 219, 219, 0.425);
    width: 95%;
    padding-left: 23px;
}
</style>
