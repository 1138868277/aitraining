<template>
  <el-container v-if="!isLoginPage" class="app-container">
    <el-header class="app-header">
      <div class="header-bg">
        <div class="header-grid"></div>
        <div class="header-glow header-glow-1"></div>
        <div class="header-glow header-glow-2"></div>
        <div class="header-glow header-glow-3"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-particle"></div>
        <div class="header-meteor"></div>
        <div class="header-meteor"></div>
        <div class="header-meteor"></div>
        <div class="header-ring"></div>
        <div class="header-ring header-ring-2"></div>
        <div class="header-energy"></div>
        <div class="header-energy"></div>
        <div class="header-energy"></div>
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
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </span>编码创建
          </el-menu-item>
          <el-menu-item index="/code-verify">
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>编码维护
          </el-menu-item>
          <el-menu-item index="/code-validate">
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>
            </span>字典管理
          </el-menu-item>
          <el-menu-item index="/statistics">
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </span>编码看板
          </el-menu-item>
          <el-menu-item index="/time-series-rules">
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>时序规则
          </el-menu-item>
          <el-menu-item index="/system-settings">
            <span class="menu-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>系统配置
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

/* ==================== 赛博科技导航栏 ==================== */
.app-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  background: linear-gradient(135deg, #1e1a3a 0%, #2d1f6e 50%, #3b2a8c 100%);
  height: 60px !important;
  padding: 0 32px;
  position: relative;
  z-index: 100;
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.06), inset 0 0 40px rgba(139, 92, 246, 0.03);
}

/* 极光背景层 */
.header-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 动态极光带 */
.header-bg::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 400px;
  top: -200px;
  left: -100px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  animation: auroraDrift 12s ease-in-out infinite;
}
.header-bg::after {
  content: '';
  position: absolute;
  width: 500px;
  height: 300px;
  bottom: -150px;
  right: -50px;
  background: radial-gradient(ellipse, rgba(120, 50, 255, 0.06) 0%, transparent 70%);
  animation: auroraDrift 15s ease-in-out infinite reverse;
}

/* 网格背景 */
.header-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(139, 92, 246, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.035) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 70%);
}

/* 浮动粒子（发光的） */
.header-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 6px currentColor;
}
.header-particle:nth-child(5) { left: 8%; top: 25%; width: 4px; height: 4px; color: rgba(167, 139, 250, 0.7); animation: particleFloat 6s ease-in-out infinite; }
.header-particle:nth-child(6) { left: 20%; top: 65%; width: 5px; height: 5px; color: rgba(139, 92, 246, 0.5); animation: particleFloat 8s ease-in-out infinite 1s; }
.header-particle:nth-child(7) { left: 38%; top: 20%; width: 3px; height: 3px; color: rgba(196, 181, 253, 0.6); animation: particleFloat 7s ease-in-out infinite 2s; }
.header-particle:nth-child(8) { left: 55%; top: 75%; width: 4px; height: 4px; color: rgba(167, 139, 250, 0.7); animation: particleFloat 9s ease-in-out infinite 0.5s; }
.header-particle:nth-child(9) { left: 72%; top: 30%; width: 3px; height: 3px; color: rgba(139, 92, 246, 0.6); animation: particleFloat 6.5s ease-in-out infinite 3s; }
.header-particle:nth-child(10) { left: 85%; top: 60%; width: 5px; height: 5px; color: rgba(167, 139, 250, 0.8); animation: particleFloat 8.5s ease-in-out infinite 1.5s; }
.header-particle:nth-child(11) { left: 50%; top: 45%; width: 3px; height: 3px; color: rgba(216, 180, 254, 0.5); animation: particleFloat 10s ease-in-out infinite 4s; }
.header-particle:nth-child(12) { left: 95%; top: 35%; width: 4px; height: 4px; color: rgba(196, 181, 253, 0.6); animation: particleFloat 7.5s ease-in-out infinite 2.5s; }

/* 光晕 */
.header-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.header-glow-1 {
  width: 280px;
  height: 280px;
  top: -100px;
  left: 25%;
  background: rgba(139, 92, 246, 0.12);
  animation: glowBreathe 4s ease-in-out infinite;
}
.header-glow-2 {
  width: 200px;
  height: 200px;
  bottom: -60px;
  right: 15%;
  background: rgba(120, 50, 255, 0.1);
  animation: glowBreathe 5s ease-in-out infinite 1s;
}
.header-glow-3 {
  width: 180px;
  height: 180px;
  top: 50%;
  left: 55%;
  transform: translateY(-50%);
  background: rgba(167, 139, 250, 0.08);
  animation: glowBreathe 6s ease-in-out infinite 2s;
}

