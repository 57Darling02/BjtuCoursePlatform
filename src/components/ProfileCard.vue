<template>
  <div class="a-card profile-card" :class="{ 'has-border': border }" id="profile-card">
    <!-- 头像区域 -->
    <div class="avatar-wrapper">
      <img :src="avatar" :alt="name" class="avatar" @error="handleAvatarError">
    </div>
    <!-- 个人信息 -->
    <div class="profile-content">
      <h2 class="name">{{ name }}</h2>
      <div class="position">{{ position }}</div>
      <p class="bio">{{ bio }}</p>
      <!-- 社交链接 -->
      <div class="social-links">
        <a v-for="(link, index) in socialLinks" :key="index" :href="link.url" target="_blank" class="social-item"
          :title="link.name">
          <i :class="link.icon"></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  avatar: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: '未命名'
  },
  position: {
    type: String,
    default: '核心成员'
  },
  bio: {
    type: String,
    default: '。。。'
  },
  socialLinks: {
    type: Array,
    default: () => []
  },
  border: {
    type: Boolean,
    default: true // 默认显示边框
  }
})
const defaultAvatar = '/default-avatar.png'
const handleAvatarError = (e) => {
  e.target.src = defaultAvatar
}
</script>

<style lang="scss" scoped>
.a-card {
  border-radius: 12px;
  padding: 5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  outline: none;
  width: 300px;
}

.a-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
  backface-visibility: hidden;
}
.profile-card {
  background-color: antiquewhite;
  padding: 10px 10px 10px;
}

/* 头像样式 */
.avatar-wrapper {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--vp-c-brand);
  transition: transform 0.3s ease;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 个人信息 */
.profile-content {
  text-align: center;
}

.name {
  margin: 0 0 8px;
  font-size: 1.5rem;
  color: var(--vp-c-text-1);
}

.position {
  color: var(--vp-c-brand);
  font-size: 0.9rem;
  margin-bottom: 12px;
  font-weight: 500;
}

.bio {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 auto 20px;
  max-width: 240px;
}

/* 社交链接 */
.social-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-item {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-bg-alt);
  transition: all 0.3s ease;
  color: var(--vp-c-text-2);
}

.social-item:hover {
  background: var(--vp-c-brand);
  color: white;
  transform: scale(1.1);
}

.social-icon {
  font-size: 1.1rem;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .profile-card {
    width: 260px;
    padding: 20px;
    max-width: 100%;
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }
}
</style>