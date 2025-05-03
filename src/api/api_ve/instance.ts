import axios,{ type AxiosInstance } from 'axios'

export const service:AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 5000,
  maxRedirects: 0 // 禁止自动重定向
})