/* 流星 */
.header-meteor {
  position: absolute;
  pointer-events: none;
}
.header-meteor::before {
  content: '';
  display: block;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px 3px rgba(139, 92, 246, 0.5);
}
.header-meteor::after {
  content: '';
  position: absolute;
  top: 1px;
  right: 2px;
  width: 60px;
  height: 1px;
  background: linear-gradient(to left, rgba(139, 92, 246, 0.8), transparent);
}
.header-meteor:nth-child(13) {
  top: -15px;
  left: 15%;
  animation: meteorShoot 3.5s linear infinite;
}
.header-meteor:nth-child(14) {
  top: -8px;
  left: 50%;
  animation: meteorShoot 5s linear infinite 2s;
}
.header-meteor:nth-child(14)::before {
  width: 1.5px;
  height: 1.5px;
}
.header-meteor:nth-child(14)::after {
  width: 40px;
  opacity: 0.6;
}
.header-meteor:nth-child(15) {
  top: -12px;
  left: 75%;
  animation: meteorShoot 4.5s linear infinite 4s;
}
.header-meteor:nth-child(15)::after {
  width: 50px;
  background: linear-gradient(to left, rgba(120, 50, 255, 0.6), transparent);
}
.header-meteor:nth-child(15)::before {
  box-shadow: 0 0 6px 3px rgba(120, 50, 255, 0.4);
}

/* 旋转光环（增强） */
.header-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.08);
  pointer-events: none;
  animation: ringSpin 20s linear infinite;
  width: 120px;
  height: 120px;
  top: -40px;
  right: 35%;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.03), inset 0 0 20px rgba(139, 92, 246, 0.03);
}
.header-ring::after {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  width: 12px;
  height: 3px;
  background: rgba(139, 92, 246, 0.5);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
  margin-left: -6px;
}
.header-ring-2 {
  width: 90px;
  height: 90px;
  bottom: -25px;
  left: 45%;
  animation-duration: 15s;
  animation-direction: reverse;
  border-color: rgba(167, 139, 250, 0.08);
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.03), inset 0 0 20px rgba(167, 139, 250, 0.03);
}
.header-ring-2::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -1px;
  width: 3px;
  height: 12px;
  background: rgba(167, 139, 250, 0.5);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
  left: auto;
  margin-top: -6px;
}

/* 底部跑马灯 */
.app-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    transparent 10%,
    rgba(139, 92, 246, 0.3) 22%,
    rgba(167, 139, 250, 0.9) 27%,
    rgba(139, 92, 246, 0.9) 32%,
    rgba(167, 139, 250, 0.9) 37%,
    rgba(139, 92, 246, 0.3) 42%,
    transparent 55%,
    transparent 100%
  );
  background-size: 300% 100%;
  animation: runnerLight 3s linear infinite;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
}

/* 能量脉冲环（从中间扩散） */
.header-energy {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.15);
  pointer-events: none;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.05);
}
.header-energy:nth-child(19) {
  animation: energyRing 4s ease-out infinite;
}
.header-energy:nth-child(20) {
  animation: energyRing 4s ease-out infinite 1.3s;
}
.header-energy:nth-child(21) {
  animation: energyRing 4s ease-out infinite 2.6s;
}

/* 新增强的关键帧 */
@keyframes meteorShoot {
  0% { transform: translate(0, 0) rotate(-35deg); opacity: 0; }
  3% { opacity: 1; }
  12% { transform: translate(-250px, 160px) rotate(-35deg); opacity: 1; }
  15% { opacity: 0; }
  100% { opacity: 0; }
}

@keyframes ringSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes auroraDrift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
  33% { transform: translate(100px, -40px) scale(1.15); opacity: 1; }
  66% { transform: translate(-50px, 30px) scale(0.85); opacity: 0.6; }
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
  25% { transform: translateY(-30px) scale(1.8); opacity: 1; }
  50% { transform: translateX(20px) translateY(-45px) scale(1); opacity: 0.5; }
  75% { transform: translateX(-15px) translateY(-20px) scale(1.4); opacity: 0.9; }
}

@keyframes glowBreathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

@keyframes runnerLight {
  0% { background-position: 0% 0%; }
  100% { background-position: 300% 0%; }
}

@keyframes energyRing {
  0% { width: 0; height: 0; opacity: 0.8; border-width: 2px; }
  50% { width: 300px; height: 300px; opacity: 0.3; border-width: 1px; }
  100% { width: 500px; height: 500px; opacity: 0; border-width: 0.5px; }
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
  gap: 12px;
  position: relative;
  padding-right: 28px;
  margin-right: 20px;
}

