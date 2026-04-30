<template>
    <div class="loading-screen" role="status" aria-live="polite" aria-label="页面加载中">
        <div class="loading-panel">
            <span class="loading-mark" aria-hidden="true"></span>
            <span class="loading-text">加载中</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.loading-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    color: #475569;
    background: rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(5px);
}

.loading-panel {
    display: grid;
    justify-items: center;
    gap: 14px;
}

.loading-mark {
    width: 54px;
    height: 54px;
    border: 4px solid rgba(148, 163, 184, 0.34);
    border-top-color: #111827;
    border-radius: 50%;
    box-sizing: border-box;
    animation: loading-spin 0.9s linear infinite;
}

.loading-text {
    font-size: 14px;
    line-height: 1;
    letter-spacing: 0;
}

@keyframes loading-spin {
    to {
        transform: rotate(1turn);
    }
}
</style>
