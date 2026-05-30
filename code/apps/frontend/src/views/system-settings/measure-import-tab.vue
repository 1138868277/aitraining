<template>
  <div class="measure-import-tab">
    <!-- 步骤卡片区：上传 + 下载模板 -->
    <div class="step-cards">
      <div class="step-card upload-card" :class="{ 'has-file': selectedFileName, 'importing': importing, 'done': imported && !importing }" @dragover.prevent @drop.prevent="onDrop">
        <div class="card-bg-glow"></div>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" style="display:none" @change="handleFile" />
        <template v-if="!selectedFileName && !importing">
          <div class="card-click-area" @click="triggerFileInput">
            <div class="card-icon-wrap upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div class="card-title">上传测点文件</div>
            <div class="card-desc">拖拽 Excel 文件到此处，或点击选择文件</div>
            <div class="card-tip">支持 .xlsx / .xls 格式</div>
          </div>
        </template>
        <template v-else-if="importing">
          <div class="card-progress-area">
            <div class="card-icon-wrap progress-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="card-title importing-title">正在导入</div>
            <div class="card-progress-bar">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: importProgress + '%' }"></div>
              </div>
              <span class="progress-text">{{ importProgress }}%</span>
            </div>
            <div class="card-file-name">{{ selectedFileName }}</div>
            <div class="card-import-info">
              <span v-if="importStatus.message" class="import-status-text" :class="importStatus.status.toLowerCase()">{{ importStatus.message }}</span>
              <span v-if="importStatus.startTime" class="import-remain">预计剩余 {{ estimatedRemain }}</span>
            </div>
            <button class="cancel-btn" @click="onCancelImport">终止导入</button>
          </div>
        </template>
        <template v-else-if="imported && !importing">
          <div class="card-click-area" @click="triggerFileInput">
            <div class="card-icon-wrap done-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="card-title done-title">已导入：{{ selectedFileName }}</div>
            <div class="card-desc">点击重新选择文件</div>
          </div>
        </template>
        <template v-else>
          <div class="card-click-area" @click="triggerFileInput">
            <div class="card-icon-wrap file-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="card-title">{{ selectedFileName }}</div>
            <div class="card-desc">点击重新选择文件</div>
          </div>
        </template>
      </div>
      <div class="step-card template-card" @click="downloadTemplate">
        <div class="card-bg-glow"></div>
        <div class="card-icon-wrap template-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        </div>
        <div class="card-title">下载导入模板</div>
        <div class="card-desc">按模板格式填写测点数据后导入</div>
        <div class="card-tip">.xlsx 格式，含标准列头</div>
      </div>
    </div>

    <!-- 导入统计 -->
    <div class="tech-metrics">
      <div class="tech-metric-card">
        <div class="tmc-icon" style="color:#3b82f6;background:rgba(59,130,246,0.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="tmc-body">
          <div class="tmc-value" style="color:#3b82f6">{{ importStatus.totalRows || lastImport.count || 0 }}</div>
          <div class="tmc-label">总测点数量</div>
        </div>
        <div class="tmc-glow" style="background:#3b82f6"></div>
      </div>
      <div class="tech-metric-card">
        <div class="tmc-icon" :style="statusIconStyle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div class="tmc-body">
          <div class="tmc-value" :style="statusTextStyle">{{ statusText }}</div>
          <div class="tmc-label">状态</div>
        </div>
        <div class="tmc-glow" :style="statusGlowStyle"></div>
      </div>
      <div class="tech-metric-card">
        <div class="tmc-icon" style="color:#06b6d4;background:rgba(6,182,212,0.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="tmc-body">
          <div class="tmc-value" style="color:#06b6d4">{{ importStatus.validRows || importStatus.importedRows || lastImport.count || 0 }}</div>
          <div class="tmc-label">已导入测点数量</div>
        </div>
        <div class="tmc-glow" style="background:#06b6d4"></div>
      </div>
      <div class="tech-metric-card">
        <div class="tmc-icon" style="color:#8b5cf6;background:rgba(139,92,246,0.1)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="tmc-body">
          <div class="tmc-value" style="color:#8b5cf6">{{ statsDuration }}</div>
          <div class="tmc-label">用时</div>
        </div>
        <div class="tmc-glow" style="background:#8b5cf6"></div>
      </div>
    </div>

    <!-- 导入提示 -->
    <div class="upload-limit-hint">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>导入测点数据后可在 <strong>编码看板 &gt; 编码测点分析</strong> 中查看分布图表</span>
    </div>

    <!-- 加载中 -->
    <div v-if="loading && !importing" class="loading-wrap">
      <div class="loading-spinner"></div>
      <p class="loading-text">数据加载中...</p>
    </div>

    <!-- 导入情况 -->
    <div class="import-history" v-if="lastImport.time">
      <div class="history-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>最近导入情况</span>
      </div>
      <div class="history-body">
        <div class="history-item">
          <span class="history-item-label">导入时间</span>
          <span class="history-item-value">{{ lastImport.time }}</span>
        </div>
        <div class="history-divider"></div>
        <div class="history-item">
          <span class="history-item-label">导入测点数</span>
          <span class="history-item-value highlight">{{ lastImport.count }}</span>
        </div>
        <div class="history-divider"></div>
        <div class="history-item">
          <span class="history-item-label">用时</span>
          <span class="history-item-value">{{ lastImport.duration }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import * as statsService from '@/services/statistics';

const loading = ref(true);
const importing = ref(false);
const imported = ref(false);
const importStatus = ref<{ importing: boolean; batchId: string | null; totalRows: number; importedRows: number; validRows: number; status: string; message?: string; startTime?: string }>({ importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' });
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref('');
const lastImport = ref({ time: '', count: 0, duration: '' });

function formatDuration(startTime: string): string {
  const sec = Math.round((Date.now() - new Date(startTime).getTime()) / 1000);
  if (sec < 60) return `${sec}秒`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}分${s}秒`;
}

function formatDateTime(t: string) {
  const d = new Date(t);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFileInner(file);
}

const importProgress = computed(() => {
  if (importStatus.value.totalRows === 0) return 0;
  return Math.round((importStatus.value.importedRows / importStatus.value.totalRows) * 100);
});

const estimatedRemain = computed(() => {
  const s = importStatus.value;
  if (!s.startTime || s.totalRows === 0 || s.importedRows === 0) return '--';
  const elapsed = (Date.now() - new Date(s.startTime).getTime()) / 1000;
  const progress = s.importedRows / s.totalRows;
  if (progress <= 0) return '--';
  const remainSec = Math.round(elapsed / progress * (1 - progress));
  if (remainSec < 60) return `${remainSec}秒`;
  const min = Math.floor(remainSec / 60);
  const sec = remainSec % 60;
  return `${min}分${sec}秒`;
});

const statusText = computed(() => {
  const st = importStatus.value.status;
  if (importing.value) return '导入中';
  if (st === 'COMPLETED') return '导入成功';
  if (st === 'FAILED') return '导入失败';
  if (st === 'CANCELLED') return '已终止';
  return '--';
});

const statusClass = computed(() => {
  const st = importStatus.value.status;
  if (importing.value || st === 'PROCESSING') return 'status-processing';
  if (st === 'COMPLETED') return 'status-completed';
  if (st === 'FAILED') return 'status-failed';
  if (st === 'CANCELLED') return 'status-cancelled';
  return '';
});

const statsDuration = computed(() => {
  const s = importStatus.value;
  if (s.startTime) return formatDuration(s.startTime);
  return lastImport.value.duration || '--';
});

const STORAGE_KEY = 'measure_import_stats';

const showStats = computed(() => importStatus.value.totalRows > 0 || lastImport.value.time);

const statusIconStyle = computed(() => {
  const st = importStatus.value.status;
  if (importing.value || st === 'PROCESSING') return { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' };
  if (st === 'COMPLETED') return { color: '#10b981', background: 'rgba(16,185,129,0.1)' };
  if (st === 'FAILED') return { color: '#ef4444', background: 'rgba(239,68,68,0.1)' };
  if (st === 'CANCELLED') return { color: '#909399', background: 'rgba(144,147,153,0.1)' };
  return { color: '#909399', background: 'rgba(144,147,153,0.06)' };
});

const statusTextStyle = computed(() => {
  const st = importStatus.value.status;
  if (importing.value || st === 'PROCESSING') return { color: '#f59e0b' };
  if (st === 'COMPLETED') return { color: '#10b981' };
  if (st === 'FAILED') return { color: '#ef4444' };
  if (st === 'CANCELLED') return { color: '#909399' };
  return {};
});

const statusGlowStyle = computed(() => {
  const st = importStatus.value.status;
  if (importing.value || st === 'PROCESSING') return { background: '#f59e0b' };
  if (st === 'COMPLETED') return { background: '#10b981' };
  if (st === 'FAILED') return { background: '#ef4444' };
  if (st === 'CANCELLED') return { background: '#909399' };
  return { background: '#909399' };
});

function saveStatsToStorage() {
  const data = {
    totalRows: importStatus.value.totalRows,
    validRows: importStatus.value.validRows,
    importedRows: importStatus.value.importedRows,
    status: importStatus.value.status,
    message: importStatus.value.message,
    startTime: importStatus.value.startTime,
    lastImport: lastImport.value,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadStatsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.lastImport?.time) {
      lastImport.value = data.lastImport;
      importStatus.value.totalRows = data.totalRows || 0;
      importStatus.value.validRows = data.validRows || 0;
      importStatus.value.importedRows = data.importedRows || 0;
      importStatus.value.status = data.status || 'IDLE';
      importStatus.value.message = data.message || '';
      importStatus.value.startTime = data.startTime || undefined;
    }
  } catch {}
}

async function onCancelImport() {
  try {
    await statsService.cancelImport();
    ElMessage.info('正在终止导入...');
  } catch {}
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function handleFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) handleFileInner(file);
  input.value = '';
}

async function handleFileInner(file: File) {
  selectedFileName.value = file.name;
  importing.value = true;
  imported.value = false;
  importStatus.value = { importing: true, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'PROCESSING', message: '上传中...' };

  pollTimer = setInterval(pollStatus, 2000);

  try {
    await statsService.importMeasurementFile(file);
  } catch (err: any) {
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
}

async function pollStatus() {
  try {
    const s = await statsService.getImportStatus();
    importStatus.value = s;
    if (s.status === 'COMPLETED') {
      importing.value = false;
      imported.value = true;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      lastImport.value = {
        time: formatDateTime(new Date().toISOString()),
        count: s.validRows,
        duration: s.startTime ? formatDuration(s.startTime) : '--',
      };
      saveStatsToStorage();
      ElMessage.success(`导入完成，有效编码 ${s.validRows} 条`);
      loading.value = false;
    } else if (s.status === 'FAILED') {
      importing.value = false;
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.error(s.message || '导入失败');
    } else if (s.status === 'CANCELLED') {
      importing.value = false;
      imported.value = false;
      selectedFileName.value = '';
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      ElMessage.info(s.message || '已终止');
    }
  } catch {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    importing.value = false;
  }
}

async function clearData() {
  try {
    await ElMessageBox.confirm('确定清空所有导入的测点数据？此操作不可恢复。', '确认', { type: 'warning' });
    await statsService.clearMeasurementData();
    imported.value = false;
    selectedFileName.value = '';
    lastImport.value = { time: '', count: 0, duration: '' };
    importStatus.value = { importing: false, batchId: null, totalRows: 0, importedRows: 0, validRows: 0, status: 'IDLE', message: '' };
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    ElMessage.success('已清空');
  } catch {}
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['测点编码', '测点描述'],
    ['示例：FD001_F1_01', '示例：风电场A-01号风机振动测点'],
  ]);
  ws['!cols'] = [{ wch: 35 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '测点导入模板');
  XLSX.writeFile(wb, '测点导入模板.xlsx');
  ElMessage.success('模板已下载');
}

onMounted(async () => {
  loadStatsFromStorage();
  try {
    const s = await statsService.getImportStatus();
    if (s.importing || s.status === 'PROCESSING') {
      importing.value = true;
      importStatus.value = s;
      pollTimer = setInterval(pollStatus, 2000);
    } else if (s.status === 'COMPLETED') {
      imported.value = true;
      importStatus.value = s;
      lastImport.value = {
        time: s.message || '--',
        count: s.validRows,
        duration: s.startTime ? formatDuration(s.startTime) : '--',
      };
    }
  } catch {}
  loading.value = false;
});
</script>

<style scoped>
.measure-import-tab { min-height: 400px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ==================== 步骤卡片 ==================== */
.step-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
}
.step-card {
  flex: 1;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1.5px dashed #d0d5dd;
  background: #fafcff;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-card:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
  box-shadow: 0 4px 20px rgba(59,130,246,0.10);
  transform: translateY(-2px);
}
.step-card.template-card:hover {
  border-color: #8b5cf6;
  background: #f5f3ff;
  box-shadow: 0 4px 20px rgba(139,92,246,0.10);
}
.card-bg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.step-card:hover .card-bg-glow {
  opacity: 1;
}
.card-click-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  width: 100%;
}
.card-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
}
.step-card:hover .card-icon-wrap {
  transform: scale(1.05);
}
.upload-icon { background: rgba(59,130,246,0.10); }
.template-icon { background: rgba(139,92,246,0.10); }
.done-icon { background: rgba(16,185,129,0.10); }
.progress-icon { background: rgba(245,158,11,0.10); }
.file-icon { background: rgba(59,130,246,0.10); }
.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
}
.card-title.importing-title { color: #d97706; }
.card-title.done-title { color: #10b981; }
.card-desc { font-size: 13px; color: #64748b; }
.card-tip { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.step-card.has-file { border-style: solid; border-color: #3b82f6; background: #f0f7ff; }
.step-card.importing { border-style: solid; border-color: #f59e0b; background: #fffbeb; cursor: default; }
.step-card.importing:hover { transform: none; box-shadow: none; }
.step-card.done { border-style: solid; border-color: #10b981; background: #f0fdf4; }

/* ==================== 导入进度 ==================== */
.card-progress-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 24px;
  text-align: center;
  width: 100%;
}
.card-progress-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 280px;
}
.progress-track {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22d3ee);
  border-radius: 4px;
  transition: width 0.3s ease;
}
.progress-text {
  font-size: 14px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 40px;
  text-align: right;
}
.card-file-name {
  font-size: 13px;
  color: #64748b;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-import-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}
.import-status-text { font-weight: 600; }
.import-status-text.completed { color: #67c23a; }
.import-status-text.failed { color: #f56c6c; }
.import-status-text.processing { color: #f59e0b; }
.import-remain { color: #94a3b8; }
.cancel-btn {
  padding: 6px 20px;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  background: #fff;
  color: #ef4444;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.cancel-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

/* ==================== 科技风指标卡片（导入统计） ==================== */
.tech-metrics { display: flex; gap: 12px; margin-bottom: 16px; }
.tech-metric-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tech-metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.06);
}
.tmc-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0.5;
}
.tmc-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tmc-body { flex: 1; }
.tmc-value { font-size: 20px; font-weight: 700; line-height: 1.2; }
.tmc-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ==================== 导入提示 ==================== */
.upload-limit-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  margin-bottom: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  font-size: 13px;
  color: #64748b;
}

/* ==================== 导入情况 ==================== */
.import-history {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e4e9f2;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
}
.history-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid #eef2f8;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  font-size: 16px;
  font-weight: 700;
  color: #1a2a4a;
}
.history-body {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 0;
}
.history-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}
.history-item-label {
  font-size: 13px;
  color: #909399;
}
.history-item-value {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}
.history-item-value.highlight {
  color: #3b82f6;
  font-size: 26px;
}
.history-divider {
  width: 1px;
  height: 40px;
  background: #eef2f8;
  flex-shrink: 0;
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
