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

/** 无操作超时自动登出：6 小时 */
const INACTIVITY_TIMEOUT = 6 * 60 * 60 * 1000;
const INACTIVITY_KEY = 'auth_last_activity';

function touchActivity() {
  localStorage.setItem(INACTIVITY_KEY, String(Date.now()));
}

function isSessionExpired(): boolean {
  const last = localStorage.getItem(INACTIVITY_KEY);
  if (!last) return false;
  return Date.now() - Number(last) >= INACTIVITY_TIMEOUT;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'));
  const token = ref<string | null>(localStorage.getItem('auth_token'));

  const isLoggedIn = computed(() => user.value !== null && token.value !== null);

  /** 初始化无操作超时检测（在 App.vue 中调用） */
  let activityTrackerInited = false;
  function initActivityTracker() {
    if (activityTrackerInited) return;
    activityTrackerInited = true;

    // 启动时检查是否已过期
    if (isSessionExpired()) {
      logout();
      return;
    }

    // 记录本次活跃
    touchActivity();

    // 监听用户操作事件，更新活跃时间
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const onActivity = () => touchActivity();
    events.forEach(ev => window.addEventListener(ev, onActivity));
  }

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

      // 登录成功记录活跃时间
      touchActivity();

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
    localStorage.removeItem(INACTIVITY_KEY);
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
    login, logout, initActivityTracker,
    getUsers, addUser, updateUser, deleteUser,
  };
});
