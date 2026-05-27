<template>
  <div class="system-settings">
    <div class="page-body">
      <el-tabs v-model="activeTab" class="page-tabs">
        <el-tab-pane label="数据源管理" name="datasource">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <h2 class="tech-hero-title"><span class="hero-title-icon">🗄️</span> 数据源管理</h2>
              <p class="tech-hero-desc">配置和管理 PG 数据库连接信息，支持新增、编辑和测试连接</p>
            </div>
          </div>
          <DatasourceTab />
        </el-tab-pane>
        <el-tab-pane v-if="isAdmin" label="用户管理" name="userMgmt">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <h2 class="tech-hero-title"><span class="hero-title-icon">👤</span> 用户管理</h2>
              <p class="tech-hero-desc">管理系统用户账号，支持新增、编辑和删除操作，修改后即时生效</p>
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

/* ==================== 科技风英雄卡片 ==================== */
.tech-hero {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #1d4ed8 100%);
}
.tech-hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tech-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
.tech-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}
.tech-glow-1 { top: -100px; right: -50px; background: #7dd3fc; }
.tech-glow-2 { bottom: -120px; left: -80px; background: #1e40af; }
.tech-hero-content {
  position: relative;
  padding: 14px 28px;
  z-index: 1;
}
.tech-hero-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  letter-spacing: 1px;
}
.tech-hero-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 0;
  line-height: 1.6;
}
.hero-title-icon {
  font-size: 28px;
  margin-right: 4px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
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
