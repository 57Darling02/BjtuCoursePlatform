<template>
  <el-skeleton :rows="9" animated v-if="is_loading" class="a-card" style="width: 80%; max-width: 420px;">
  </el-skeleton>
  <el-form ref="loginFormRef" class="a-card" :model="loginForm" :rules="loginRules" label-width="auto"
    style="width: 80%; max-width: 420px;" v-else label-position="right">
    <div style="display: flex; justify-content: center; width: 100%;">
      <h1>课程平台青春版</h1>
    </div>
    <!-- 账号输入 -->
    <el-form-item label="账号" prop="account">
      <el-input v-model="loginForm.username" placeholder="请输入账号" autocomplete="new-password" />
    </el-form-item>

    <!-- 密码输入 -->
    <el-form-item label="密码" prop="password">
      <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
    </el-form-item>

    <!-- 登录类型选择 -->
    <el-form-item label="登录方式" prop="loginType">
      <el-radio-group v-model="loginForm.loginType" @change="refreshCaptcha">
        <el-radio value="1">轻新课堂(原生)</el-radio>
        <el-radio value="2">mis统一认证</el-radio>

      </el-radio-group>
    </el-form-item>

    <!-- 验证码 -->
    <el-form-item label="验证码" prop="captcha">
      <div class="captcha-container">
        <el-input v-model="loginForm.passcode" placeholder="请输入验证码" clearable style="width: 60%">
        </el-input>
        <div class="captcha-img" @click="refreshCaptcha">
          <img v-if="captchaUrl" :src="captchaUrl" alt="验证码">
          <div v-else class="captcha-loading">加载中...</div>
        </div>
      </div>
    </el-form-item>

    <!-- 提交按钮 -->
    <el-form-item>
      <el-button type="primary" class="login-btn" @click="handleLogin" round>
        立即登录
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { login, getCaptcha, type loginParams } from '@/api'
import { el_alert } from '@/utils'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { logout } from '@/api/api_ve'
const userStore = useUserStore();

// 表单实例
const loginFormRef = ref<FormInstance>()

// 表单数据
const loginForm = reactive<loginParams>({
  loginType: '2',
  username: '',
  password: '',
  passcode: '',
  captcha_id: '',
  csrfmiddlewaretoken: ''
})

// 验证码URL
const captchaUrl = ref('')


// 获取验证码
const refreshCaptcha = async () => {
  try {
    await logout()
    if (captchaUrl.value) URL.revokeObjectURL(captchaUrl.value)
    const res = await getCaptcha(loginForm.loginType)
    captchaUrl.value = res.captchaUrl
    loginForm.captcha_id = res.captchaId
    loginForm.csrfmiddlewaretoken = res.csrfmiddlewaretoken
    loginForm.passcode = res.captchaText
  } catch (error) {
    captchaUrl.value = ''
    await refreshCaptcha()
    el_alert({
      title: '验证码获取失败',
      message: error as string,
      type: 'error',
    })
  }
}

// 初始化加载验证码
onMounted(refreshCaptcha)

// 清理内存
onUnmounted(() => {
  if (captchaUrl.value) {
    URL.revokeObjectURL(captchaUrl.value)
  }
})

// 验证规则
const loginRules = reactive<FormRules<loginParams>>({
  loginType: [
    { required: true, message: '请选择登录方式', trigger: 'change' }
  ],
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_-]{4,16}$/,
      message: '4到16位（字母、数字、下划线、减号）',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 1,
      max: 18,
      message: '密码长度在6到18个字符',
      trigger: 'blur'
    }
  ],
  passcode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9]{1,10}$/,
      message: '',
      trigger: 'blur'
    }
  ]
})
const is_loading = ref(false)
// 提交登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  is_loading.value = true
  try {
    await loginFormRef.value.validate(async (valid) => {
      if (valid) {
        try {
          await login(loginForm)
          userStore.isAuthenticated = true
          userStore.username = loginForm.username
          userStore.password = loginForm.password
          await router.push('/homespace')
          await nextTick()
          el_alert({
            title: '登录成功',
            message: '欢迎回来！',
            type: 'success',
          })
          if(loginForm.loginType === '2') {
            userStore.handleSyncPassword()
          }
          
        } catch (error) {
          el_alert({
            title: '登录失败',
            message: error as string,
            type: 'error',
          })
          await refreshCaptcha()
        }
      }
    })
  } finally {
    is_loading.value = false
  }

}
</script>

<style scoped>
.login-form {
  width: 400px;
  padding: 30px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.captcha-img {
  flex: 1;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.captcha-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>