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
          <div class="tenant-display">
            <div class="tenant-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="tenant-info">
              <span class="region-label">当前租户</span>
              <span class="tenant-name">{{ currentSchema }}</span>
            </div>
          </div>
          <div class="region-stats" v-if="overview">
            <div class="stat-card">
              <div class="stat-icon stat-icon-station">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div class="stat-info">
                <span class="stat-num">{{ overview.station }}</span>
                <span class="stat-label">场站</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon stat-icon-measure">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 12h-4V8"/></svg>
              </div>
              <div class="stat-info">
                <span class="stat-num">{{ overview.measure }}</span>
                <span class="stat-label">测点</span>
              </div>
            </div>
          </div>
          <el-button class="clear-btn" :loading="clearing" @click="handleClear">清空数据</el-button>
        </div>

        <div class="steps-flow">
          <div class="step-item" v-for="(step, idx) in steps" :key="idx">
            <div class="step-connector" v-if="idx > 0" :class="{ active: step.status !== 'pending' }">
              <div class="connector-dot top"></div>
              <div class="connector-line">
                <div class="connector-fill"></div>
              </div>
              <div class="connector-dot bottom"></div>
              <div class="connector-arrow">
                <svg viewBox="0 0 22 14" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="11,14 1,3 21,3" />
                </svg>
              </div>
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
                  <template v-else-if="step.status === 'partial'">&#9888;</template>
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
                  <div class="upload-zone" :class="{ 'upload-disabled': importOngoing }" @dragover.prevent @drop.prevent="!importOngoing && onDrop($event, 'station')" @click="!importOngoing && triggerUpload('station')">
                    <div class="upload-icon">&#128230;</div>
                    <p class="upload-text">拖拽或点击上传组织机构编码 Excel</p>
                    <p class="upload-hint">需要包含"编码"和"名称"列（或"组织机构编码"/"组织机构编码名称"）</p>
                  </div>
                  <div v-if="stationFile" class="file-info">
                    <span class="file-name">{{ stationFile.name }}</span>
                    <el-button size="small" type="primary" :loading="stationLoading" :disabled="importOngoing" @click="importStation">导入</el-button>
                  </div>
                  <!-- 双进度条一行：左1/3上传，右2/3导入 -->
                  <div v-if="stationProgress < 100 && (stationUploadPercent > 0 || stationProgress > 0)" class="tech-progress-row">
                    <div class="tech-progress tech-progress-uploading" :class="{ 'tech-progress-done': stationUploadPercent >= 100 }" style="width:33%">
                      <div class="tech-progress-track">
                        <div class="tech-progress-fill" :style="{ width: Math.min(stationUploadPercent, 100) + '%' }">
                          <div class="tech-progress-glow"></div>
                        </div>
                      </div>
                      <div class="tech-progress-label">上传 {{ stationUploadPercent >= 100 ? '完成' : stationUploadPercent + '%' }}</div>
                    </div>
                    <div class="tech-progress" style="width:67%">
                      <div class="tech-progress-track">
                        <div class="tech-progress-fill" :style="{ width: stationProgress + '%' }">
                          <div class="tech-progress-glow"></div>
                        </div>
                      </div>
                      <div class="tech-progress-label" v-if="stationProgress >= 100">导入完成</div>
                      <div class="tech-progress-label" v-else>导入 {{ stationProgress }}%</div>
                    </div>
                  </div>
                  <div v-if="stationResult !== null" class="result-msg success">导入成功：{{ stationResult }} 条场站记录</div>
                </template>

                <!-- 导入测点 -->
                <template v-if="step.key === 'import-measure'">
                  <div class="upload-zone" :class="{ 'upload-disabled': importOngoing }" @dragover.prevent @drop.prevent="!importOngoing && onDrop($event, 'measure')" @click="!importOngoing && triggerUpload('measure')">
                    <div class="upload-icon">&#128196;</div>
                    <p class="upload-text">拖拽或点击上传时序测点 Excel</p>
                    <p class="upload-hint">需要包含"测点编码"和"测点描述"列</p>
                  </div>
                  <div v-if="measureFile" class="file-info">
                    <span class="file-name">{{ measureFile.name }}</span>
                    <el-button size="small" type="primary" :loading="measureLoading" :disabled="importOngoing" @click="importMeasure">导入</el-button>
                  </div>
                  <!-- 双进度条一行：左1/3上传，右2/3导入 -->
                  <div v-if="measureProgress < 100 && (measureUploadPercent > 0 || measureProgress > 0)" class="tech-progress-row">
                    <div class="tech-progress tech-progress-uploading" :class="{ 'tech-progress-done': measureUploadPercent >= 100 }" style="width:33%">
                      <div class="tech-progress-track">
                        <div class="tech-progress-fill" :style="{ width: Math.min(measureUploadPercent, 100) + '%' }">
                          <div class="tech-progress-glow"></div>
                        </div>
                      </div>
                      <div class="tech-progress-label">上传 {{ measureUploadPercent >= 100 ? '完成' : measureUploadPercent + '%' }}</div>
                    </div>
                    <div class="tech-progress" style="width:67%">
                      <div class="tech-progress-track">
                        <div class="tech-progress-fill" :style="{ width: measureProgress + '%' }">
                          <div class="tech-progress-glow"></div>
                        </div>
                      </div>
                      <div class="tech-progress-label" v-if="measureProgress >= 100">导入完成</div>
                      <div class="tech-progress-label" v-else>导入 {{ measureProgress }}%</div>
                    </div>
                  </div>
                  <div v-if="measureResult !== null" class="result-msg success">导入成功：{{ measureResult }} 条测点记录</div>
                </template>

                <!-- 生成规则 -->
                <template v-if="step.key === 'generate'">
                  <div class="generate-area">
                    <el-button type="primary" size="large" class="gen-btn" :disabled="genLoading" @click="startGenerate">
                      <span class="gen-btn-icon">&#9889;</span>
                      开始生成稽核规则
                    </el-button>
                    <p class="gen-hint">将基于场站和测点数据，自动生成死值/跳变/越限/中断四种规则</p>
                  </div>

                  <!-- 生成进度面板（完成后隐藏，由结果表格替代） -->
                  <div v-if="(genLoading || genProgress.done > 0) && !genResult" class="gen-progress-panel">
                    <div class="gen-progress-header">
                      <span class="gen-progress-title">生成进度</span>
                      <span class="gen-progress-status" :class="`gen-status-${genProgress.status}`">
                        {{ genProgress.status === 'processing' ? '生成中...' : genProgress.status === 'completed' ? '已完成' : '' }}
                      </span>
                    </div>
                    <div class="gen-progress-bar">
                      <div class="gen-progress-fill" :style="{ width: genProgress.total > 0 ? Math.round((genProgress.done / genProgress.total) * 100) + '%' : '0%' }"></div>
                    </div>
                    <div class="gen-progress-count">
                      已完成 {{ genProgress.done }} / {{ genProgress.total }} 步
                    </div>

                    <!-- 当前正在生成的步骤 -->
                    <div v-if="genCurrentStep" class="gen-step-running">
                      <span class="gen-step-spinner"></span>
                      <span>正在生成 {{ genCurrentStep.module }} / {{ genCurrentStep.energy }} / {{ ruleTypeLabels[genCurrentStep.ruleType] || genCurrentStep.ruleType }} 规则...</span>
                    </div>

                    <!-- 已完成步骤列表 -->
                    <div v-if="genDoneSteps.length > 0" class="gen-steps-done">
                      <div v-for="(step, si) in genDoneSteps" :key="si" class="gen-step-item" :class="`gen-step-${step.status}`">
                        <span class="gen-step-icon">{{ step.status === 'completed' ? '&#10003;' : '&#10007;' }}</span>
                        <span class="gen-step-label">{{ step.module }} / {{ step.energy }} / {{ ruleTypeLabels[step.ruleType] || step.ruleType }}</span>
                        <span class="gen-step-rows">{{ step.rows }} 条</span>
                      </div>
                    </div>
                  </div>

                  <!-- 结果明细（科技风表格） -->
                  <div v-if="genResult" class="gen-result-tech">
                    <div class="gen-result-tech-header">
                      <div class="gen-result-tech-title">共生成 <em>{{ totalRules }}</em> 条规则，涉及 <em class="title-rules">{{ genResult.total }}</em> 个测点</div>
                      <span v-if="genCreateTime" class="gen-time-label">生成时间: {{ genCreateTime }}</span>
                    </div>
                    <table class="gen-tech-table">
                      <thead>
                        <tr>
                          <th>模块</th>
                          <th>能源</th>
                          <th>规则类型</th>
                          <th class="col-rows">规则数量</th>
                            <th class="col-rows">测点数量</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(d, di) in sortedDetails" :key="di">
                          <td><span class="tech-cell module-cell">{{ d.module }}</span></td>
                          <td><span class="tech-cell">{{ d.energy }}</span></td>
                          <td><span class="tech-cell type-cell" :class="`type-${d.type}`">{{ typeLabels[d.type] || d.type }}</span></td>
                          <td class="col-rows"><span class="rows-num">{{ d.rules }}</span></td>
                            <td class="col-rows"><span class="rows-num rows-secondary">{{ d.rows }}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </template>

                <!-- 导出文件 -->
                <template v-if="step.key === 'export'">
                  <div class="export-section">
                    <div class="split-section-title">整体下载（完整单文件 · 不分片）</div>
                    <div class="export-grid">
                      <div
                        v-for="t in exportTypes"
                        :key="t.key"
                        class="export-box"
                        :class="[`box-${t.key}`, { 'export-loading': exportLoading === t.key }]"
                        @click="downloadSingle(t.key)"
                      >
                        <div class="box-icon"><span v-if="exportLoading === t.key" class="export-spinner"></span><span v-else>{{ t.icon }}</span></div>
                        <div class="box-label">{{ t.label }}</div>
                        <div class="box-desc">完整单文件 · 不分片</div>
                      </div>
                      <div class="export-box box-all" :class="{ 'export-loading': exportAllLoading }" @click="downloadAll">
                        <div class="box-icon"><span v-if="exportAllLoading" class="export-spinner"></span><span v-else>📦</span></div>
                        <div class="box-label">打包下载全部</div>
                        <div class="box-desc">4 个完整规则文件</div>
                      </div>
                    </div>
                  </div>
                  <!-- 分批导出 -->
                  <div class="export-split-section">
                    <div class="split-section-title">分批下载（分批多文件 · 每个不超过3M）</div>
                    <div class="export-grid">
                      <div
                        v-for="t in splitExportTypes"
                        :key="'split-' + t.key"
                        class="export-box"
                        :class="[`box-${t.key}`, { 'export-loading': splitLoading === t.key }]"
                        @click="downloadSplit(t.key)"
                      >
                        <div class="box-icon"><span v-if="splitLoading === t.key" class="export-spinner"></span><span v-else>{{ t.icon }}</span></div>
                        <div class="box-label">{{ t.label }}</div>
                        <div class="box-desc">分批 ZIP · 按合并边界拆分</div>
                      </div>
                      <div class="export-box box-all" :class="{ 'export-loading': splitAllLoading }" @click="downloadSplitAll">
                        <div class="box-icon"><span v-if="splitAllLoading" class="export-spinner"></span><span v-else>📦</span></div>
                        <div class="box-label">分批打包全部</div>
                        <div class="box-desc">4 种规则分批文件</div>
                      </div>
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
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getTenant, getOverview,
  importStation as apiImportStation,
  importMeasure as apiImportMeasure,
  generateRules as apiGenerateRules,
  downloadOverallExcel, downloadSplitZip, downloadAllSplitZip, downloadAllOverallZip, saveBlobAsFile,
  clearAllData, getImportProgress,
  getGenerateProgress,
} from '@/services/time-series-rules';

