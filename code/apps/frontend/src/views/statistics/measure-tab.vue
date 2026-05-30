<template>
  <div class="tab-content">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p class="loading-text">数据加载中...</p>
    </div>

    <!-- 概览 -->
    <div class="card-default mb-16" v-if="!loading && overview.totalPoints > 0">
      <div class="card-header">
        <span class="card-header-title">概览</span>
      </div>
      <div class="card-body">
        <div class="tech-metrics">
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#3b82f6;background:rgba(59,130,246,0.1)">📋</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#3b82f6">{{ overview.totalPoints }}</div>
              <div class="tmc-label">总测点数</div>
            </div>
            <div class="tmc-glow" style="background:#3b82f6"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#f59e0b;background:rgba(245,158,11,0.1)">🌀</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#f59e0b">{{ overview.windCount }}</div>
              <div class="tmc-label">风电</div>
            </div>
            <div class="tmc-glow" style="background:#f59e0b"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#06b6d4;background:rgba(6,182,212,0.1)">☀️</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#06b6d4">{{ overview.solarCount }}</div>
              <div class="tmc-label">光伏</div>
            </div>
            <div class="tmc-glow" style="background:#06b6d4"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#909399;background:rgba(144,147,153,0.1)">🔄</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#909399">{{ overview.otherCount }}</div>
              <div class="tmc-label">其他</div>
            </div>
            <div class="tmc-glow" style="background:#909399"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区 -->
    <template v-if="!loading && overview.totalPoints > 0">
      <div class="chart-row mb-16">
        <div class="chart-col">
          <div class="card-default chart-section">
            <div class="card-header">
              <span class="card-header-title">二级类码分布</span>
              <div class="tech-filter-group">
                <button :class="['tech-filter-btn', { active: secondClassType === 'wind' }]" @click="secondClassType='wind'">
                  <span class="tfb-dot" style="background:#3b82f6"></span>风电
                </button>
                <button :class="['tech-filter-btn', { active: secondClassType === 'solar' }]" @click="secondClassType='solar'">
                  <span class="tfb-dot" style="background:#f59e0b"></span>光伏
                </button>
              </div>
            </div>
            <div class="card-body chart-body">
              <template v-if="secondClassItems.length > 0">
                <div class="chart-container-h"><v-chart :option="secondClassData" autoresize /></div>
              </template>
              <el-empty v-else description="暂无数据" :image-size="80" />
            </div>
          </div>
        </div>
        <div class="chart-col">
          <div class="card-default chart-section">
            <div class="card-header">
              <span class="card-header-title">场站分布</span>
            </div>
            <div class="card-body chart-body">
              <template v-if="stationItems.length > 0">
                <div class="chart-scroll-wrap">
                  <div class="chart-container-h" :style="{ height: stationChartHeight + 'px' }"><v-chart :option="stationData" autoresize /></div>
                </div>
              </template>
              <el-empty v-else description="暂无场站数据" :image-size="80" />
            </div>
          </div>
        </div>
      </div>
    </template>
    <el-empty v-else-if="!loading" description="暂无测点数据，请先到「系统配置 > 测点导入」中导入数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const loading = ref(true);
const overview = ref({ totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0, lastImportTime: null as string | null });
const secondClassType = ref('wind');
const secondClassWindItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const secondClassSolarItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const secondClassItems = computed(() => secondClassType.value === 'wind' ? secondClassWindItems.value : secondClassSolarItems.value);
const stationItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);

