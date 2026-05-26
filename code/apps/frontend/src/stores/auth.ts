import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserInfo {
  username: string;
  displayName: string;
  region: string;
  password: string;
  lastLoginTime?: string;
  avatar?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(JSON.parse(localStorage.getItem('auth_user') || 'null'));

  const isLoggedIn = computed(() => user.value !== null);

  /** 获取所有用户列表 */
  function getUsers(): UserInfo[] {
    return JSON.parse(localStorage.getItem('auth_users') || '[]');
  }

  /** 保存用户列表 */
  function saveUsers(users: UserInfo[]) {
    localStorage.setItem('auth_users', JSON.stringify(users));
  }

  /** 初始化默认管理员用户 */
  function initDefaultUsers() {
    const users = getUsers();
    if (users.length === 0) {
      saveUsers([
        {
          username: 'admin',
          displayName: '管理员',
          region: '集团',
          password: 'admin',
          lastLoginTime: undefined,
        },
      ]);
    }
  }

  function login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getUsers();
        const found = users.find(u => u.username === username && u.password === password);
        if (found) {
          const now = new Date();
          const loginTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          found.lastLoginTime = loginTime;
          saveUsers(users);
          const userInfo: UserInfo = { ...found };
          user.value = userInfo;
          localStorage.setItem('auth_user', JSON.stringify(userInfo));
          resolve(true);
        } else {
          resolve(false);
        }
      }, 300);
    });
  }

  function logout() {
    user.value = null;
    localStorage.removeItem('auth_user');
  }

  /** 添加用户 */
  function addUser(u: UserInfo): boolean {
    const users = getUsers();
    if (users.find(x => x.username === u.username)) return false;
    users.push(u);
    saveUsers(users);
    return true;
  }

  /** 更新用户 */
  function updateUser(username: string, data: Partial<UserInfo>): boolean {
    const users = getUsers();
    const idx = users.findIndex(x => x.username === username);
    if (idx === -1) return false;
    // 如果修改了用户名，检查新用户名是否冲突
    if (data.username && data.username !== username) {
      if (users.find(x => x.username === data.username)) return false;
    }
    users[idx] = { ...users[idx], ...data };
    saveUsers(users);
    // 如果修改的是当前登录用户，同步更新登录态
    if (user.value && user.value.username === username) {
      user.value = { ...users[idx] };
      localStorage.setItem('auth_user', JSON.stringify(user.value));
    }
    return true;
  }

  /** 删除用户 */
  function deleteUser(username: string): boolean {
    const users = getUsers();
    const idx = users.findIndex(x => x.username === username);
    if (idx === -1) return false;
    // 不能删除自己
    if (user.value?.username === username) return false;
    users.splice(idx, 1);
    saveUsers(users);
    return true;
  }

  return {
    user, isLoggedIn,
    login, logout,
    getUsers, addUser, updateUser, deleteUser, initDefaultUsers,
  };
});
