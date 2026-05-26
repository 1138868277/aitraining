import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export interface UserInfo {
  id?: number;
  username: string;
  displayName: string;
  region: string;
  tenant?: string;
  password: string;
  create_tm?: string;
  update_tm?: string;
  lastLoginTime?: string;
  avatar?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'));
  const token = ref<string | null>(localStorage.getItem('auth_token'));

  const isLoggedIn = computed(() => user.value !== null && token.value !== null);

  async function login(username: string, password: string): Promise<boolean> {
    try {
      const res: any = await api.post('/auth/login', { username, password });
      const { token: newToken, user: userData } = res.data;

      token.value = newToken;
      localStorage.setItem('auth_token', newToken);

      const userInfo: UserInfo = {
        id: userData.id,
        username: userData.username,
        displayName: userData.displayName,
        region: userData.region,
        tenant: userData.tenant,
        password: password,
        lastLoginTime: new Date().toISOString(),
      };
      user.value = userInfo;
      localStorage.setItem('auth_user', JSON.stringify(userInfo));

      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      return false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  /** 获取所有用户列表 */
  async function getUsers(): Promise<UserInfo[]> {
    try {
      const res: any = await api.get('/auth/users');
      return res.data || [];
    } catch {
      return [];
    }
  }

  /** 添加用户 */
  async function addUser(u: { username: string; displayName: string; region: string; password: string }): Promise<boolean> {
    try {
      await api.post('/auth/users', u);
      return true;
    } catch {
      return false;
    }
  }

  /** 更新用户 */
  async function updateUser(username: string, data: Partial<UserInfo>): Promise<boolean> {
    try {
      await api.put(`/auth/users/${username}`, data);
      if (user.value && user.value.username === username) {
        user.value = { ...user.value, ...data };
        localStorage.setItem('auth_user', JSON.stringify(user.value));
      }
      return true;
    } catch {
      return false;
    }
  }

  /** 删除用户 */
  async function deleteUser(username: string): Promise<boolean> {
    try {
      await api.delete(`/auth/users/${username}`);
      return true;
    } catch {
      return false;
    }
  }

  return {
    user, token, isLoggedIn,
    login, logout,
    getUsers, addUser, updateUser, deleteUser,
  };
});