const currentSchema = ref('');
const overview = ref<Record<string, number> | null>(null);

const clearing = ref(false);
const typeLabels: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };
const exportTypes = [
  { key: 'sz', label: '死值', icon: '⏳' },
  { key: 'tb', label: '跳变', icon: '⚡' },
  { key: 'yx', label: '越限', icon: '🌡️' },
  { key: 'zd', label: '中断', icon: '🔌' },
];

const steps = reactive([
  { key: 'import-station', title: '导入场站数据', desc: '上传组织机构编码，导入场站基础信息', status: 'pending' },
  { key: 'import-measure', title: '导入测点数据', desc: '上传时序测点编码，导入测点标准化信息', status: 'pending' },
  { key: 'generate', title: '生成稽核规则', desc: '基于场站和测点数据自动生成质量稽核规则', status: 'pending' },
  { key: 'export', title: '导出规则文件', desc: '导出生成的稽核规则文件', status: 'pending' },
]);

// ====== 导入场站 ======
const stationFile = ref<File | null>(null);
const stationLoading = ref(false);
const stationResult = ref<number | null>(parseInt(localStorage.getItem('tsr_station_result') || '', 10) || null);
const stationProgress = ref(0);
const stationUploadPercent = ref(0);
const stationTotal = ref(0);
const stationDone = ref(0);
const stationPollTimer = ref<ReturnType<typeof setInterval> | null>(null);
// ====== 导入测点 ======
const measureFile = ref<File | null>(null);
const measureLoading = ref(false);
const measureResult = ref<number | null>(parseInt(localStorage.getItem('tsr_measure_result') || '', 10) || null);
const measureProgress = ref(0);
const measureUploadPercent = ref(0);
const measureTotal = ref(0);
const measureDone = ref(0);
const measurePollTimer = ref<ReturnType<typeof setInterval> | null>(null);

