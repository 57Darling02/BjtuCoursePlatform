import { service } from "./instance";
export const getCaptcha = async (): Promise<string> => {
  try {
    const response = await service.get<Blob>('/GetImg', {
      responseType: 'blob',
      params: { _t: Date.now() } // 防止缓存
    })
    // 生成图片 URL
    return URL.createObjectURL(new Blob([response.data], { type: 'image/jpeg' }))
  } catch (error) {
    throw error
  }
}

// 获取验证码明文接口
export const getCaptchaText = async (): Promise<string> => {
  try {
    const response = await service.get<string>('/confirmImg', {
      transformResponse: [(data) => data.trim()], // 清除前后空白
      params: { _t: Date.now() }
    })
    return response.data
  } catch (error) {
    throw error
  }
}