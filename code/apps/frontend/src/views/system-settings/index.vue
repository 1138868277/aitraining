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
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">数据源管理</div>
                <div class="tech-hero-desc">配置和管理 PG 数据库连接信息，支持新增、编辑和测试连接，修改后自动生效无需重启服务</div>
              </div>
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
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">用户管理</div>
                <div class="tech-hero-desc">管理系统用户账号，支持新增、编辑和删除操作，修改后即时生效</div>
              </div>
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
  margin-bottom: 20px;
  background: linear-gradient(135deg, #e8f4fd 0%, #eef2ff 50%, #e0f2fe 100%);
  background-size: 200% 200%;
  animation: heroGradient 8s ease infinite;
  border: 1px solid rgba(59,130,246,0.12);
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
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
    linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  animation: gridShift 20s linear infinite;
}
.tech-glow {
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.1;
  pointer-events: none;
  animation: glowPulse 6s ease-in-out infinite;
}
.tech-glow-1 { top: -120px; right: -60px; background: #93c5fd; animation-delay: 0s; }
.tech-glow-2 { bottom: -120px; left: -80px; background: #c4b5fd; animation-delay: 3s; }
.tech-hero-content {
  position: relative;
  padding: 20px 30px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}
.tech-hero-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59,130,246,0.25);
}
.tech-hero-icon svg {
  width: 22px;
  height: 22px;
}
.tech-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}
.tech-hero-title {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Ma Shan Zheng', 'STXingkai', 'KaiTi', serif;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  letter-spacing: 4px;
  flex-shrink: 0;
}
.tech-hero-desc {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}
.tech-hero::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 0 2px 2px 0;
  z-index: 2;
}
.tech-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent);
  z-index: 2;
}

@keyframes heroGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.08; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.15); }
}
@keyframes gridShift {
  0% { transform: translateY(0); }
  100% { transform: translateY(28px); }
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
