<template>
  <div class="statistics-page">
    <div class="page-body">
      <div class="page-layout">
        <!-- 左侧标签导航 -->
        <div class="cyber-tabs">
          <div
            v-for="tab in tabDefs"
            :key="tab.name"
            class="cyber-tab"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name; onTabChange(tab.name)"
          >
            <div class="cyber-tab-icon" v-html="tab.icon"></div>
            <span class="cyber-tab-label">{{ tab.label }}</span>
            <div class="cyber-tab-indicator"></div>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="tab-content">
        <div v-show="activeTab === 'codeGen'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">编码生成统计</div>
                <div class="tech-hero-desc">多维度统计编码生成记录，支持按时段与类型筛选分析</div>
              </div>
            </div>
          </div>
          <CodeGenTab />
        </div>
        <div v-show="activeTab === 'measure'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">编码测点分析</div>
                <div class="tech-hero-desc">多维度统计分析全量测点数据，查看区域与类型分布情况</div>
              </div>
            </div>
          </div>
          <MeasureTab />
        </div>

      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeGenTab from './code-gen-tab.vue';
import MeasureTab from './measure-tab.vue';

const tabDefs = [
  { name: 'codeGen', label: '编码生成统计', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>' },
  { name: 'measure', label: '编码测点分析', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
];

const activeTab = ref(localStorage.getItem('statistics_active_tab') || 'codeGen');

function onTabChange(name: string | number) {
  localStorage.setItem('statistics_active_tab', String(name));
}
</script>

<style scoped>
.statistics-page {
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

/* ==================== 左侧标签导航 ==================== */
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

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