// ====== 生成规则 ======
const genLoading = ref(false);
const genResult = ref<{ total: number; details: { module: string; energy: string; type: string; rows: number; rules: number }[] } | null>(null);
const genCreateTime = ref('');
const GEN_TIME_KEY = 'tsr_gen_create_time';
const GEN_RESULT_KEY = 'tsr_gen_result';
const GEN_DONE_STEPS_KEY = 'tsr_gen_done_steps';
const GEN_PROGRESS_KEY = 'tsr_gen_progress';
/** 第4步完成状态持久化 key */
const STEP4_STATUS_KEY = 'tsr_step4_status';
const STEP1_STATUS_KEY = 'tsr_step1_status';
const STEP2_STATUS_KEY = 'tsr_step2_status';
const genProgressPoll = ref<ReturnType<typeof setInterval> | null>(null);
const genProgress = ref<{ done: number; total: number; status: string }>({ done: 0, total: 0, status: 'idle' });
const genCurrentStep = ref<{ module: string; energy: string; ruleType: string; status: string; rows: number } | null>(null);
const genDoneSteps = ref<{ module: string; energy: string; ruleType: string; status: string; rows: number }[]>([]);
const ruleTypeLabels: Record<string, string> = { sz: '死值', tb: '跳变', yx: '越限', zd: '中断' };

const ruleSortKey: Record<string, number> = { sz: 0, tb: 1, yx: 2, zd: 3 };
const moduleSortKey: Record<string, number> = { '分级诊断': 0, '功率预测': 1 };
const energySortKey: Record<string, number> = { '风电': 0, '光伏': 1 };

const sortedDetails = computed(() => {
  if (!genResult.value) return [];
  return [...genResult.value.details].sort((a, b) => {
    const rt = (ruleSortKey[a.type] ?? 99) - (ruleSortKey[b.type] ?? 99);
    if (rt !== 0) return rt;
    const mk = (moduleSortKey[a.module] ?? 99) - (moduleSortKey[b.module] ?? 99);
    if (mk !== 0) return mk;
    return (energySortKey[a.energy] ?? 99) - (energySortKey[b.energy] ?? 99);
  });
});

const totalRules = computed(() => {
  if (!genResult.value) return 0;
  return genResult.value.details.reduce((sum, d) => sum + (d.rules || 0), 0);
});

// ====== 导出 ======
const exportLoading = ref<string>('');
const exportAllLoading = ref(false);
const splitLoading = ref<string>('');
const splitAllLoading = ref(false);
const exportBusy = computed(() => exportLoading.value !== '' || exportAllLoading.value || splitLoading.value !== '' || splitAllLoading.value);

const splitExportTypes = [
  { key: 'sz', label: '死值', icon: '⏳' },
  { key: 'tb', label: '跳变', icon: '⚡' },
  { key: 'yx', label: '越限', icon: '🌡️' },
  { key: 'zd', label: '中断', icon: '🔌' },
];

function saveGenResult(result: typeof genResult.value) {
  genResult.value = result;
  const now = new Date();
  genCreateTime.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  localStorage.setItem(GEN_TIME_KEY, genCreateTime.value);
  // 同时持久化步骤明细和进度，刷新后仍显示
  localStorage.setItem(GEN_DONE_STEPS_KEY, JSON.stringify(genDoneSteps.value));
  localStorage.setItem(GEN_PROGRESS_KEY, JSON.stringify(genProgress.value));
  localStorage.setItem(STEP4_STATUS_KEY, steps[3].status);
  if (result) {
    localStorage.setItem(GEN_RESULT_KEY, JSON.stringify(result));
  }
}

/** 是否有导入任务正在进行中 */
const importOngoing = computed(() =>
  stationLoading.value || measureLoading.value ||
  steps[0].status === 'running' || steps[1].status === 'running'
);

function triggerUpload(type: string) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.xlsx,.xls';
  input.onchange = (e: any) => {
    const file = e.target?.files?.[0] as File | undefined;
    if (!file) return;
    if (type === 'station') stationFile.value = file;
    else if (type === 'measure') measureFile.value = file;
  };
  input.click();
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
}

