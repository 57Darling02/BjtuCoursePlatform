import axios,{ type AxiosInstance } from 'axios'
export const service:AxiosInstance = axios.create({
  baseURL: '/api_cas',// https://cas.bjtu.edu.cn
  withCredentials: true,
  timeout: 3000,
  maxRedirects: 0 // 禁止自动重定向
})
