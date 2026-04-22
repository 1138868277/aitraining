import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 0) {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
    return data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 500) {
        return Promise.reject(new Error('系统繁忙，请稍后重试'));
      }
      return Promise.reject(new Error(data?.message || '请求失败'));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请重试'));
    }
    return Promise.reject(new Error('网络连接异常，请检查网络后重试'));
  },
);

export default api;