async function importStation() {
  if (!stationFile.value || importOngoing.value) return;
  const uploadStart = Date.now();
  const MIN_UPLOAD_MS = 2000;
  const MIN_IMPORT_MS = 2000;
  stationLoading.value = true;
  stationProgress.value = 0;
  stationUploadPercent.value = 0;
  stationResult.value = null;
  steps[0].status = 'running';

  const promise = apiImportStation(stationFile.value!, (p) => {
    stationUploadPercent.value = p;
  });

  const pollTimer = setInterval(async () => {
    try {
      const p = await getImportProgress('station');
      if (p.total > 0) {
        stationTotal.value = p.total;
        stationDone.value = p.done;
        stationProgress.value = Math.round((p.done / p.total) * 100);
        stationUploadPercent.value = 100;
      }
    } catch { /* ignore poll errors */ }
  }, 500);
  stationPollTimer.value = pollTimer;

  try {
    const res = await promise;

    // 阶段1: 保证上传进度至少展示 MIN_UPLOAD_MS（从开始算起），不覆盖轮询数据
    const elapsed = Date.now() - uploadStart;
    if (elapsed < MIN_UPLOAD_MS) {
      await new Promise(r => setTimeout(r, MIN_UPLOAD_MS - elapsed));
    }

    // 阶段2: 停止轮询，上传栏固定100%，导入栏停留在当前轮询值
    clearInterval(pollTimer);
    stationPollTimer.value = null;
    stationUploadPercent.value = 100;

    // 导入栏最少展示 MIN_IMPORT_MS 再跳100%
    await new Promise(r => setTimeout(r, MIN_IMPORT_MS));

    stationProgress.value = 100;
    stationResult.value = res.importedCount;
    steps[0].status = 'completed';
    localStorage.setItem(STEP1_STATUS_KEY, 'completed');
    localStorage.setItem('tsr_station_result', String(res.importedCount));
    ElMessage.success(`导入 ${res.importedCount} 条场站数据成功`);
    refreshOverview();
  } catch (err: any) {
    clearInterval(pollTimer);
    stationPollTimer.value = null;
    steps[0].status = 'error';
    stationProgress.value = 0;
    ElMessage.error(err.message || '导入失败');
    localStorage.setItem(STEP1_STATUS_KEY, steps[0].status);
  } finally {
    stationLoading.value = false;
    stationProgress.value = 0;
    stationUploadPercent.value = 0;
  }
}

async function importMeasure() {
  if (!measureFile.value || importOngoing.value) return;
  const uploadStart = Date.now();
  const MIN_UPLOAD_MS = 2000;
  const MIN_IMPORT_MS = 2000;
  measureLoading.value = true;
  measureProgress.value = 0;
  measureUploadPercent.value = 0;
  measureTotal.value = 0;
  measureDone.value = 0;
  measureResult.value = null;
  steps[1].status = 'running';

  const promise = apiImportMeasure(measureFile.value!, (p) => {
    measureUploadPercent.value = p;
  });

  const pollTimer = setInterval(async () => {
    try {
      const p = await getImportProgress('measure');
      if (p.total > 0) {
        measureTotal.value = p.total;
        measureDone.value = p.done;
        measureProgress.value = Math.round((p.done / p.total) * 100);
        measureUploadPercent.value = 100;
      }
    } catch { /* ignore poll errors */ }
  }, 500);
  measurePollTimer.value = pollTimer;

  try {
    const res = await promise;

    // 阶段1: 保证上传进度至少展示 MIN_UPLOAD_MS
    const elapsed = Date.now() - uploadStart;
    if (elapsed < MIN_UPLOAD_MS) {
      await new Promise(r => setTimeout(r, MIN_UPLOAD_MS - elapsed));
    }

    // 阶段2: 停止轮询，上传栏固定100%，导入栏停留在当前轮询值
    clearInterval(pollTimer);
    measurePollTimer.value = null;
    measureUploadPercent.value = 100;

    // 导入栏最少展示 MIN_IMPORT_MS 再跳100%
    await new Promise(r => setTimeout(r, MIN_IMPORT_MS));

    measureProgress.value = 100;
    measureResult.value = res.importedCount;
    steps[1].status = 'completed';
    localStorage.setItem(STEP2_STATUS_KEY, 'completed');
    localStorage.setItem('tsr_measure_result', String(res.importedCount));
    ElMessage.success(`导入 ${res.importedCount} 条测点数据成功`);
    refreshOverview();
  } catch (err: any) {
    clearInterval(pollTimer);
    measurePollTimer.value = null;
    steps[1].status = 'error';
    measureProgress.value = 0;
    ElMessage.error(err.message || '导入失败');
    localStorage.setItem(STEP2_STATUS_KEY, steps[1].status);
  } finally {
    measureLoading.value = false;
    measureProgress.value = 0;
    measureUploadPercent.value = 0;
  }
}

async function startGenerate() {
  // 检查场站和测点数据是否已导入
  if (!overview.value) {
    await refreshOverview();
  }
  const stationCount = overview.value?.station ?? 0;
  const measureCount = overview.value?.measure ?? 0;
  if (stationCount === 0 && measureCount === 0) {
    ElMessage.warning('请先导入场站数据和测点数据，再生成稽核规则');
    return;
  }
  if (stationCount === 0) {
    ElMessage.warning('请先导入场站数据，再生成稽核规则');
    return;
  }
  if (measureCount === 0) {
    ElMessage.warning('请先导入测点数据，再生成稽核规则');
    return;
  }

  genLoading.value = true;
  genResult.value = null;
  genProgress.value = { done: 0, total: 0, status: 'processing' };
  genCurrentStep.value = null;
  genDoneSteps.value = [];
  steps[2].status = 'running';

  // 启动进度轮询（仅更新显示，不干预完成流程）
  const pollTimer = setInterval(async () => {
    try {
      const p = await getGenerateProgress();
      genProgress.value = { done: p.done, total: p.total, status: p.status };
      genCurrentStep.value = p.currentStep || null;
      genDoneSteps.value = p.doneSteps || [];
    } catch { /* ignore poll errors */ }
  }, 1000);
  genProgressPoll.value = pollTimer;

  try {
    const res = await apiGenerateRules();
    clearInterval(pollTimer);
    genProgressPoll.value = null;
    // 用 API 返回的 details 填充步骤明细
    genDoneSteps.value = res.details.map((d: any) => ({
      module: d.module,
      energy: d.energy,
      ruleType: d.type,
      status: d.rows > 0 ? 'completed' : 'error',
      rows: d.rows,
    }));
    genProgress.value = { done: res.details.length, total: res.details.length, status: 'completed' };
    genCurrentStep.value = null;
    steps[2].status = 'completed';
    steps[3].status = 'completed';
    saveGenResult(res);
    ElMessage.success(`生成完成，共 ${res.total} 条规则`);
  } catch (err: any) {
    clearInterval(pollTimer);
    genProgressPoll.value = null;
    steps[2].status = 'error';
    ElMessage.error(err.message || '生成失败');
  } finally {
    genLoading.value = false;
    genCurrentStep.value = null;
  }
}

