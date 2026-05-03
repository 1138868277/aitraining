<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-title">华电新能源 - 编码工具</div>
      <el-menu
        :default-active="currentRoute"
        mode="horizontal"
        router
        class="header-menu"
      >
        <el-menu-item index="/code-generate">编码生成</el-menu-item>
        <el-menu-item index="/code-validate">字典管理</el-menu-item>
        <el-menu-item index="/statistics">统计分析</el-menu-item>
        <el-menu-item index="/system-settings">系统设置</el-menu-item>
      </el-menu>
      <div class="header-time">{{ currentTime }}</div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentRoute = computed(() => route.path);

const currentTime = ref('');
let timer: ReturnType<typeof setInterval>;

function updateTime() {
  const now = new Date();
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  currentTime.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 周${days[now.getDay()]} ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

onMounted(() => { updateTime(); timer = setInterval(updateTime, 1000); });
onUnmounted(() => clearInterval(timer));
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  min-height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  background: linear-gradient(rgba(29, 107, 192, 0.82), rgba(64, 158, 255, 0.78)), url(https://images.unsplash.com/photo-1466611653917-950a37dd0b51?w=1920&q=80) center / cover;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  margin-right: 48px;
  letter-spacing: 1px;
}

.header-menu {
  flex: 1;
  border-bottom: none !important;
  background: transparent !important;
}

.header-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.75) !important;
  font-size: 15px;
  font-weight: 500;
  margin: 0 4px;
  padding: 0 20px;
  border-radius: 6px 6px 0 0;
  transition: all 0.25s ease;
  letter-spacing: 0.5px;
}

.header-menu .el-menu-item:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.12) !important;
}

.header-menu .el-menu-item.is-active {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.18) !important;
  font-weight: 600;
}

.header-menu .el-menu-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: #ffffff;
  border-radius: 3px 3px 0 0;
  transition: width 0.25s ease;
}

.header-menu .el-menu-item.is-active::after {
  width: 60%;
}

.header-time {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  white-space: nowrap;
  margin-left: auto;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
}

.app-main {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px;
}
</style>
