<template>
  <div class="statistics-page">
    <div class="page-body">
      <el-tabs v-model="activeTab" class="page-tabs" @tab-change="onTabChange">
        <el-tab-pane label="编码生成统计" name="codeGen">
          <div class="subpage-hero">
            <div class="hero-icon">📈</div>
            <div class="hero-text">
              <div class="hero-title">编码生成统计</div>
              <div class="hero-subtitle">统计各类编码的生成记录，支持按时段、类型等多维度筛选和分析</div>
            </div>
          </div>
          <CodeGenTab />
        </el-tab-pane>
        <el-tab-pane label="全量测点统计" name="measure">
          <div class="subpage-hero">
            <div class="hero-icon">📊</div>
            <div class="hero-text">
              <div class="hero-title">全量测点统计</div>
              <div class="hero-subtitle">对全量测点数据进行多维度统计分析，支持按区域、类型和管理归口等维度查看分布</div>
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

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