async function downloadSingle(type: string) {
  if (exportBusy.value) return;
  exportLoading.value = type;
  const label = typeLabels[type] || type;
  try {
    const blob = await downloadOverallExcel(type);
    saveBlobAsFile(blob, `${currentSchema.value}_时序稽核质量规则_${label}.xlsx`);
    steps[3].status = 'completed';
    ElMessage.success(`已下载 ${label} 规则文件`);
  } catch (err: any) {
    ElMessage.error(err.message || '下载失败');
  } finally {
    exportLoading.value = '';
  }
}

async function downloadAll() {
  if (exportBusy.value) return;
  exportAllLoading.value = true;
  try {
    const blob = await downloadAllOverallZip();
    saveBlobAsFile(blob, '时序规则结果_总体.zip');
    steps[3].status = 'completed';
    ElMessage.success('已下载 时序规则结果_总体.zip');
  } catch (err: any) {
    ElMessage.error(err.message || '批量下载失败');
  } finally {
    exportAllLoading.value = false;
  }
}

async function downloadSplit(type: string) {
  if (exportBusy.value) return;
  splitLoading.value = type;
  const label = typeLabels[type] || type;
  try {
    const blob = await downloadSplitZip(type);
    saveBlobAsFile(blob, `${currentSchema.value}_时序稽核质量规则_${label}_分批.zip`);
    steps[3].status = 'completed';
    ElMessage.success(`已下载 ${label} 分批文件`);
  } catch (err: any) {
    ElMessage.error(err.message || '分批下载失败');
  } finally {
    splitLoading.value = '';
  }
}

async function downloadSplitAll() {
  if (exportBusy.value) return;
  splitAllLoading.value = true;
  try {
    const blob = await downloadAllSplitZip();
    saveBlobAsFile(blob, '时序规则结果_分批.zip');
    steps[3].status = 'completed';
    ElMessage.success('已下载 时序规则结果_分批.zip');
  } catch (err: any) {
    ElMessage.error(err.message || '分批批量下载失败');
  } finally {
    splitAllLoading.value = false;
  }
}

async function refreshOverview() {
  try {
    overview.value = await getOverview();
  } catch {
    // ignore
  }
}

async function handleClear() {
  clearing.value = true;
  try {
    await clearAllData();
    ElMessage.success('已清空所有数据');
    // 停止任何进行中的轮询
    if (stationPollTimer.value) { clearInterval(stationPollTimer.value); stationPollTimer.value = null; }
    if (measurePollTimer.value) { clearInterval(measurePollTimer.value); measurePollTimer.value = null; }
    // 重置步骤状态
    steps.forEach(s => { s.status = 'pending'; });
    stationResult.value = null;
    stationProgress.value = 0;
    measureResult.value = null;
    measureProgress.value = 0;
    genResult.value = null;
    genCreateTime.value = '';
    genProgress.value = { done: 0, total: 0, status: 'idle' };
    genCurrentStep.value = null;
    genDoneSteps.value = [];
    if (genProgressPoll.value) { clearInterval(genProgressPoll.value); genProgressPoll.value = null; }
    localStorage.removeItem(GEN_RESULT_KEY);
    localStorage.removeItem(GEN_TIME_KEY);
    localStorage.removeItem(GEN_DONE_STEPS_KEY);
    localStorage.removeItem(GEN_PROGRESS_KEY);
    localStorage.removeItem(STEP4_STATUS_KEY);
    localStorage.removeItem(STEP1_STATUS_KEY);
    localStorage.removeItem(STEP2_STATUS_KEY);
    localStorage.removeItem('tsr_station_result');
    localStorage.removeItem('tsr_measure_result');
    await refreshOverview();
  } catch (err: any) {
    ElMessage.error(err.message || '清空失败');
  } finally {
    clearing.value = false;
  }
}

/** 检查是否有后台仍在进行的生成任务，恢复进度显示 */
async function checkOngoingGenerate() {
  try {
    const p = await getGenerateProgress();
    if (p.status === 'processing' && p.total > 0) {
      genLoading.value = true;
      genProgress.value = { done: p.done, total: p.total, status: p.status };
      genCurrentStep.value = p.currentStep || null;
      genDoneSteps.value = p.doneSteps || [];
      steps[2].status = 'running';

      const pollTimer = setInterval(async () => {
        try {
          const p2 = await getGenerateProgress();
          genProgress.value = { done: p2.done, total: p2.total, status: p2.status };
          genCurrentStep.value = p2.currentStep || null;
          genDoneSteps.value = p2.doneSteps || [];

          if (p2.status === 'completed') {
            clearInterval(pollTimer);
            genProgressPoll.value = null;
            genCurrentStep.value = null;
            genLoading.value = false;
            steps[2].status = 'completed';
            ElMessage.success('规则生成已完成');
          }
        } catch {
          clearInterval(pollTimer);
          genProgressPoll.value = null;
        }
      }, 1000);
      genProgressPoll.value = pollTimer;
    } else if (p.status === 'completed' && p.total > 0) {
      if (overview.value) {
        const total = (overview.value.sz || 0) + (overview.value.tb || 0) + (overview.value.yx || 0) + (overview.value.zd || 0);
        if (total > 0) {
          steps[2].status = 'completed';
        }
      }
    }
  } catch {
    // 进度接口不可用时忽略
  }

  // 无论后端进度接口是否可用，都从 localStorage 恢复已完成的生成结果
  restoreGenResult();
}

