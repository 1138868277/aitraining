<template>
  <div class="tab-content">
    <!-- 导入区 -->
    <el-card class="mb-16">
      <template #header><span>测点数据导入</span></template>
      <el-upload drag action="#" accept=".xlsx,.xls" :auto-upload="false" :disabled="importing" :on-change="handleFile" :limit="1">
        <el-icon class="el-icon--upload"><svg viewBox="0 0 1024 1024" width="40" height="40" fill="#909399"><path d="M544 864V288h-64v576H352l160 160 160-160z"/><path d="M128 128h768v128H128z"/></svg></el-icon>
        <div class="el-upload__text">拖拽测点Excel文件到此处，或<em>点击上传</em></div>
        <template #tip><div class="el-upload__tip">支持 .xlsx/.xls 文件，包含31位测点编码列</div></template>
      </el-upload>
      <div v-if="importStatus.message" class="import-status" :class="importStatus.status.toLowerCase()">{{ importStatus.message }}</div>
      <el-progress v-if="importing" :percentage="importProgress" :stroke-width="16" :text-inside="true" class="mt-16" />
      <el-button v-if="!importing && imported" type="danger" size="small" @click="clearData" class="mt-16">清空数据</el-button>
    </el-card>

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
        <el-col :span="8">
          <el-card>
            <template #header><span>类型分布</span></template>
            <div class="chart-container"><v-chart v-if="typePieData" :option="typePieData" autoresize /></div>
          </el-card>
        </el-col>
        <el-col :span="16">
          <el-card>
            <template #header>
              <div class="card-header"><span>维度统计</span><el-select v-model="measureDim" size="small" style="width:140px" @change="loadMeasureDim">
                <el-option label="类型" value="typeCode" /><el-option label="场站" value="stationCode" />
                <el-option label="二级类码" value="secondClassCode" /><el-option label="三级类码" value="thirdClassCode" />
                <el-option label="数据类码" value="dataCategoryCode" />
              </el-select></div>
            </template>
            <div class="chart-container"><v-chart v-if="dimBarData" :option="dimBarData" autoresize /></div>
          </el-card>
        </el-col>
      </el-row>
      <el-card class="mb-16">
        <template #header>
          <div class="card-header"><span>类型下钻</span><el-select v-model="drillType" size="small" style="width:140px" @change="loadDrill">
            <el-option label="风电" value="F" /><el-option label="光伏" value="G" />
          </el-select></div>
        </template>
        <div class="chart-container-sm"><v-chart v-if="drillData" :option="drillData" autoresize /></div>
      </el-card>
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
const importStatus = ref<{ importing: boolean; batchId: string | null; totalRows: number; importedRows: number; validRows: number; status: string; message?: string }>({ importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' });
const overview = ref({ totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0 });
const measureDim = ref('typeCode');
const dimItems = ref<Array<{ name: string; count: number; percentage: number }>>([]);
const drillType = ref('F');
const drillItems = ref<Array<{ name: string; count: number; percentage: number }>>([]);
const drillTotal = ref(0);

const importProgress = computed(() => {
  if (importStatus.value.totalRows === 0) return 0;
  return Math.round((importStatus.value.importedRows / importStatus.value.totalRows) * 100);
});

const typePieData = computed(() => {
  const o = overview.value;
  if (!o.totalPoints) return null;
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { name: '风电', value: o.windCount },
        { name: '光伏', value: o.solarCount },
        { name: '其他', value: o.otherCount },
      ],
      label: { show: true, formatter: '{b}: {c} ({d}%)' },
    }],
  };
});

const dimBarData = computed(() => {
  if (!dimItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: dimItems.value.map(i => i.name), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: dimItems.value.map(i => i.count), itemStyle: { color: '#409EFF' }, barMaxWidth: 40 }],
  };
});

const drillData = computed(() => {
  if (!drillItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    title: { text: `${drillType.value === 'F' ? '风电' : '光伏'} - 二级类码分布 (共${drillTotal.value}个测点)`, textStyle: { fontSize: 14 } },
    xAxis: { type: 'category', data: drillItems.value.map(i => i.name), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: drillItems.value.map(i => i.count), itemStyle: { color: '#67C23A' }, barMaxWidth: 40 }],
  };
});

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function handleFile(file: any) {
  importing.value = true;
  imported.value = false;
  importStatus.value = { importing: true, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'PROCESSING', message: '上传中...' };
  try {
    await statsService.importMeasurementFile(file.raw);
    pollTimer = setInterval(pollStatus, 2000);
  } catch (err: any) {
    importing.value = false;
    importStatus.value.status = 'FAILED';
    importStatus.value.message = err.response?.data?.message || '导入失败';
    ElMessage.error(importStatus.value.message);
  }
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
      loadMeasureDim();
      loadDrill();
    } else if (s.status === 'FAILED') {
      importing.value = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.error(s.message || '导入失败');
    }
  } catch {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    importing.value = false;
  }
}

async function loadMeasureOverview() {
  try { overview.value = await statsService.getMeasureOverview(); } catch {}
}
async function loadMeasureDim() {
  try { dimItems.value = (await statsService.getMeasureByDimension(measureDim.value)).items; } catch {}
}
async function loadDrill() {
  try {
    const d = await statsService.getMeasureDrillDown(drillType.value);
    drillItems.value = d.secondClassItems;
    drillTotal.value = d.total;
  } catch {}
}

async function clearData() {
  try {
    await ElMessageBox.confirm('确定清空所有导入的测点数据？此操作不可恢复。', '确认', { type: 'warning' });
    await statsService.clearMeasurementData();
    overview.value = { totalPoints: 0, windCount: 0, solarCount: 0, otherCount: 0 };
    dimItems.value = [];
    drillItems.value = [];
    imported.value = false;
    importStatus.value = { importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' };
    ElMessage.success('已清空');
  } catch {}
}

onMounted(() => { loadMeasureOverview(); loadMeasureDim(); loadDrill(); });
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
.chart-container { height: 320px; width: 100%; }
.chart-container-sm { height: 280px; width: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.import-status { margin-top: 12px; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
.import-status.completed { background: #f0f9eb; color: #67c23a; }
.import-status.failed { background: #fef0f0; color: #f56c6c; }
.import-status.processing { background: #ecf5ff; color: #409eff; }
</style>
