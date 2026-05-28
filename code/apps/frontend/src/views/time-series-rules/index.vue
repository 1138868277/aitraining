<template>
  <div class="tsr-page">
    <div class="tsr-container">
      <!-- Pipeline -->
      <div class="pipeline">
        <div class="pipeline-header">
          <div class="pipeline-glow"></div>
          <h1 class="pipeline-title">时序稽核规则流水线</h1>
          <p class="pipeline-desc">自动化批量生成时序数据稽核质量规则</p>
        </div>

        <div class="region-bar">
          <span class="region-label">当前区域:</span>
          <el-select v-model="currentArea" class="region-select" @change="onRegionChange">
            <el-option v-for="r in regions" :key="r" :label="r" :value="r" />
          </el-select>
          <div class="region-stats" v-if="overview">
            <span class="stat-item">
              <i class="stat-dot" style="background:#38bdf8"></i>场站 {{ overview.station }}
            </span>
            <span class="stat-item">
              <i class="stat-dot" style="background:#a78bfa"></i>测点 {{ overview.measure }}
            </span>
          </div>
        </div>

        <div class="steps-flow">
          <div class="step-item" v-for="(step, idx) in steps" :key="idx">
            <div class="step-connector" v-if="idx > 0" :class="{ active: step.status !== 'pending' }">
              <div class="connector-line"></div>
              <div class="connector-arrow">&#9654;</div>
            </div>

            <div class="step-card" :class="[`step-${step.status}`]">
              <div class="step-card-glow"></div>
              <div class="step-header">
                <div class="step-badge" :class="`badge-${step.status}`">
                  <template v-if="step.status === 'completed'">&#10003;</template>
                  <template v-else-if="step.status === 'error'">&#10007;</template>
                  <template v-else-if="step.status === 'running'">
                    <span class="spinner"></span>
                  </template>
                  <template v-else>{{ idx + 1 }}</template>
                </div>
                <div class="step-info">
                  <h3 class="step-title">{{ step.title }}</h3>
                  <p class="step-desc">{{ step.desc }}</p>
                </div>
              </div>

              <div class="step-body">
                <!-- 导入场站 -->
                <template v-if="step.key === 'import-station'">
                  <div class="upload-zone" @dragover.prevent @drop.prevent="onDrop($event, 'station')" @click="triggerUpload('station')">
                    <input ref="stationInput" type="file" accept=".xlsx,.xls" hidden @change="onFileChange($event, 'station')" />
                    <div class="upload-icon">&#128230;</div>
                    <p class="upload-text">拖拽或点击上传组织机构编码 Excel</p>
                    <p class="upload-hint">需要包含"编码"和"名称"列</p>
                  </div>
                  <div v-if="stationFile" class="file-info">
                    <span class="file-name">{{ stationFile.name }}</span>
                    <el-button size="small" type="primary" :loading="stationLoading" @click="importStation">导入</el-button>
                  </div>
                  <div v-if="stationResult !== null" class="result-msg success">导入成功：{{ stationResult }} 条场站记录</div>
                </template>

                <!-- 导入测点 -->
                <template v-if="step.key === 'import-measure'">
                  <div class="upload-zone" @dragover.prevent @drop.prevent="onDrop($event, 'measure')" @click="triggerUpload('measure')">
                    <input ref="measureInput" type="file" accept=".xlsx,.xls" hidden @change="onFileChange($event, 'measure')" />
                    <div class="upload-icon">&#128196;</div>
                    <p class="upload-text">拖拽或点击上传时序测点 Excel</p>
                    <p class="upload-hint">需要包含"测点编码"和"测点描述"列</p>
                  </div>
                  <div v-if="measureFile" class="file-info">
                    <span class="file-name">{{ measureFile.name }}</span>
                    <el-button size="small" type="primary" :loading="measureLoading" @click="importMeasure">导入</el-button>
                  </div>
                  <div v-if="measureResult !== null" class="result-msg success">导入成功：{{ measureResult }} 条测点记录</div>
                </template>

                <!-- 生成规则 -->
                <template v-if="step.key === 'generate'">
                  <div class="generate-area">
                    <el-button type="primary" size="large" class="gen-btn" :loading="genLoading" @click="startGenerate">
                      <span class="gen-btn-icon">&#9889;</span>
                      开始生成稽核规则
                    </el-button>
                    <p class="gen-hint">将基于场站和测点数据，自动生成死值/跳变/越限/中断四种规则</p>
                  </div>
                  <div v-if="genResult" class="gen-result">
                    <div class="gen-total">共生成 <strong>{{ genResult.total }}</strong> 条规则</div>
                    <div class="gen-details">
                      <span v-for="d in genResult.details" :key="d.type" class="gen-tag" :class="`tag-${d.type}`">
                        {{ typeLabels[d.type] }}: {{ d.rows }}条
                      </span>
                    </div>
                  </div>
                </template>

                <!-- 导出文件 -->
                <template v-if="step.key === 'export'">
                  <div class="export-area">
                    <el-button v-for="t in exportTypes" :key="t.key" class="export-btn" :class="`btn-${t.key}`" @click="downloadFile(t.key)" :loading="exportLoading === t.key">
                      <span class="export-icon">&#128229;</span>
                      <span class="export-label">{{ t.label }}</span>
                    </el-button>
                  </div>
                  <div class="export-all">
                    <el-button type="success" @click="downloadAll" :loading="exportAllLoading">
                      &#128230; 打包下载全部
                    </el-button>
                  </div>
                </template>

                <!-- 拆分文件 -->
                <template v-if="step.key === 'split'">
                  <div class="split-area">
                    <div class="upload-zone" @dragover.prevent @drop.prevent="onDrop($event, 'split')" @click="triggerUpload('split')">
                      <input ref="splitInput" type="file" accept=".xlsx,.xls" hidden @change="onFileChange($event, 'split')" />
                      <div class="upload-icon">&#128260;</div>
                      <p class="upload-text">上传需要拆分的大文件 Excel</p>
                    </div>
                    <div class="split-config" v-if="splitFile">
                      <span class="file-name">{{ splitFile.name }}</span>
                      <label class="split-label">每文件最大行数:</label>
                      <el-input-number v-model="splitMaxRows" :min="10000" :max="500000" :step="10000" size="small" />
                      <el-button type="primary" size="small" :loading="splitLoading" @click="startSplit">拆分</el-button>
                    </div>
                    <div v-if="splitResult" class="split-result">
                      <p>拆分完成，共 {{ splitResult.fileCount }} 个文件</p>
                      <el-button v-for="(f, i) in splitResult.files" :key="i" size="small" @click="downloadSplit(f)">下载 {{ f.name }}</el-button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getRegions, getOverview,
  importStation as apiImportStation,
  importMeasure as apiImportMeasure,
  generateRules as apiGenerateRules,
  downloadRuleFile, exportAllRules, downloadBase64File,
  splitFile as apiSplitFile,
} from '@/services/time-series-rules';