/** 从 localStorage 恢复已完成的生成结果和进度明细 */
function restoreGenResult() {
  const saved = localStorage.getItem(GEN_RESULT_KEY);
  const savedTime = localStorage.getItem(GEN_TIME_KEY);
  if (saved && savedTime && !genResult.value) {
    try {
      genResult.value = JSON.parse(saved);
      genCreateTime.value = savedTime;
      steps[2].status = 'completed';
    } catch { /* ignore corrupt data */ }
  }

  // 恢复步骤明细列表
  const savedSteps = localStorage.getItem(GEN_DONE_STEPS_KEY);
  if (savedSteps && genDoneSteps.value.length === 0) {
    try {
      genDoneSteps.value = JSON.parse(savedSteps);
    } catch { /* ignore corrupt data */ }
  }

  // 恢复第4步完成状态
  const step4Status = localStorage.getItem(STEP4_STATUS_KEY);
  if (step4Status === 'completed') {
    steps[3].status = 'completed';
  }

  // 恢复进度状态
  const savedProgress = localStorage.getItem(GEN_PROGRESS_KEY);
  if (savedProgress) {
    try {
      const p = JSON.parse(savedProgress);
      if (p.status === 'completed' && p.total > 0) {
        genProgress.value = p;
      }
    } catch { /* ignore corrupt data */ }
  }

  // 兜底：没有 localStorage 但数据库已有生成结果时，从 overview 构建展示
  if (!genResult.value && overview.value) {
    const ruleTotal = (overview.value.sz || 0) + (overview.value.tb || 0) + (overview.value.yx || 0) + (overview.value.zd || 0);
    if (ruleTotal > 0) {
      steps[2].status = 'completed';
      genResult.value = {
        total: ruleTotal,
        details: [
          { module: '-', energy: '-', type: 'sz', rows: overview.value.sz || 0, rules: overview.value.sz_rules || 0 },
          { module: '-', energy: '-', type: 'tb', rows: overview.value.tb || 0, rules: overview.value.tb_rules || 0 },
          { module: '-', energy: '-', type: 'yx', rows: overview.value.yx || 0, rules: overview.value.yx_rules || 0 },
          { module: '-', energy: '-', type: 'zd', rows: overview.value.zd || 0, rules: overview.value.zd_rules || 0 },
        ],
      };
      genDoneSteps.value = ['sz', 'tb', 'yx', 'zd'].filter(t => (overview.value as any)[t] > 0).map(t => ({
        module: '-', energy: '-', ruleType: t, status: 'completed' as const, rows: (overview.value as any)[t] || 0,
      }));
    }
  }
}

/** 检查是否有后台仍在进行的导入任务，恢复进度追踪 */
async function checkOngoingImport(type: 'station' | 'measure') {
  try {
    const p = await getImportProgress(type);
    if (p.status === 'processing' && p.total > 0) {
      // 后台仍在导入中，恢复进度显示和轮询
      const updateProgress = (total: number, done: number) => {
        if (type === 'station') {
          stationTotal.value = total;
          stationDone.value = done;
          stationProgress.value = Math.min(30 + Math.round((done / total) * 65), 95);
        } else {
          measureTotal.value = total;
          measureDone.value = done;
          measureProgress.value = Math.min(30 + Math.round((done / total) * 65), 95);
        }
      };

      updateProgress(p.total, p.done);
      // 步骤标记为运行中
      if (type === 'station') steps[0].status = 'running';
      else steps[1].status = 'running';

      const pollTimer = setInterval(async () => {
        try {
          const p2 = await getImportProgress(type);
          if (p2.status === 'completed') {
            clearInterval(pollTimer);
            if (type === 'station') {
              stationPollTimer.value = null;
              stationProgress.value = 100;
              stationResult.value = p2.total;
              steps[0].status = 'completed';
              ElMessage.success(`导入 ${p2.total} 条场站数据成功`);
            } else {
              measurePollTimer.value = null;
              measureProgress.value = 100;
              measureResult.value = p2.total;
              steps[1].status = 'completed';
              ElMessage.success(`导入 ${p2.total} 条测点数据成功`);
            }
            refreshOverview();
          } else if (p2.status === 'processing' && p2.total > 0) {
            updateProgress(p2.total, p2.done);
          }
        } catch {
          clearInterval(pollTimer);
        }
      }, 500);
      if (type === 'station') stationPollTimer.value = pollTimer;
      else measurePollTimer.value = pollTimer;
    } else if (p.status === 'completed' && p.total > 0) {
      // 导入已全部完成
      if (type === 'station') {
        stationResult.value = p.total;
        steps[0].status = 'completed';
      } else {
        measureResult.value = p.total;
        steps[1].status = 'completed';
      }
    } else if (overview.value && overview.value[type] > 0) {
      // 没有进度记录，但数据库中有数据（之前完成的导入）
      if (type === 'station') {
        stationResult.value = overview.value.station;
        steps[0].status = 'completed';
      } else {
        measureResult.value = overview.value.measure;
        steps[1].status = 'completed';
      }
    }
  } catch {
    // 进度接口异常时回退到基于 overview 的判断
    if (overview.value && overview.value[type] > 0) {
      if (type === 'station') {
        stationResult.value = overview.value.station;
        steps[0].status = 'completed';
      } else {
        measureResult.value = overview.value.measure;
        steps[1].status = 'completed';
      }
    }
  }
}

onMounted(async () => {
  // 优先从 localStorage 恢复状态，避免 API 延迟导致闪白
  if (localStorage.getItem(STEP1_STATUS_KEY) === 'completed') {
    steps[0].status = 'completed';
    const v = localStorage.getItem('tsr_station_result');
    if (v) stationResult.value = parseInt(v, 10);
  }
  if (localStorage.getItem(STEP2_STATUS_KEY) === 'completed') {
    steps[1].status = 'completed';
    const v = localStorage.getItem('tsr_measure_result');
    if (v) measureResult.value = parseInt(v, 10);
  }
  restoreGenResult();

  try {
    const tenant = await getTenant();
    currentSchema.value = tenant || '未知';
  } catch {
    currentSchema.value = '未知';
  }
  await refreshOverview();
  // 检查是否有正在进行的后台导入任务
  checkOngoingImport('station');
  checkOngoingImport('measure');
  // 检查是否有正在进行的后台生成任务
  checkOngoingGenerate();
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
  padding: 36px 20px 28px;
  overflow: hidden;
}

.pipeline-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.pipeline-glow {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 240px;
  background: radial-gradient(ellipse, rgba(56, 189, 248, 0.1) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%);
  pointer-events: none;
}

.pipeline-title {
  font-size: 28px;
  font-weight: 700;
  font-family: 'Ma Shan Zheng', 'STXingkai', 'KaiTi', serif;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
  letter-spacing: 4px;
  position: relative;
}

.pipeline-desc {
  font-size: 14px;
  color: #6b7a8f;
  margin: 0;
  position: relative;
}

/* ==================== 区域选择栏 ==================== */
.region-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 28px;
  margin: 0 0 28px;
  background: linear-gradient(135deg, #e8f4fd 0%, #eef2ff 100%);
  border-radius: 16px;
  border: 1px solid rgba(59,130,246,0.12);
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
  position: relative;
  overflow: hidden;
}

/* 网格背景 */
.region-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
}

