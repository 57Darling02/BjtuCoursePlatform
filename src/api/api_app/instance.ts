import axios, { AxiosHeaders, type AxiosInstance } from 'axios'

export const service:AxiosInstance = axios.create({
  baseURL: '/api_app/app',//http://123.121.147.7:8081/app
  withCredentials: true,
  timeout: 3000,
  maxRedirects: 0 // 禁止自动重定向
})

service.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers)
  const sessionId = localStorage.getItem('sessionId')

  if (sessionId) {
    headers.set('sessionId', sessionId)
  }

  config.headers = headers
  return config
})