const currentArea = ref('云南');
const regions = ref<string[]>([]);
const overview = ref<Record<string, number> | null>(null);

const typeLabels: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
const exportTypes = [
  { key: 'sz', label: '死值规则' },
  { key: 'tb', label: '跳变规则' },
  { key: 'yx', label: '越限规则' },
  { key: 'zd', label: '中断规则' },
];

const steps = reactive([
  { key: 'import-station', title: '导入场站数据', desc: '上传组织机构编码，导入场站基础信息', status: 'pending' },
  { key: 'import-measure', title: '导入测点数据', desc: '上传时序测点编码，导入测点标准化信息', status: 'pending' },
  { key: 'generate', title: '生成稽核规则', desc: '基于场站和测点数据自动生成质量稽核规则', status: 'pending' },
  { key: 'export', title: '导出规则文件', desc: '将生成的规则导出为标准 Excel 格式', status: 'pending' },
  { key: 'split', title: '大文件拆分', desc: '将超大型 Excel 按规则拆分为多个子文件', status: 'pending' },
]);

// ====== 导入场站 ======
const stationInput = ref<HTMLInputElement>();
const stationFile = ref<File | null>(null);
const stationLoading = ref(false);
const stationResult = ref<number | null>(null);

// ====== 导入测点 ======
const measureInput = ref<HTMLInputElement>();
const measureFile = ref<File | null>(null);
const measureLoading = ref(false);
const measureResult = ref<number | null>(null);

