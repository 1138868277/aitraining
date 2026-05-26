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

    <!-- 概览 -->
    <div class="overview-stats mb-16" v-if="overview.totalPoints > 0">
      <div class="overview-stat-card">
        <div class="os-left">
          <div class="os-icon">📋</div>
          <div class="os-label">总测点数</div>
        </div>
        <div class="os-value">{{ overview.totalPoints }}</div>
      </div>
      <div class="overview-stat-card">
        <div class="os-left">
          <div class="os-icon">🌀</div>
          <div class="os-label">风电</div>
        </div>
        <div class="os-value" style="color:#409eff">{{ overview.windCount }}</div>
      </div>
      <div class="overview-stat-card">
        <div class="os-left">
          <div class="os-icon">☀️</div>
          <div class="os-label">光伏</div>
        </div>
        <div class="os-value" style="color:#67c23a">{{ overview.solarCount }}</div>
      </div>
      <div class="overview-stat-card">
        <div class="os-left">
          <div class="os-icon">🔄</div>
          <div class="os-label">其他</div>
        </div>
        <div class="os-value" style="color:#e6a23c">{{ overview.otherCount }}</div>
      </div>
    </div>

    <!-- 图表区 -->
    <template v-if="overview.totalPoints > 0">
      <div class="chart-row mb-16">
        <div class="chart-col">
          <div class="card-default chart-section">
            <div class="card-header">
              <span class="card-header-title">二级类码分布</span>
              <el-radio-group v-model="secondClassType" size="small">
                <el-radio-button value="wind">风电</el-radio-button>
                <el-radio-button value="solar">光伏</el-radio-button>
              </el-radio-group>
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
    <el-empty v-else-if="!importing" description="请先导入测点数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

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

const secondClassData = computed(() => {
  if (!secondClassItems.value.length) return null;
  const items = [...secondClassItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
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
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#7c9cf5' },
            { offset: 0.5, color: '#5a7de8' },
            { offset: 1, color: '#3b5fc9' },
          ],
        },
        shadowBlur: 8,
        shadowColor: 'rgba(59, 95, 201, 0.2)',
        shadowOffsetX: 2,
      },
    }],
  };
});

const stationData = computed(() => {
  if (!stationItems.value.length) return null;
  const items = [...stationItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
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
      axisLabel: { fontSize: 12, fontWeight: 600, color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      barMaxWidth: 26,
      barMinHeight: 8,
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#5ad8a6' },
            { offset: 0.5, color: '#36c27d' },
            { offset: 1, color: '#1fa86a' },
          ],
        },
        shadowBlur: 8,
        shadowColor: 'rgba(31, 168, 106, 0.2)',
        shadowOffsetX: 2,
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
      loadMeasureOverview();
      loadMeasureSecondClass();
      loadMeasureStation();
    } else if (s.status === 'FAILED') {
      importing.value = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.error(s.message || '导入失败');
    } else if (s.status === 'CANCELLED') {
      importing.value = false;
      imported.value = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.info(s.message || '已终止');
      loadMeasureOverview();
      loadMeasureSecondClass();
      loadMeasureStation();
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
  loadMeasureOverview();
  loadMeasureSecondClass();
  loadMeasureStation();
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
  loadMeasureOverview();
  loadMeasureSecondClass();
  loadMeasureStation();
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
  justify-content: center;
  gap: 14px;
  padding: 14px 12px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
  transition: all 0.25s ease;
}
.overview-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.os-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.os-icon { font-size: 24px; line-height: 1; }
.os-value { font-size: 28px; font-weight: 700; line-height: 1.2; color: #303133; }
.os-label { font-size: 12px; color: #909399; white-space: nowrap; }

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
.chart-body { padding: 8px 16px 16px; }

/* ==================== 图表区域 ==================== */
.chart-row { display: flex; gap: 16px; }
.chart-col { flex: 1; min-width: 0; }
.chart-section { height: 100%; }
.chart-container-h { height: 360px; width: 100%; }
.chart-scroll-wrap { overflow-y: auto; max-height: 420px; }

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
</style>
