<template>
  <div class="tab-content">
    <!-- 导入区 -->
    <div class="import-bar mb-16">
      <span class="import-label">测点数据导入：</span>
      <el-button type="primary" :disabled="importing" @click="triggerFileInput">选择文件</el-button>
      <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleFile" />
      <span v-if="selectedFileName" class="import-file-name">{{ selectedFileName }}</span>
      <el-button v-if="!importing && imported" type="danger" size="small" @click="clearData" style="margin-left:12px">清空数据</el-button>
      <el-progress v-if="importing" :percentage="importProgress" :stroke-width="24" :text-inside="true" :color="progressColor" style="width:280px;margin-left:12px" />
      <span v-if="importing && importStatus.startTime" class="import-remain">预计剩余 {{ estimatedRemain }}</span>
      <el-button v-if="importing" type="warning" size="small" @click="onCancelImport" style="margin-left:4px">终止</el-button>
      <span v-if="importStatus.message" class="import-status-text" :class="importStatus.status.toLowerCase()">{{ importStatus.message }}</span>
      <span class="import-time">业务数据时间：{{ overview.lastImportTime ? formatTime(overview.lastImportTime) : '-' }}</span>
      <el-button :icon="Refresh" circle size="small" title="刷新数据" @click="handleRefresh" />
    </div>

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
    <el-empty v-else-if="!loading && !importing" description="请先导入测点数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const loading = ref(true);
const importing = ref(false);
const imported = ref(false);
const importStatus = ref<{ importing: boolean; batchId: string | null; totalRows: number; importedRows: number; validRows: number; status: string; message?: string; startTime?: number }>({ importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' });
const overview = ref({ totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0, lastImportTime: null as string | null });
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref('');

function triggerFileInput() {
  fileInputRef.value?.click();
}

function formatTime(t: string) {
  const d = new Date(t);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const secondClassType = ref('wind');
const secondClassWindItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const secondClassSolarItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const secondClassItems = computed(() => secondClassType.value === 'wind' ? secondClassWindItems.value : secondClassSolarItems.value);
const stationItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);

const progressColor = computed(() => importProgress.value < 100 ? '#409EFF' : '#67C23A');

const importProgress = computed(() => {
  if (importStatus.value.totalRows === 0) return 0;
  return Math.round((importStatus.value.importedRows / importStatus.value.totalRows) * 100);
});

const estimatedRemain = computed(() => {
  const s = importStatus.value;
  if (!s.startTime || s.totalRows === 0 || s.importedRows === 0) return '--';
  const elapsed = (Date.now() - s.startTime) / 1000;
  const progress = s.importedRows / s.totalRows;
  if (progress <= 0) return '--';
  const remainSec = Math.round(elapsed / progress * (1 - progress));
  if (remainSec < 60) return `${remainSec}秒`;
  const min = Math.floor(remainSec / 60);
  const sec = remainSec % 60;
  return `${min}分${sec}秒`;
});

async function onCancelImport() {
  try {
    await statsService.cancelImport();
    ElMessage.info('正在终止导入...');
  } catch {}
}

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

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  selectedFileName.value = file.name;
  importing.value = true;
  imported.value = false;
  importStatus.value = { importing: true, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'PROCESSING', message: '上传中...' };

  // 立即开始轮询后台处理进度
  pollTimer = setInterval(pollStatus, 2000);

  try {
    await statsService.importMeasurementFile(file);
  } catch (err: any) {
    // 超时错误不停止轮询（后端仍在处理）
    if (err.message !== '请求超时，请重试') {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      importing.value = false;
      importStatus.value.status = 'FAILED';
      importStatus.value.message = err.response?.data?.message || '导入失败';
      ElMessage.error(importStatus.value.message);
    } else {
      importStatus.value.message = '导入任务仍在处理中，请等待...';
    }
  }
  input.value = '';
}

async function pollStatus() {
  try {
    const s = await statsService.getImportStatus();
    importStatus.value = s;
    if (s.status === 'COMPLETED') {
      importing.value = false;
      imported.value = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.success(`导入完成，有效编码 ${s.validRows} 条`);
      loadAllData();
    } else if (s.status === 'FAILED') {
      importing.value = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.error(s.message || '导入失败');
    } else if (s.status === 'CANCELLED') {
      importing.value = false;
      imported.value = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.info(s.message || '已终止');
      loadAllData();
    }
  } catch {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    importing.value = false;
  }
}

async function loadMeasureOverview() {
  try { overview.value = await statsService.getMeasureOverview(); } catch {}
}
async function loadMeasureSecondClass() {
  const [wind, solar] = await Promise.all([
    statsService.getMeasureBySecondClass('wind').catch(() => ({ items: [] })),
    statsService.getMeasureBySecondClass('solar').catch(() => ({ items: [] })),
  ]);
  secondClassWindItems.value = wind.items;
  secondClassSolarItems.value = solar.items;
}
async function loadMeasureStation() {
  try { stationItems.value = (await statsService.getMeasureByStation()).items; } catch {}
}

async function loadAllData() {
  loading.value = true;
  await Promise.all([
    loadMeasureOverview(),
    loadMeasureSecondClass(),
    loadMeasureStation(),
  ]);
  loading.value = false;
}

async function clearData() {
  try {
    await ElMessageBox.confirm('确定清空所有导入的测点数据？此操作不可恢复。', '确认', { type: 'warning' });
    await statsService.clearMeasurementData();
    overview.value = { totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0, lastImportTime: null };
    secondClassWindItems.value = [];
    secondClassSolarItems.value = [];
    stationItems.value = [];
    imported.value = false;
    importStatus.value = { importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' };
    ElMessage.success('已清空');
  } catch {}
}

function handleRefresh() {
  loadAllData();
}

onMounted(async () => {
  // 检查是否有正在进行的导入任务
  try {
    const s = await statsService.getImportStatus();
    if (s.importing || s.status === 'PROCESSING') {
      importing.value = true;
      importStatus.value = s;
      pollTimer = setInterval(pollStatus, 2000);
    } else if (s.status === 'COMPLETED') {
      imported.value = true;
      importStatus.value = s;
    }
  } catch {}
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

/* ==================== 通用卡片（科技风） ==================== */
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

/* ==================== 导入栏 ==================== */
.import-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 14px 16px; background: #fafbff; border: 1px solid #eef0f6; border-radius: 8px; }
.import-label { font-size: 14px; font-weight: 600; color: #303133; white-space: nowrap; }
.import-file-name { font-size: 13px; color: #606266; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.import-remain { font-size: 12px; color: #909399; white-space: nowrap; }
.import-time { margin-left: auto; font-size: 13px; color: #909399; white-space: nowrap; }
.import-status-text { font-size: 13px; margin-left: 8px; }
.import-status-text.completed { color: #67c23a; }
.import-status-text.failed { color: #f56c6c; }
.import-status-text.processing { color: #409eff; }

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