// ====== 生成规则 ======
const genLoading = ref(false);
const genResult = ref<{ total: number; details: { module: string; energy: string; type: string; rows: number }[] } | null>(null);

// ====== 导出 ======
const exportLoading = ref<string>('');
const exportAllLoading = ref(false);

// ====== 拆分 ======
const splitInput = ref<HTMLInputElement>();
const splitFile = ref<File | null>(null);
const splitMaxRows = ref(150000);
const splitLoading = ref(false);
const splitResult = ref<{ fileCount: number; files: { name: string; size: number; data: string }[] } | null>(null);

function triggerUpload(type: string) {
  const map: Record<string, any> = { station: stationInput, measure: measureInput, split: splitInput };
  map[type]?.value?.click();
}

function onFileChange(e: Event, type: string) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (type === 'station') stationFile.value = file;
  else if (type === 'measure') measureFile.value = file;
  else if (type === 'split') splitFile.value = file;
}

function onDrop(e: DragEvent, type: string) {
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (!file.name.match(/\.xlsx?$/i)) {
    ElMessage.warning('请上传 .xlsx 或 .xls 文件');
    return;
  }
  if (type === 'station') stationFile.value = file;
  else if (type === 'measure') measureFile.value = file;
  else if (type === 'split') splitFile.value = file;
}

async function importStation() {
  if (!stationFile.value) return;
  stationLoading.value = true;
  try {
    const res = await apiImportStation(currentArea.value, stationFile.value);
    stationResult.value = res.importedCount;
    steps[0].status = 'completed';
    ElMessage.success(`导入 ${res.importedCount} 条场站数据成功`);
    refreshOverview();
  } catch (err: any) {
    steps[0].status = 'error';
    ElMessage.error(err.message || '导入失败');
  } finally {
    stationLoading.value = false;
  }
}

async function importMeasure() {
  if (!measureFile.value) return;
  measureLoading.value = true;
  try {
    const res = await apiImportMeasure(currentArea.value, measureFile.value);
    measureResult.value = res.importedCount;
    steps[1].status = 'completed';
    ElMessage.success(`导入 ${res.importedCount} 条测点数据成功`);
    refreshOverview();
  } catch (err: any) {
    steps[1].status = 'error';
    ElMessage.error(err.message || '导入失败');
  } finally {
    measureLoading.value = false;
  }
}

async function startGenerate() {
  genLoading.value = true;
  steps[2].status = 'running';
  try {
    const res = await apiGenerateRules(currentArea.value);
    genResult.value = res;
    steps[2].status = 'completed';
    ElMessage.success(`生成完成，共 ${res.total} 条规则`);
  } catch (err: any) {
    steps[2].status = 'error';
    ElMessage.error(err.message || '生成失败');
  } finally {
    genLoading.value = false;
  }
}

async function downloadFile(type: string) {
  exportLoading.value = type;
  try {
    await downloadRuleFile(currentArea.value, type);
    steps[3].status = 'completed';
    ElMessage.success(`${typeLabels[type]}文件下载中`);
  } catch (err: any) {
    ElMessage.error(err.message || '下载失败');
  } finally {
    exportLoading.value = '';
  }
}

