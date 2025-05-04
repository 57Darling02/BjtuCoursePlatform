<template>
    <div class="bg-normal">
        <div class="color color-1"></div>
        <div class="color color-2"></div>
        <div class="color color-3"></div>

        <div class="box">
            <div class="square" :style="{ '--i': 0 }"></div>
            <div class="square" :style="{ '--i': 1 }"></div>
            <div class="square" :style="{ '--i': 2 }"></div>
            <div class="square" :style="{ '--i': 3 }"></div>
            <div class="square" :style="{ '--i': 4 }"></div>
        </div>
    </div>
</template>

<style>
.bg-normal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.color {
    position: absolute;
    filter: blur(150px);
}

.color-1 {
    top: -350px;
    width: 600px;
    height: 600px;
    background: #ff359b;
}

.color-2 {
    bottom: -150px;
    left: 100px;
    width: 500px;
    height: 500px;
    background: #fffd87;
}

.color-3 {
    bottom: 50px;
    right: 100px;
    width: 500px;
    height: 500px;
    background: #00d2ff;
}

.box {
    position: relative;
    width: 100%;
    height: 100%;
}

.square {
    position: absolute;
    backdrop-filter: blur(5px);
    box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    animation: animate 10s linear infinite;
    animation-delay: calc(-1s * var(--i));
}

@keyframes animate {

    0%,
    100% {
        transform: translateY(-40px);
    }

    50% {
        transform: translateY(40px);
    }
}

.square:nth-child(1) {
    top: 5px;
    right: 6px;
    width: 100px;
    height: 100px;
}

.square:nth-child(2) {
    top: 150px;
    left: 10px;
    width: 120px;
    height: 120px;
    z-index: 2;
}

.square:nth-child(3) {
    bottom: 50px;
    right: 60px;
    width: 80px;
    height: 80px;
    z-index: 2;
}

.square:nth-child(4) {
    bottom: 80px;
    left: 100px;
    width: 50px;
    height: 50px;
}

.square:nth-child(5) {
    top: 20px;
    left: 140px;
    width: 60px;
    height: 60px;
}
</style>