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
    </div>

    <!-- 概览 -->
    <el-row :gutter="16" class="mb-16" v-if="overview.totalPoints > 0">
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">总测点数</div><div class="stat-value">{{ overview.totalPoints }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">风电</div><div class="stat-value primary">{{ overview.windCount }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">光伏</div><div class="stat-value success">{{ overview.solarCount }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">其他</div><div class="stat-value warning">{{ overview.otherCount }}</div></div></el-card></el-col>
    </el-row>

    <!-- 图表区 -->
    <template v-if="overview.totalPoints > 0">
      <el-row :gutter="16" class="mb-16">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span class="section-title">二级类码维度</span>
                <el-radio-group v-model="secondClassType" size="small">
                  <el-radio-button value="wind">风电</el-radio-button>
                  <el-radio-button value="solar">光伏</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-container-h"><v-chart v-if="secondClassData" :option="secondClassData" autoresize /></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header><span class="section-title">场站维度</span></template>
            <div class="chart-scroll-wrap">
              <div class="chart-container-h" :style="{ height: stationChartHeight + 'px' }"><v-chart v-if="stationData" :option="stationData" autoresize /></div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </template>
    <el-empty v-else-if="!importing" description="请先导入测点数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    yAxis: {
      type: 'category',
      data: secondClassItems.value.map(i => i.name).reverse(),
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: secondClassItems.value.map(i => i.value).reverse(),
      barMaxWidth: 24,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#4db8ff' },
            { offset: 1, color: '#1a7bca' },
          ],
        },
        shadowBlur: 6,
        shadowColor: 'rgba(26, 123, 202, 0.3)',
        shadowOffsetX: 2,
      },
    }],
  };
});

const stationData = computed(() => {
  if (!stationItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    yAxis: {
      type: 'category',
      data: stationItems.value.map(i => i.name).reverse(),
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stationItems.value.map(i => i.value).reverse(),
      barMaxWidth: 24,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#40944f' },
          ],
        },
        shadowBlur: 6,
        shadowColor: 'rgba(64, 148, 79, 0.3)',
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
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    importing.value = false;
    importStatus.value.status = 'FAILED';
    importStatus.value.message = err.response?.data?.message || '导入失败';
    ElMessage.error(importStatus.value.message);
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
.tab-content { min-height: 400px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.warning { color: #E6A23C; }
.chart-container-h { height: 360px; width: 100%; }
.chart-card { height: 100%; }
.section-title { font-weight: 600; font-size: 15px; }
.chart-scroll-wrap { overflow-y: auto; max-height: 420px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.import-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #fff; border: 1px solid #e4e7ed; border-radius: 4px; }
.import-label { font-size: 14px; font-weight: 600; color: #303133; white-space: nowrap; }
.import-file-name { font-size: 13px; color: #606266; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.import-remain { font-size: 12px; color: #909399; white-space: nowrap; }
.import-time { margin-left: auto; font-size: 13px; color: #909399; white-space: nowrap; }
.import-status-text { font-size: 13px; margin-left: 8px; }
.import-status-text.completed { color: #67c23a; }
.import-status-text.failed { color: #f56c6c; }
.import-status-text.processing { color: #409eff; }
</style>
