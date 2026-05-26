<template>
  <el-container v-if="!isLoginPage" class="app-container">
    <el-header class="app-header">
      <div class="header-title">
        <img src="/logo.png" class="header-logo" alt="logo">
        华电新能源编码管理平台
      </div>
      <el-menu
        :default-active="currentRoute"
        mode="horizontal"
        router
        class="header-menu"
      >
        <el-menu-item index="/code-generate">编码创建</el-menu-item>
        <el-menu-item index="/code-verify">编码维护</el-menu-item>
        <el-menu-item index="/code-validate">字典管理</el-menu-item>
        <el-menu-item index="/statistics">编码看板</el-menu-item>
        <el-menu-item index="/system-settings">系统配置</el-menu-item>
      </el-menu>
      <div class="header-right">
        <div class="header-time">{{ currentTime }}</div>
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-info">
            <el-avatar :size="32" :icon="UserFilled" class="user-avatar" />
            <span class="user-name">{{ auth.user?.displayName || auth.user?.username }}</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-icon><InfoFilled /></el-icon>
                {{ auth.user?.region }}
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </el-main>
  </el-container>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { UserFilled, InfoFilled, SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isLoginPage = computed(() => route.path === '/login');
const currentRoute = computed(() => route.path);

const currentTime = ref('');
let timer: ReturnType<typeof setInterval>;

function updateTime() {
  const now = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  currentTime.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 周${days[now.getDay()]} ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

function handleCommand(command: string) {
  if (command === 'logout') {
    auth.logout();
    router.replace('/login');
  }
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
  auth.initDefaultUsers();
});
onUnmounted(() => clearInterval(timer));
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  background: linear-gradient(135deg, #0f1d3a 0%, #1a3a6b 50%, #1e4d8c 100%);
  padding: 0 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  position: relative;
  z-index: 100;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  margin-right: 40px;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.header-logo {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: contain;
}

.header-title::after {
  content: '';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
}

.header-menu {
  flex: 1;
  border-bottom: none !important;
  background: transparent !important;
  margin-left: 20px;
  display: flex;
  align-items: center;
  height: 100%;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.65) !important;
  font-size: 14px;
  font-weight: 500;
  margin: 0 2px;
  padding: 0 18px;
  border-radius: 8px;
  transition: all 0.25s ease;
  letter-spacing: 0.3px;
  height: 36px !important;
  line-height: 36px !important;
}

.header-menu .el-menu-item:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.header-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.15) !important;
  font-weight: 600;
}

.header-menu .el-menu-item::after {
  display: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  padding-left: 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.header-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  white-space: nowrap;
  letter-spacing: 0.3px;
  font-variant-numeric: tabular-nums;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  background: rgba(165, 180, 252, 0.3);
  color: #a5b4fc;
  flex-shrink: 0;
}

.user-name {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
}

.app-main {
  overflow-y: auto !important;
  background: #f5f7fa;
  padding: 20px;
}
</style>
