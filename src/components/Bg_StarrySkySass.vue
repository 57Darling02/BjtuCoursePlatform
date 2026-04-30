<template>
    <div class="bg-space" />
</template>

<style lang="scss" scoped>
.bg-space {
    z-index: 0;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    pointer-events: none;
    background-color: #dceef4;
    background-image:
        radial-gradient(circle at 22% 78%, rgba(244, 232, 184, 0.58) 0%, rgba(244, 232, 184, 0) 28%),
        radial-gradient(circle at 74% 18%, rgba(214, 218, 255, 0.46) 0%, rgba(214, 218, 255, 0) 26%),
        radial-gradient(circle at 58% 62%, rgba(153, 224, 218, 0.34) 0%, rgba(153, 224, 218, 0) 34%),
        linear-gradient(160deg, #d8edf5 0%, #eaf6f7 45%, #edf5ee 72%, #d5edf1 100%);

    &::before,
    &::after {
        content: '';
        position: absolute;
        inset: 0;
    }

    &::before {
        opacity: 0.26;
        background-image:
            linear-gradient(115deg, transparent 18%, rgba(255, 255, 255, 0.52) 46%, transparent 72%),
            radial-gradient(circle at 50% 55%, rgba(255, 255, 255, 0.42), transparent 34%);
        filter: blur(18px);
    }

    &::after {
        opacity: 0.15;
        background-image:
            repeating-radial-gradient(circle at 18% 22%, rgba(255, 255, 255, 0.72) 0, rgba(255, 255, 255, 0.72) 1px, transparent 1px, transparent 7px),
            repeating-radial-gradient(circle at 72% 64%, rgba(130, 196, 203, 0.28) 0, rgba(130, 196, 203, 0.28) 1px, transparent 1px, transparent 9px);
        mix-blend-mode: screen;
    }
}
</style>
