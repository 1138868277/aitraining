import axios from 'axios';

// 生成一个会话ID，用于临时区数据隔离
const sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
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
