<template>
  <div class="statistics-page">
    <div class="page-body">
      <el-tabs v-model="activeTab" class="page-tabs" @tab-change="onTabChange">
        <el-tab-pane label="编码生成统计" name="codeGen">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <h2 class="tech-hero-title"><span class="hero-title-icon">📈</span> 编码生成统计</h2>
              <p class="tech-hero-desc">统计各类编码的生成记录，支持按时段、类型等多维度筛选和分析</p>
            </div>
          </div>
          <CodeGenTab />
        </el-tab-pane>
        <el-tab-pane label="全量测点统计" name="measure">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <h2 class="tech-hero-title"><span class="hero-title-icon">📊</span> 全量测点统计</h2>
              <p class="tech-hero-desc">对全量测点数据进行多维度统计分析，支持按区域、类型和管理归口等维度查看分布</p>
            </div>
          </div>
          <MeasureTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeGenTab from './code-gen-tab.vue';
import MeasureTab from './measure-tab.vue';

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

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
