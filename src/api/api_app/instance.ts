import axios,{ type AxiosInstance } from 'axios'
export const service:AxiosInstance = axios.create({
  baseURL: '/api_app/app',//http://123.121.147.7:8081/app
  withCredentials: true,
  timeout: 3000,
  maxRedirects: 0 // 禁止自动重定向
})
