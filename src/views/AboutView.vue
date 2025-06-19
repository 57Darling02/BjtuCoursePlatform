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
            <el-space class="a-card-static" wrap>
                <ProfieldCard :avatar="Darling02" name="57Darling02" position="" bio="朴素的胆小鬼" />
                <ProfieldCard :avatar="stdm" name="上条当咩" position="" bio="也许是个体育生" />
            </el-space>
        </template>
    </div>

</template>
<script lang='ts' setup>
import { ref } from 'vue';
import { useUserStore } from '@/stores/user'
const userStore = useUserStore();
import NavMoudule from '@/module/NavModule.vue'
import ProfieldCard from '@/components/ProfileCard.vue'
const isLoading = ref(false);
import stdm from '@/assets/team/stdm.jpg'
import Darling02 from '@/assets/team/57Darling02.jpg'

</script>
<style lang="scss" scoped></style>
