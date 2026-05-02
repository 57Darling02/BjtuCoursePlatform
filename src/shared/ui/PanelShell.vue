<template>
    <div class="module-surface">
        <div class="module-header">
            <el-text class="module-title">{{ title }}</el-text>
            <div v-if="$slots.meta" class="module-meta">
                <slot name="meta" />
            </div>
            <div v-if="$slots.actions" class="module-actions">
                <slot name="actions" />
            </div>
        </div>
        <div class="module-content">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string
}>()
</script>

<style lang="scss" scoped>
.module-surface {
    padding: 16px 18px;
    border-radius: 20px;
}

.module-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.module-title {
    font-size: 16px;
    font-weight: 600;
    color: #2f3f57;
}

.module-meta {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
}

.module-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.module-content {
    flex: 1;
}
</style>