.header-title::after {
  content: '';
  position: absolute;
  right: 0;
  top: 6px;
  bottom: 6px;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.35), rgba(167, 139, 250, 0.35), transparent);
}

.header-logo {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: contain;
  position: relative;
}

/* Logo 呼吸光环 */
.header-logo::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.15);
  animation: logoRing 3s ease-in-out infinite;
}

.header-title-text {
  font-size: 18px;
  font-weight: 900;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 3px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-shadow:
    0 0 20px rgba(139, 92, 246, 0.4),
    0 0 60px rgba(139, 92, 246, 0.15),
    0 2px 0 rgba(0, 0, 0, 0.3);
  background: linear-gradient(90deg, #e9d5ff, #c4b5fd, #a78bfa, #c4b5fd, #e9d5ff);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleShimmer 4s linear infinite;
  position: relative;
}

@keyframes titleShimmer {
  0% { background-position: 200% 0%; }
  100% { background-position: -200% 0%; }
}

@keyframes logoRing {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.15); box-shadow: 0 0 12px rgba(139, 92, 246, 0.2); }
}

/* ==================== 赛博导航菜单 ==================== */
.header-menu {
  flex: 1;
  border-bottom: none !important;
  background: transparent !important;
  display: flex;
  align-items: center;
  height: 100%;
  gap: 4px;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.5) !important;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  padding: 0 16px;
  border-radius: 8px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  height: 36px !important;
  line-height: 36px !important;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

/* 悬停时边框发光入场 */
.header-menu .el-menu-item::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(139, 92, 246, 0.15)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}

.header-menu .el-menu-item:hover::before {
  opacity: 1;
}

.header-menu .el-menu-item:hover {
  color: #ffffff !important;
  transform: translateY(-1px);
  background: rgba(139, 92, 246, 0.06) !important;
}

.header-menu .el-menu-item:hover .menu-icon {
  color: #c4b5fd;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
}

.header-menu .el-menu-item:hover .menu-icon svg {
  stroke: #c4b5fd;
}

/* 活动菜单项 - 霓虹灯效果 */
.header-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: rgba(139, 92, 246, 0.08) !important;
  font-weight: 600;
  border-color: rgba(139, 92, 246, 0.2);
  box-shadow:
    0 0 20px rgba(139, 92, 246, 0.06),
    inset 0 0 20px rgba(139, 92, 246, 0.04);
  text-shadow: 0 0 12px rgba(139, 92, 246, 0.5);
}

.header-menu .el-menu-item.is-active .menu-icon {
  color: #c4b5fd;
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));
}

.header-menu .el-menu-item.is-active .menu-icon svg {
  stroke: #c4b5fd;
}

/* 激活项 - 底部霓虹光条 */
.header-menu .el-menu-item.is-active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 8px;
  right: 8px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent,
    rgba(167, 139, 250, 0.8) 20%,
    rgba(139, 92, 246, 0.8) 50%,
    rgba(167, 139, 250, 0.8) 80%,
    transparent
  );
  border-radius: 2px;
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.15);
  animation: neonGlow 2s ease-in-out infinite;
}

@keyframes neonGlow {
  0%, 100% { opacity: 0.7; filter: blur(0px); }
  50% { opacity: 1; filter: blur(1px); box-shadow: 0 0 24px rgba(139, 92, 246, 0.7), 0 0 60px rgba(139, 92, 246, 0.2); }
}

.header-menu .el-menu-item::after {
  display: none;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 6px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.4);
}

.menu-icon svg {
  width: 16px;
  height: 16px;
  transition: stroke 0.35s ease;
}

.header-menu .el-menu-item::after {
  display: none;
}

/* ==================== 右侧用户区 ==================== */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  padding-left: 20px;
  position: relative;
}

.header-right::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.25), rgba(167, 139, 250, 0.25), transparent);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
}

.user-info:hover {
  background: rgba(139, 92, 246, 0.06);
  border-color: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.06);
}

.user-avatar {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.15)) !important;
  color: #c4b5fd !important;
  flex-shrink: 0;
  position: relative;
}

.user-avatar::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.1);
  animation: avatarRing 3s ease-in-out infinite;
}

.user-info:hover .user-avatar::after {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.15);
}

@keyframes avatarRing {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 1; }
}

.user-name {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.35s ease;
  letter-spacing: 0.5px;
}

.user-info:hover .user-name {
  color: #ffffff;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.2);
}

/* ==================== 主体区域 ==================== */
.app-main {
  overflow-y: auto !important;
  background: #f5f7fa;
  padding: 20px;
}
</style>
