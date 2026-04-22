<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-title">华电新能源 - 测点编码管理工具</div>
      <el-menu
        :default-active="currentRoute"
        mode="horizontal"
        router
        class="header-menu"
      >
        <el-menu-item index="/code-generate">编码生成</el-menu-item>
        <el-menu-item index="/code-validate">编码校验</el-menu-item>
        <el-menu-item index="/statistics">统计分析</el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const currentRoute = computed(() => route.path);
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
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  margin-right: 40px;
}

.header-menu {
  flex: 1;
  border-bottom: none !important;
}

.app-main {
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
  padding: 20px;
}
</style>
