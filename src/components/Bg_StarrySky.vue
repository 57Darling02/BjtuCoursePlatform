<!-- 星空背景 -->
<template>
    <div id="bg">
        <div class="body" id="bodyId">
            <div class="stars" ref="starsRef">
                <div class="star" v-for="(item, index) in starsCount" :key="index"></div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
let starsRef = ref(null);
const starsCount = 800; //星星数量
const distance = 900; //间距
onMounted(() => {
    let starNodes = Array.from(starsRef.value.children);
    starNodes.forEach((item) => {
        let speed = 0.2 + Math.random() * 1;
        let thisDistance = distance + Math.random() * 300;
        item.style.transformOrigin = `0 0 ${thisDistance}px`;
        item.style.transform = `
          translate3d(0,0,-${thisDistance}px)
          rotateY(${Math.random() * 360}deg)
          rotateX(${Math.random() * -50}deg)
          scale(${speed},${speed})`;
    });
});

// -------流星脚本开始-------
const createMeteor = () => {
    let meteor = document.createElement("div");
    meteor.classList.add("meteor");
    meteor.style.position = "absolute";
    meteor.style.height = "2px";
    meteor.style.background = "linear-gradient(to right, #00ffff, rgba(0, 0, 0, 0))"; // 改为青色渐变
    meteor.style.width = Math.random() * 10 + 100 + "px";
    meteor.style.right = Math.random() * window.innerWidth + "px";
    meteor.style.top = Math.random() * (window.innerHeight / 3) + "px";
    document.getElementById("bodyId").prepend(meteor);

    // 获取流星的初始位置
    const meteorRect = meteor.getBoundingClientRect();
    // 计算滑动距离
    const distance = window.innerHeight / 2 - meteorRect.top + Math.random() * 50;
    // 设置动画持续时间，根据距离和随机速度计算
    const duration = (distance / (160 + Math.random() * 50)) * 1000; // 调整速度倍数
    // 创建动画，斜着向下滑动
    meteor.style.animation = `myMeteor ${duration}ms linear forwards`;
    // 修改 myMeteor 动画
    const myMeteor = `@keyframes myMeteor {
      0% {
        transform: translate(0, 0) rotate(-30deg); // 初始位置
      }
      90%{
        opacity: .8;
      }
      100% {
        opacity: 0;
        transform: translate(-${distance}px, ${distance}px) rotate(-30deg); // 终点位置
      }
    }`;

    // 将 CSS 代码添加到 style 标签中
    const style = document.createElement("style");
    style.innerHTML = myMeteor;
    document.head.appendChild(style);

    // 移除流星
    setTimeout(() => {
        meteor.remove();
    }, duration);
};

const createMeteorInterval = setInterval(() => {
    createMeteor();
}, 5000 + Math.random() * 2000);
// -------流星脚本结束-------

// 在组件销毁时清除定时器
onBeforeUnmount(() => {
    clearInterval(createMeteorInterval);
});
</script>
<style scoped>
#bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}

.body {
    position: absolute;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: radial-gradient(200% 100% at bottom center,
            #0a1a2f,
            #3a1d6e,
            #2196f3);
    background: radial-gradient(200% 105% at top center,
            #0a1a2f 10%,       /* 深科技蓝 */
            #3a1d6e 40%,       /* 蓝紫色 */
            #2196f3 65%,       /* 亮科技蓝 */
            #00bcd4);          /* 青色 */
    background-attachment: fixed;
    overflow: hidden;
}

@keyframes rotate {
    0% {
        transform: perspective(400px) rotateZ(20deg) rotateX(-40deg) rotateY(0);
    }

    100% {
        transform: perspective(400px) rotateZ(20deg) rotateX(-40deg) rotateY(-360deg);
    }
}

.stars {
    transform: perspective(500px);
    transform-style: preserve-3d;
    position: absolute;
    perspective-origin: 50% 100%;
    left: 45%;
    animation: rotate 90s infinite linear;
    bottom: 0;
}

.star {
    width: 2px;
    height: 2px;
    background: #00ffff;      /* 改为青色 */
    position: absolute;
    left: 0;
    top: 0;
    backface-visibility: hidden;
}
</style>