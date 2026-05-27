<template>
  <div class="tab-content">
    <!-- 字典新增情况 -->
    <div class="card-default mb-16">
      <div class="card-header">
        <span class="card-header-title">字典新增情况</span>
      </div>
      <div class="card-body">
        <div class="overview-stats mb-16">
          <div class="overview-stat-card">
            <div class="os-body" style="text-align:center">
              <div class="os-value">{{ add.totalNewCodes }}</div>
              <div class="os-label">新增总数</div>
            </div>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-col">
            <div class="chart-subtitle">按二级类码</div>
            <div class="chart-container-sm"><v-chart v-if="scBarData" :option="scBarData" autoresize /></div>
          </div>
          <div class="chart-col">
            <div class="chart-subtitle">按日期趋势</div>
            <div class="chart-container-sm"><v-chart v-if="dateLineData" :option="dateLineData" autoresize /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const add = ref({ totalNewCodes: 0, newCodesBySecondClass: [] as any[], newCodesByDate: [] as any[] });

const scBarData = computed(() => {
  const items = add.value.newCodesBySecondClass;
  if (!items.length) return null;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
    },
    grid: { left: '3%', right: '4%', bottom: '18%', containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map(i => i.secondClassName || i.secondClassCode),
      axisLabel: { rotate: 40, fontSize: 10, color: '#606266' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.count),
      barMaxWidth: 32,
      barMinHeight: 6,
      label: {
        show: true,
        position: 'top',
        fontSize: 10,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#f5c25a' },
            { offset: 1, color: '#d4942f' },
          ],
        },
        shadowBlur: 6,
        shadowColor: 'rgba(212, 148, 47, 0.2)',
        shadowOffsetY: 2,
      },
    }],
  };
});

const dateLineData = computed(() => {
  const items = add.value.newCodesByDate;
  if (!items.length) return null;
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map(i => i.date),
      axisLabel: { fontSize: 10, color: '#606266', interval: 3 },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    series: [{
      type: 'line',
      data: items.map(i => i.count),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2.5, color: '#409EFF' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64,158,255,0.25)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' },
          ],
        },
      },
      itemStyle: { color: '#409EFF' },
    }],
  };
});

onMounted(async () => {
  try { add.value = await statsService.getDictNewAddition(); } catch {}
});
</script>

<style scoped>
.tab-content { min-height: 400px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mb-16 { margin-bottom: 16px; }

/* ==================== 概览统计卡片 ==================== */
.overview-stats { display: flex; gap: 12px; }
.overview-stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
  transition: all 0.25s ease;
}
.overview-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.os-body { flex: 1; }
.os-value { font-size: 24px; font-weight: 700; line-height: 1.2; color: #303133; }
.os-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ==================== 通用卡片 ==================== */
.card-default {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}
.card-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
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
  background: #409eff;
}
.card-body { padding: 16px; }

/* ==================== 图表区域 ==================== */
.chart-row { display: flex; gap: 16px; }
.chart-col { flex: 1; min-width: 0; }
.chart-subtitle { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.chart-container-sm { height: 280px; width: 100%; }
</style>