/* 租户区状态指示灯 */
.tenant-display::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -14px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.7);
  animation: dot-pulse 2s ease-in-out infinite;
}

@keyframes dot-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(34, 197, 94, 0.6); }
  50% { opacity: 0.5; box-shadow: 0 0 12px rgba(34, 197, 94, 0.3); }
}

.region-label {
  font-size: 10px;
  font-weight: 500;
  color: rgba(30, 64, 175, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
  line-height: 1.2;
}

.tenant-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
  line-height: 1.3;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tenant-display {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

/* 租户图标外框 */
.tenant-display .tenant-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  box-shadow: 0 4px 12px rgba(59,130,246,0.25);
  position: relative;
}

.tenant-display .tenant-icon::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), transparent, rgba(99, 102, 241, 0.2));
  z-index: -1;
}

.tenant-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.region-select { width: 130px; }

.region-stats {
  display: flex;
  gap: 12px;
  margin-left: auto;
  margin-right: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(59,130,246,0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(59,130,246,0.2);
  box-shadow: 0 4px 16px rgba(59,130,246,0.1);
  transform: translateY(-1px);
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.stat-icon-station {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: #fff;
  border: none;
  box-shadow: 0 4px 10px rgba(59,130,246,0.2);
}

.stat-icon-measure {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  color: #fff;
  border: none;
  box-shadow: 0 4px 10px rgba(139,92,246,0.2);
}

.stat-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.stat-num {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(30, 64, 175, 0.5);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.clear-btn {
  margin-left: auto;
  font-size: 15px;
  font-weight: 700;
  padding: 12px 32px !important;
  border-radius: 10px !important;
  color: #fff !important;
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: none !important;
  letter-spacing: 2px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
}

.clear-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.clear-btn:hover::before {
  transform: translateX(100%);
}

.clear-btn:hover {
  background: linear-gradient(135deg, #f87171, #ef4444) !important;
  border-color: transparent !important;
  box-shadow: 0 6px 25px rgba(239, 68, 68, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.05) !important;
  transform: translateY(-2px);
}

.clear-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3) !important;
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
  padding: 24px 0;
  position: relative;
  z-index: 1;
}

/* 端点圆点 */
.connector-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d0d5dd;
  transition: all 0.5s;
  flex-shrink: 0;
}
.connector-dot.top { margin-bottom: 2px; }
.connector-dot.bottom { margin-top: 2px; }

.step-connector.active .connector-dot {
  background: #38bdf8;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
}

/* 圆管轨道 */
.connector-line {
  width: 10px;
  height: 24px;
  border-radius: 5px;
  background: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.5s;
  position: relative;
  overflow: hidden;
}

.step-connector.active .connector-line {
  background: rgba(56, 189, 248, 0.08);
}

/* 轨道内填充线 */
.connector-fill {
  width: 3px;
  height: 100%;
  border-radius: 2px;
  background: #d0d5dd;
  transition: all 0.5s;
}

.step-connector.active .connector-fill {
  background: linear-gradient(to bottom, #38bdf8, #818cf8);
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.6);
  animation: flow-pulse 2s ease-in-out infinite;
}

@keyframes flow-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 箭头 */
.connector-arrow {
  margin-top: 3px;
  width: 20px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.connector-arrow svg {
  width: 20px;
  height: 12px;
  display: block;
}

.connector-arrow svg polygon {
  fill: #c8d0d8;
  transition: all 0.4s;
}

.step-connector.active .connector-arrow svg polygon {
  fill: #818cf8;
  filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.5));
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

.step-partial {
  border-color: rgba(251, 191, 36, 0.3);
}
.step-partial .step-card-glow {
  background: linear-gradient(to bottom, #fbbf24, #f59e0b);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
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

.badge-partial {
  background: #fef3c7;
  color: #d97706;
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

.upload-zone.upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #d0d5dd;
  background: #f5f6f8;
}

.upload-zone.upload-disabled:hover {
  border-color: #d0d5dd;
  background: #f5f6f8;
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

/* ==================== 科技风进度条 ==================== */
/* 双进度条一行 */
.tech-progress-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.tech-progress-row .tech-progress {
  margin-top: 0;
}

.tech-progress-label {
  font-size: 11px;
  color: #7a9bb5;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tech-progress-uploading .tech-progress-label {
  color: #f59e0b;
}

.tech-progress-uploading.tech-progress-done .tech-progress-label {
  color: #10b981;
}



/* 上传完成标记 */
.tech-progress-done .tech-progress-fill {
  background: linear-gradient(90deg, #10b981, #059669, #10b981) !important;
  background-size: 200% 100% !important;
}

.tech-progress {
  margin-top: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #0f1a2e, #1a2744);
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.06), inset 0 1px 0 rgba(56, 189, 248, 0.08);
}

.tech-progress-track {
  height: 8px;
  background: #0d1520;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
}

.tech-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #3b82f6, #38bdf8);
  background-size: 200% 100%;
  border-radius: 4px;
  transition: width 0.35s ease;
  position: relative;
  animation: progressScan 2s linear infinite;
}

.tech-progress-glow {
  position: absolute;
  right: 0;
  top: -3px;
  width: 24px;
  height: 14px;
  background: rgba(56, 189, 248, 0.5);
  filter: blur(6px);
  border-radius: 50%;
}

/* 上传阶段颜色（橙色） */
.tech-progress-uploading .tech-progress-fill {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
  background-size: 200% 100%;
}

.tech-progress-uploading .tech-progress-glow {
  background: rgba(251, 191, 36, 0.5);
}

.tech-progress-uploading .tech-progress-text {
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

@keyframes progressScan {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.tech-progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.tech-progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
}

.tech-progress-count {
  flex: 1;
  font-size: 12px;
  color: #7a9bb5;
  margin-left: 10px;
  font-variant-numeric: tabular-nums;
}

.tech-stop-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  font-size: 12px;
  font-weight: 500;
  color: #f87171;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tech-stop-btn:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);
}

.tech-stop-btn:active {
  transform: scale(0.96);
}

.stop-icon {
  font-size: 10px;
}

/* 已停止状态 */
.tech-progress-partial {
  border-color: rgba(251, 191, 36, 0.3);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.06);
}

.tech-progress-partial .tech-progress-fill {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24);
  background-size: 200% 100%;
}

.tech-progress-partial .tech-progress-glow {
  background: rgba(251, 191, 36, 0.5);
}

.tech-progress-partial .tech-progress-text {
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
}

.tech-partial-label {
  font-size: 12px;
  font-weight: 500;
  color: #f59e0b;
  padding: 4px 12px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.25);
  border-radius: 6px;
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
  font-size: 18px;
  font-weight: 700;
  padding: 16px 48px !important;
  border-radius: 12px !important;
  letter-spacing: 2px;
  border: none !important;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4) !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
}

