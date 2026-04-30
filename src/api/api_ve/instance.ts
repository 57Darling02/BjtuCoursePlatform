import axios, { AxiosHeaders, type AxiosInstance } from 'axios'

export const service: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  maxRedirects: 0 // 禁止自动重定向
})

service.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers)
  const sessionId = localStorage.getItem('sessionId')

  if (sessionId) {
    headers.set('sessionId', sessionId)
  }
  headers.set('X-Requested-With', 'XMLHttpRequest')

  config.headers = headers
  return config
})