async function downloadAll() {
  exportAllLoading.value = true;
  try {
    const res = await exportAllRules(currentArea.value);
    steps[3].status = 'completed';
    for (const f of res.files) {
      downloadBase64File(f.data, `${currentArea.value}区域_时序稽核质量规则_${typeLabels[f.type]}.xlsx`);
    }
    ElMessage.success(`已下载 ${res.files.length} 个文件`);
  } catch (err: any) {
    ElMessage.error(err.message || '批量下载失败');
  } finally {
    exportAllLoading.value = false;
  }
}

async function startSplit() {
  if (!splitFile.value) return;
  splitLoading.value = true;
  try {
    const res = await apiSplitFile(splitFile.value, splitMaxRows.value);
    splitResult.value = res;
    steps[4].status = 'completed';
    ElMessage.success(`拆分完成，共 ${res.fileCount} 个文件`);
  } catch (err: any) {
    steps[4].status = 'error';
    ElMessage.error(err.message || '拆分失败');
  } finally {
    splitLoading.value = false;
  }
}

function downloadSplit(file: { name: string; data: string }) {
  downloadBase64File(file.data, file.name);
}

async function refreshOverview() {
  try {
    overview.value = await getOverview(currentArea.value);
  } catch {
    // ignore
  }
}

async function onRegionChange() {
  refreshOverview();
  steps.forEach(s => s.status = 'pending');
  stationFile.value = null;
  stationResult.value = null;
  measureFile.value = null;
  measureResult.value = null;
  genResult.value = null;
  splitFile.value = null;
  splitResult.value = null;
}

