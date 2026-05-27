<template>
  <div class="system-settings">
    <div class="page-body">
      <el-tabs v-model="activeTab" class="page-tabs">
        <el-tab-pane label="数据源管理" name="datasource">
          <div class="subpage-hero">
            <div class="hero-icon">🗄️</div>
            <div class="hero-text">
              <div class="hero-title">数据源管理</div>
              <div class="hero-subtitle">配置和管理 PG 数据库连接信息，支持新增、编辑和测试连接</div>
            </div>
          </div>
          <DatasourceTab />
        </el-tab-pane>
        <el-tab-pane v-if="isAdmin" label="用户管理" name="userMgmt">
          <div class="subpage-hero">
            <div class="hero-icon">👤</div>
            <div class="hero-text">
              <div class="hero-title">用户管理</div>
              <div class="hero-subtitle">管理系统用户账号，支持新增、编辑和删除操作，修改后即时生效</div>
            </div>
          </div>
          <UserMgmtTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DatasourceTab from './datasource-tab.vue';
import UserMgmtTab from './user-mgmt-tab.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.username === 'admin');
const activeTab = ref(
  !isAdmin.value && (route.query.tab as string) === 'userMgmt'
    ? 'datasource'
    : (route.query.tab as string) || 'datasource'
);

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});
</script>

<style scoped>
.system-settings {
  width: 100%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 功能介绍卡片 ==================== */
.hero-icon { font-size: 36px; line-height: 1; position: relative; z-index: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
.hero-text { flex: 1; position: relative; z-index: 1; }
.hero-title { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.hero-subtitle { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }

.subpage-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.15);
  position: relative;
  overflow: hidden;
}
.subpage-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  border-radius: 50%;
}

.page-body {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  padding: 8px 16px 16px;
}
.page-tabs { margin-top: -8px; }
</style>
