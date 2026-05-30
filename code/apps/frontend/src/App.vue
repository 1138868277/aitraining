<template>
  <el-container v-if="!isLoginPage" class="app-container">
    <el-header class="app-header">
      <div class="header-bg">
        <div class="header-grid"></div>
        <div class="header-glow header-glow-1"></div>
        <div class="header-glow header-glow-2"></div>
      </div>
      <div class="header-content">
        <div class="header-title">
          <img src="/logo.png" class="header-logo" alt="logo">
          <span class="header-title-text">华电新能源编码管理平台</span>
        </div>
        <el-menu
          :default-active="currentRoute"
          mode="horizontal"
          router
          class="header-menu"
        >
          <el-menu-item index="/code-generate">
            <span class="menu-icon">⚡</span>编码创建
          </el-menu-item>
          <el-menu-item index="/code-verify">
            <span class="menu-icon">🔧</span>编码维护
          </el-menu-item>
          <el-menu-item index="/code-validate">
            <span class="menu-icon">📖</span>字典管理
          </el-menu-item>
          <el-menu-item index="/statistics">
            <span class="menu-icon">📊</span>编码看板
          </el-menu-item>
          <el-menu-item index="/time-series-rules">
            <span class="menu-icon">⏱️</span>时序规则
          </el-menu-item>
          <el-menu-item index="/system-settings">
            <span class="menu-icon">⚙️</span>系统配置
          </el-menu-item>
        </el-menu>
        <div class="header-right">
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { UserFilled, InfoFilled, SwitchButton } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const isLoginPage = computed(() => route.path === '/login');
const currentRoute = computed(() => route.path);

onMounted(() => {
  auth.initActivityTracker();
});

function handleCommand(command: string) {
  if (command === 'logout') {
    auth.logout();
    router.replace('/login');
  }
}

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

/* ==================== 科技风导航栏 ==================== */
.app-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  background: linear-gradient(135deg, #0f1d3a 0%, #1a3a6b 50%, #1e4d8c 100%);
  padding: 0 28px;
  position: relative;
  z-index: 100;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
}

/* 背景装饰 */
.header-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.header-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
  background-size: 30px 30px;
}
.header-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}
.header-glow-1 { top: -120px; right: 10%; background: #38bdf8; }
.header-glow-2 { bottom: -120px; left: 30%; background: #3b82f6; }

/* 底部高光线 */
.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 5%;
  width: 90%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.5), transparent);
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  padding-right: 28px;
  margin-right: 20px;
}

.header-title::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 24px;
  background: linear-gradient(to bottom, transparent, rgba(56, 189, 248, 0.4), transparent);
}

.header-logo {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: contain;
  filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.4));
}

.header-title-text {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 1px;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

/* ==================== 导航菜单 ==================== */
.header-menu {
  flex: 1;
  border-bottom: none !important;
  background: transparent !important;
  display: flex;
  align-items: center;
  height: 100%;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 14px;
  font-weight: 500;
  margin: 0 3px;
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  height: 34px !important;
  line-height: 34px !important;
  position: relative;
}

.header-menu .el-menu-item:hover {
  color: #ffffff !important;
  background: rgba(56, 189, 248, 0.12) !important;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
}

.header-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.1)) !important;
  font-weight: 600;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.1), inset 0 0 12px rgba(56, 189, 248, 0.05);
}

.header-menu .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #38bdf8;
  border-radius: 2px;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.6);
}

.header-menu .el-menu-item::after {
  display: none;
}

.menu-icon {
  font-size: 14px;
  margin-right: 5px;
  line-height: 1;
}

/* ==================== 右侧用户区 ==================== */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  padding-left: 20px;
  border-left: 1px solid rgba(56, 189, 248, 0.15);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 8px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.user-info:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.2);
}

.user-avatar {
  background: rgba(56, 189, 248, 0.2) !important;
  color: #7dd3fc !important;
  flex-shrink: 0;
}

.user-name {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 500;
}

/* ==================== 主体区域 ==================== */
.app-main {
  overflow-y: auto !important;
  background: #f5f7fa;
  padding: 20px;
}
</style>