const secondClassData = computed((): any => {
  if (!secondClassItems.value.length) return null;
  const items = [...secondClassItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-weight:600;color:#303133;margin-bottom:4px;">${p.axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>
                  <span style="color:#909399;">数量：</span>
                  <span style="color:#303133;font-weight:700;">${p.value}</span>
                </div>`;
      },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,0.06);border-radius:8px;',
      textStyle: { fontSize: 12, color: '#606266' },
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLabel: { fontSize: 11, fontWeight: 600, color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      barMaxWidth: 26,
      barMinHeight: 8,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 40,
      label: {
        show: true,
        position: 'right',
        fontSize: 12,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#22d3ee' },
          ],
        },
        shadowBlur: 4,
        shadowColor: 'rgba(59,130,246,0.15)',
        shadowOffsetX: 1,
      },
    }],
  };
});

const stationData = computed((): any => {
  if (!stationItems.value.length) return null;
  const items = [...stationItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-weight:600;color:#303133;margin-bottom:4px;">${p.axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;"></span>
                  <span style="color:#909399;">数量：</span>
                  <span style="color:#303133;font-weight:700;">${p.value}</span>
                </div>`;
      },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,0.06);border-radius:8px;',
      textStyle: { fontSize: 12, color: '#606266' },
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLabel: { fontSize: 11, fontWeight: 600, color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      barMaxWidth: 26,
      barMinHeight: 8,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 40,
      label: {
        show: true,
        position: 'right',
        fontSize: 12,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#22d3ee' },
          ],
        },
        shadowBlur: 4,
        shadowColor: 'rgba(139,92,246,0.15)',
        shadowOffsetX: 1,
      },
    }],
  };
});

const stationChartHeight = computed(() => {
  const count = stationItems.value.length;
  return Math.max(360, count * 32 + 60);
});

async function loadAllData() {
  loading.value = true;
  try {
    const [ov, wind, solar, station] = await Promise.all([
      statsService.getMeasureOverview().catch(() => ({ totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0, lastImportTime: null })),
      statsService.getMeasureBySecondClass('wind').catch(() => ({ items: [] })),
      statsService.getMeasureBySecondClass('solar').catch(() => ({ items: [] })),
      statsService.getMeasureByStation().catch(() => ({ items: [] })),
    ]);
    overview.value = ov;
    secondClassWindItems.value = wind.items;
    secondClassSolarItems.value = solar.items;
    stationItems.value = station.items;
  } catch {}
  loading.value = false;
}

onMounted(() => {
  loadAllData();
});
</script>

<style scoped>
.tab-content { min-height: 400px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mb-16 { margin-bottom: 16px; }

/* ==================== 科技风指标卡片 ==================== */
.tech-metrics { display: flex; gap: 12px; }
.tech-metric-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tech-metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}
.tmc-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0.6;
}
.tmc-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.tmc-body { flex: 1; }
.tmc-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.tmc-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ==================== 通用卡片 ==================== */
.card-default {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e4e9f2;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
  position: relative;
  transition: box-shadow 0.3s ease;
}
.card-default::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}
.card-default:hover {
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f8;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
}
.card-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a2a4a;
  position: relative;
  padding-left: 12px;
}
.card-header-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #22d3ee);
}
.card-body { padding: 16px; }
.chart-body { padding: 8px 16px 16px; }

/* ==================== 图表区域 ==================== */
.chart-row { display: flex; gap: 16px; }
.chart-col { flex: 1; min-width: 0; }
.chart-section { height: 100%; }
.chart-container-h { height: 360px; width: 100%; }
.chart-scroll-wrap { overflow-y: auto; max-height: 420px; }

/* ==================== 科技风切换按钮 ==================== */
.tech-filter-group {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.1);
}
.tech-filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  outline: none;
  white-space: nowrap;
}
.tech-filter-btn:hover {
  color: #303133;
  background: rgba(59, 130, 246, 0.08);
}
.tech-filter-btn.active {
  color: #3b82f6;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04));
  box-shadow: 0 1px 4px rgba(59,130,246,0.12);
}
.tfb-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  transition: box-shadow 0.25s ease;
}
.tech-filter-btn.active .tfb-dot {
  box-shadow: 0 0 6px currentColor;
}

/* ==================== 加载动画 ==================== */
.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e8ecf1;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #909399;
}
</style>