.gen-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.gen-btn:hover::before {
  transform: translateX(100%);
}

.gen-btn:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6) !important;
  box-shadow: 0 6px 30px rgba(59, 130, 246, 0.55) !important;
  transform: translateY(-2px) !important;
}

.gen-btn:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.3) !important;
}

.gen-btn-icon {
  margin-right: 10px;
  font-size: 20px;
}

.gen-hint {
  font-size: 13px;
  color: #9aa8b6;
  margin: 10px 0 0;
}

/* ==================== 生成进度面板 ==================== */
.gen-progress-panel {
  margin-top: 14px;
  padding: 16px;
  background: linear-gradient(135deg, #0f1a2e, #1a2744);
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.06);
}

.gen-progress-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.gen-progress-title {
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
}

.gen-progress-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.gen-status-processing {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.gen-status-completed {
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
}

.gen-progress-bar {
  height: 6px;
  background: #0d1520;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.gen-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #3b82f6);
  border-radius: 3px;
  transition: width 0.35s ease;
}

.gen-progress-count {
  font-size: 11px;
  color: #7a9bb5;
  margin-bottom: 10px;
  font-variant-numeric: tabular-nums;
}

.gen-step-running {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  margin-bottom: 8px;
  font-size: 12px;
  color: #93c5fd;
}

.gen-step-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(56, 189, 248, 0.3);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.gen-steps-done {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.gen-step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(15, 26, 46, 0.5);
}

.gen-step-completed {
  color: #6b8fa0;
}

.gen-step-error {
  color: #f87171;
  background: rgba(239, 68, 68, 0.06);
}

.gen-step-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.gen-step-completed .gen-step-icon {
  color: #34d399;
}

.gen-step-error .gen-step-icon {
  color: #f87171;
}

.gen-step-label {
  flex: 1;
}

.gen-step-rows {
  color: #7a9bb5;
  font-variant-numeric: tabular-nums;
}

/* ==================== 科技风结果表格 ==================== */
.gen-result-tech {
  margin-top: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #0d1520, #162033);
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.04), inset 0 1px 0 rgba(56, 189, 248, 0.06);
}

.gen-result-tech-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.gen-time-label {
  font-size: 11px;
  color: #64748b;
  white-space: nowrap;
  flex-shrink: 0;
}

.gen-result-tech-title {
  font-size: 14px;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.gen-result-tech-title em {
  font-style: normal;
  font-size: 22px;
  font-weight: 700;
  color: #38bdf8;
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.gen-tech-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.gen-tech-table thead th {
  text-align: left;
  padding: 7px 10px;
  color: #64748b;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.1);
}

.gen-tech-table tbody tr {
  transition: background 0.2s ease;
}

.gen-tech-table tbody tr:hover {
  background: rgba(56, 189, 248, 0.04);
}

.gen-tech-table td {
  padding: 6px 10px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.06);
  color: #94a3b8;
}

.gen-tech-table .col-rows {
  text-align: right;
  width: 80px;
}

.tech-cell {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.06);
  border: 1px solid rgba(56, 189, 248, 0.08);
  color: #cbd5e1;
  font-size: 12px;
}

.module-cell {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

.type-cell { font-weight: 500; }
.type-sz { color: #60a5fa; border-color: rgba(96, 165, 250, 0.2); background: rgba(96, 165, 250, 0.06); }
.type-tb { color: #f472b6; border-color: rgba(244, 114, 182, 0.2); background: rgba(244, 114, 182, 0.06); }
.type-yx { color: #fbbf24; border-color: rgba(251, 191, 36, 0.2); background: rgba(251, 191, 36, 0.06); }
.type-zd { color: #a78bfa; border-color: rgba(167, 139, 250, 0.2); background: rgba(167, 139, 250, 0.06); }

.rows-num {
  font-size: 14px;
  font-weight: 700;
  color: #38bdf8;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.2);
}

.rows-secondary {
  color: #a78bfa;
  text-shadow: 0 0 8px rgba(167, 139, 250, 0.2);
}

.title-rules {
  color: #a78bfa !important;
  text-shadow: 0 0 12px rgba(167, 139, 250, 0.3) !important;
}

/* ==================== 导出网格（5 框布局） ==================== */
.export-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.export-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 130px;
  height: 110px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  text-align: center;
  user-select: none;
}

.export-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}

.export-box:active {
  transform: scale(0.96);
}

.box-icon {
  font-size: 28px;
  line-height: 1;
  margin-bottom: 6px;
}

.box-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

.box-desc {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 3px;
}

.box-sz {
  background: linear-gradient(135deg, #e8f4fd, #d0e8ff);
  border-color: #3b82f6;
  color: #1e40af;
}

.box-tb {
  background: linear-gradient(135deg, #fce7f3, #fbcfe8);
  border-color: #ec4899;
  color: #9d174d;
}

.box-yx {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: #f59e0b;
  color: #92400e;
}

.box-zd {
  background: linear-gradient(135deg, #ede9fe, #ddd6fe);
  border-color: #8b5cf6;
  color: #5b21b6;
}

.box-all {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  border-color: #10b981;
  color: #065f46;
}

.export-loading {
  opacity: 0.7;
  cursor: wait;
  pointer-events: none;
}

.export-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: export-spin 0.7s linear infinite;
}

@keyframes export-spin {
  to { transform: rotate(360deg); }
}

/* ==================== 导出分区 ==================== */
.export-section {
  margin-bottom: 16px;
}

.export-split-section {
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.split-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #6b7a8f;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

</style>
