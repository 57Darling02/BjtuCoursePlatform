<!-- 纯 CSS 星空背景 -->
 <template>
    <div class="cosmic-bg">
    <div class="stars"></div>

<!-- 流星 -->
<div class="meteor"></div>
<div class="meteor meteor-delay-1"></div>
</div>
 </template>


<style>
/* 基础背景 */
.cosmic-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at 50% 100%,
            #0a1a2f 0%,
            #3a1d6e 40%,
            #2196f3 80%,
            #00bcd4 100%);
    overflow: hidden;
}

/* 星空粒子 */
.stars {
    position: absolute;
    width: 300%;
    height: 300%;
    animation: galaxy-rotate 120s linear infinite;
    background-image:
        radial-gradient(1px 1px at 20% 30%, #00ffff 1%, transparent 100%),
        radial-gradient(1px 1px at 50% 70%, #fff 1%, transparent 100%),
        radial-gradient(1px 1px at 80% 40%, #00ffff 1%, transparent 100%);
    background-size: 300px 300px;
    transform: perspective(800px) rotateX(60deg);
    transform-style: preserve-3d;
}

@keyframes galaxy-rotate {
    from {
        transform: perspective(800px) rotateX(60deg) rotateZ(0);
    }

    to {
        transform: perspective(800px) rotateX(60deg) rotateZ(360deg);
    }
}

/* 流星效果 */
.meteor {
    position: absolute;
    width: 120px;
    height: 2px;
    background: linear-gradient(to right, #00ffff, transparent);
    animation: meteor-fall 3s linear infinite;
    opacity: 0;
    transform: rotate(-30deg);
}

.meteor-delay-1 {
    animation-delay: 1.5s;
    top: 30%;
}

@keyframes meteor-fall {
    0% {
        opacity: 0;
        transform: translateX(-100vw) rotate(-30deg);
    }

    20% {
        opacity: 0.8;
    }

    90% {
        opacity: 0.8;
    }

    100% {
        opacity: 0;
        transform: translateX(100vw) rotate(-30deg);
    }
}
</style>