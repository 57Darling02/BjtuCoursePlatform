<template>
  <div class="cosmic-space">
    <!-- 自动生成星空层 -->
    <div v-for="layer in layers" :key="layer" :class="`stars-layer-${layer}`"></div>
    
    <!-- 流星 -->
    <div v-for="n in 3" :key="'meteor'+n" class="shooting-star"></div>
  </div>
</template>

<script setup>
// 通过计算属性生成层级数量
const layers = Array.from({length: 5}, (_, i) => i + 1)
</script>

<style lang="scss" scoped>
// 配置参数
$stars-count: 300; // 每层星星数量
$layers-count: 5; // 星空层数
$base-duration: 50s; // 基础动画时长
$color-palette: (
  primary: #00ffff,
  secondary: #a0d8ef,
  accent: #7fffd4
);

// 生成单颗星星的混合宏（修复随机数生成）
@mixin star-particle($size) {
  width: $size;
  height: $size;
  border-radius: 50%;
  background: transparent;
  box-shadow: 
    (random(2000) - 1000) + px 
    (random(2000) - 1000) + px 
    lighten(map-get($color-palette, primary), random(20));
}

@keyframes star-move {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cosmic-space {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(
    ellipse at bottom,
    adjust-color(map-get($color-palette, primary), $lightness: -30%),
    darken(map-get($color-palette, primary), 40%)
  );
  overflow: hidden;
  perspective: 1000px;

  // 修复循环判断语法和透明度计算
  @for $i from 1 through $layers-count {
    .stars-layer-#{$i} {
      position: absolute;
      width: 100%;
      height: 100%;
      animation: star-move ($base-duration + $i * 10s) linear infinite;
      transform-style: preserve-3d;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        @include star-particle(random(3) + px);
        filter: blur(random(2) + px);
        $spread: 500 + $i * 200;
        transform: translate3d(
          random($spread) - $spread/2 + px,
          random($spread) - $spread/2 + px,
          random(2000) - 1000 + px
        );

        // 修复透明度计算（移除负号）
        @if $i % 2 == 0 {
          box-shadow: adjust-color(
            map-get($color-palette, secondary),
            $alpha: random(50)/-100 // 修正为合法数值
          );
        } @else {
          box-shadow: adjust-color(
            map-get($color-palette, primary),
            $alpha: random(30)/-100
          );
        }
      }
    }
  }

  .shooting-star {
    @for $i from 1 through 3 {
      &:nth-child(#{$i}) {
        $delay: random(20) + 5s;
        animation: meteor $delay linear infinite;
        animation-delay: $delay;
      }
    }

    position: absolute;
    width: 100px;
    height: 2px;
    background: linear-gradient(
      to right,
      transparentize(map-get($color-palette, accent), 0.8),
      transparent
    );
    transform: rotate(-30deg);
    filter: drop-shadow(0 0 5px map-get($color-palette, accent));
  }
}

@keyframes meteor {
  0% {
    opacity: 0;
    transform: translateX(-100vw) rotate(-30deg);
  }
  20% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateX(100vw) rotate(-30deg);
  }
}
</style>