onMounted(async () => {
  try {
    regions.value = await getRegions();
  } catch { regions.value = ['云南', '福建', '广东', '四川', '宁夏', '山东', '甘肃', '乌江', '拉萨', '重庆', '黔源']; }
  refreshOverview();
});
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.tsr-page {
  width: 100%;
  min-height: calc(100vh - 80px);
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.tsr-container {
  max-width: 1100px;
  margin: 0 auto;
}

/* ==================== Pipeline 标题区 ==================== */
.pipeline-header {
  position: relative;
  text-align: center;
  padding: 32px 20px 24px;
  overflow: hidden;
}

.pipeline-glow {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 200px;
  background: radial-gradient(ellipse, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.pipeline-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a2a4a;
  margin: 0 0 8px;
  letter-spacing: 2px;
  position: relative;
}

.pipeline-title::after {
  content: '';
  display: block;
  width: 50px;
  height: 3px;
  margin: 10px auto 0;
  background: linear-gradient(90deg, #38bdf8, #3b82f6);
  border-radius: 2px;
}

.pipeline-desc {
  font-size: 14px;
  color: #6b7a8f;
  margin: 0;
}

/* ==================== 区域选择栏 ==================== */
.region-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  margin: 0 0 24px;
  background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.region-label {
  font-size: 14px;
  font-weight: 600;
  color: #1a2a4a;
  white-space: nowrap;
}

.region-select { width: 130px; }

.region-stats {
  display: flex;
  gap: 16px;
  margin-left: auto;
}

.stat-item {
  font-size: 13px;
  color: #4a5a6a;
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

/* ==================== 步骤流 ==================== */
.steps-flow {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 连接线 */
.step-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
  position: relative;
  z-index: 1;
}

.connector-line {
  width: 2px;
  height: 28px;
  background: linear-gradient(to bottom, #d0d5dd, #d0d5dd);
  transition: all 0.5s ease;
  border-radius: 1px;
}

.step-connector.active .connector-line {
  background: linear-gradient(to bottom, #38bdf8, #3b82f6);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
}

.connector-arrow {
  font-size: 10px;
  color: #d0d5dd;
  line-height: 1;
  margin-top: 2px;
  transition: color 0.3s;
}

.step-connector.active .connector-arrow {
  color: #3b82f6;
}

/* ==================== 步骤卡片 ==================== */
.step-card {
  position: relative;
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 24px 20px 28px;
  border: 1px solid #e8ecf0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.step-card:hover {
  border-color: #c8d0d8;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
}

.step-card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  transition: all 0.4s ease;
}

/* 状态样式 */
.step-completed {
  border-color: rgba(52, 211, 153, 0.3);
}
.step-completed .step-card-glow {
  background: linear-gradient(to bottom, #34d399, #10b981);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.3);
}

.step-running {
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.08);
}
.step-running .step-card-glow {
  background: linear-gradient(to bottom, #38bdf8, #3b82f6);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  animation: pulseGlow 1.5s ease-in-out infinite;
}

.step-error {
  border-color: rgba(239, 68, 68, 0.3);
}
.step-error .step-card-glow {
  background: linear-gradient(to bottom, #f87171, #ef4444);
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 头部 */
.step-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s;
}

.badge-pending {
  background: #f0f2f5;
  color: #8c9aa8;
}

.badge-running {
  background: #e0f2fe;
  color: #0284c7;
}

.badge-completed {
  background: #d1fae5;
  color: #059669;
}

.badge-error {
  background: #fee2e2;
  color: #dc2626;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #93c5fd;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a2a4a;
  margin: 0 0 3px;
}

.step-desc {
  font-size: 13px;
  color: #7a8a9a;
  margin: 0;
}

/* 身体区域 */
.step-body {
  padding-left: 46px;
}

/* ==================== 上传区域 ==================== */
.upload-zone {
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.upload-zone:hover {
  border-color: #38bdf8;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 36px;
  margin-bottom: 8px;
  line-height: 1;
}

.upload-text {
  font-size: 14px;
  color: #4a5a6a;
  margin: 0 0 4px;
}

.upload-hint {
  font-size: 12px;
  color: #9aa8b6;
  margin: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.15);
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #1a2a4a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-msg {
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
}

.result-msg.success {
  background: #d1fae5;
  color: #059669;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

/* ==================== 生成区域 ==================== */
.generate-area {
  text-align: center;
  padding: 10px 0;
}

.gen-btn {
  font-size: 16px;
  padding: 12px 36px;
  border-radius: 10px;
}

.gen-btn-icon {
  margin-right: 8px;
}

.gen-hint {
  font-size: 13px;
  color: #9aa8b6;
  margin: 10px 0 0;
}

.gen-result {
  margin-top: 12px;
  padding: 14px;
  background: #f0fdf4;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.gen-total {
  font-size: 15px;
  color: #1a2a4a;
  margin-bottom: 8px;
}

.gen-total strong {
  color: #059669;
  font-size: 20px;
}

.gen-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.gen-tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.tag-sz { background: #dbeafe; color: #1d4ed8; }
.tag-tb { background: #fce7f3; color: #be185d; }
.tag-yx { background: #fef3c7; color: #b45309; }
.tag-zd { background: #e0e7ff; color: #4338ca; }

/* ==================== 导出区域 ==================== */
.export-area {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.export-btn {
  min-width: 120px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid transparent;
}

.btn-sz {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border-color: #2563eb;
}

.btn-tb {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
  border-color: #db2777;
}

.btn-yx {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  border-color: #d97706;
}

.btn-zd {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  border-color: #7c3aed;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.export-all {
  margin-top: 12px;
}

/* ==================== 拆分区域 ==================== */
.split-area {
}

.split-config {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.split-label {
  font-size: 13px;
  color: #4a5a6a;
  white-space: nowrap;
}

.split-result {
  margin-top: 12px;
  padding: 12px;
  background: #f0f7ff;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.split-result p {
  margin: 0 0 8px;
  font-size: 14px;
  color: #1a2a4a;
}

.split-result .el-button {
  margin-right: 6px;
  margin-bottom: 4px;
}
</style>
