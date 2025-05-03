import axios,{ type AxiosInstance } from 'axios'

// 创建带类型的 axios 实例
export const service:AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 3000,
  maxRedirects: 0 // 禁止自动重定向
})
export const service_app:AxiosInstance = axios.create({
  baseURL: '/api_app',//http://123.121.147.7:8081/app
  withCredentials: true,
  timeout: 3000,
  maxRedirects: 0 // 禁止自动重定向
})


// 添加响应拦截器，处理重定向状态码
service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && [301, 302, 307].includes(error.response.status)) {
      // 在这里可以自定义处理重定向错误，比如抛出特定错误信息
      return Promise.reject(new Error('重定向被禁止'));
    }
    return Promise.reject(error);
  }
);