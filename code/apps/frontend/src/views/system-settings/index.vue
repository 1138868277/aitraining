<template>
  <div class="system-settings">
    <div class="page-body">
      <div class="page-layout">
        <!-- 左侧标签导航 -->
        <div class="cyber-tabs">
          <div
            v-for="tab in visibleTabs"
            :key="tab.name"
            class="cyber-tab"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <div class="cyber-tab-icon" v-html="tab.icon"></div>
            <span class="cyber-tab-label">{{ tab.label }}</span>
            <div class="cyber-tab-indicator"></div>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="tab-content">
          <div v-show="activeTab === 'datasource'" class="tab-panel">
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
                  <div class="tech-hero-desc">配置管理 PG 数据库连接，支持新增、编辑与测试，修改即时生效</div>
                </div>
              </div>
            </div>
            <DatasourceTab />
          </div>
          <div v-show="activeTab === 'userMgmt'" class="tab-panel">
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
                  <div class="tech-hero-desc">管理系统用户账号，支持新增、编辑与删除，修改即时生效</div>
                </div>
              </div>
            </div>
            <UserMgmtTab />
          </div>
          <div v-show="activeTab === 'station'" class="tab-panel">
            <StationTab />
          </div>
          <div v-show="activeTab === 'measureImport'" class="tab-panel">
            <div class="tech-hero">
              <div class="tech-hero-bg">
                <div class="tech-grid"></div>
                <div class="tech-glow tech-glow-1"></div>
                <div class="tech-glow tech-glow-2"></div>
              </div>
              <div class="tech-hero-content">
                <div class="tech-hero-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div class="tech-hero-text">
                  <div class="tech-hero-title">测点导入</div>
                  <div class="tech-hero-desc">导入测点数据至系统，导入后可在看板和其他功能中使用</div>
                </div>
              </div>
            </div>
            <MeasureImportTab />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onActivated } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DatasourceTab from './datasource-tab.vue';
import UserMgmtTab from './user-mgmt-tab.vue';
import StationTab from '@/views/code-validate/station-tab.vue';
import MeasureImportTab from './measure-import-tab.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.username === 'admin');

const activeTab = ref(
  !isAdmin.value && (route.query.tab as string) === 'userMgmt'
    ? 'datasource'
    : (route.query.tab as string) || 'datasource'
);

const tabDefs = [
  { name: 'datasource', label: '数据源管理', adminOnly: false,
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
  { name: 'userMgmt', label: '用户管理', adminOnly: true,
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { name: 'station', label: '场站管理', adminOnly: false,
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { name: 'measureImport', label: '测点导入', adminOnly: false,
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
];

const visibleTabs = computed(() => tabDefs.filter(t => !t.adminOnly || isAdmin.value));

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

onActivated(() => {
  if (route.query.tab !== activeTab.value) {
    router.replace({ query: { ...route.query, tab: activeTab.value } });
  }
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

/* ==================== 科技风标签导航（左侧） ==================== */
.page-layout {
  display: flex;
  gap: 0;
  align-items: stretch;
}
.cyber-tabs {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 6px;
  width: 130px;
  flex-shrink: 0;
  border-right: 1px solid #eef0f5;
  background: linear-gradient(180deg, #fafbff 0%, #f5f7ff 100%);
  position: relative;
}
.cyber-tabs::before {
  content: '';
  position: absolute;
  top: 0;
  right: -1px;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(59,130,246,0.12), rgba(139,92,246,0.12), transparent);
}
.cyber-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  overflow: hidden;
}
.cyber-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}
.cyber-tab:hover::before {
  opacity: 1;
}
.cyber-tab:hover .cyber-tab-icon {
  color: #3b82f6;
  transform: scale(1.1);
}
.cyber-tab.active {
  background: linear-gradient(135deg, #3b82f6, #6366f1, #3b82f6);
  background-size: 200% 200%;
  animation: tabGradShift 3s ease infinite;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.1);
}
.cyber-tab.active .cyber-tab-label {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.cyber-tab.active .cyber-tab-icon {
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
  animation: tabIconPulse 2s ease-in-out infinite;
}
.cyber-tab.active .cyber-tab-indicator {
  opacity: 1;
  animation: tabIndicatorPulse 1.5s ease-in-out infinite;
}

@keyframes tabGradShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes tabIconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes tabIndicatorPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.5); height: 20px; }
  50% { box-shadow: 0 0 16px rgba(255,255,255,0.8); height: 28px; }
}
.cyber-tab:not(.active):hover {
  transform: translateX(2px);
}
.cyber-tab:not(.active):active {
  transform: translateX(0);
}
.cyber-tab-indicator {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: #fff;
  box-shadow: 0 0 8px rgba(255,255,255,0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.cyber-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.cyber-tab-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
}

/* 右侧内容区 */
.tab-content {
  flex: 1;
  min-width: 0;
  padding: 12px 16px 12px 16px;
}
.tab-panel {
  animation: panelIn 0.25s ease;
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 科技风英雄卡片 ==================== */
.tech-hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 14px;
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
  width: 250px;
  height: 250px;
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
  padding: 22px 28px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
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
  width: 18px;
  height: 18px;
}
.tech-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-title {
  font-size: 22px;
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
  padding: 8px 0 16px 0;
  overflow: hidden;
}
</style>
