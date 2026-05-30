<template>
  <div class="auto-panel">
    <div class="panel-bg-layer"></div>
    <div class="panel-content">
      <div class="cyber-steps">
        <div class="steps-track">
          <div class="steps-progress" :style="{ width: ((step / 3) * 100) + '%' }"></div>
        </div>
        <div class="steps-row">
          <div class="steps-nav">
            <div v-for="(s, i) in steps" :key="i" class="step-item" :class="{ active: step === i, done: step > i }" @click="step = Math.max(0, Math.min(3, i))">
              <div class="step-dot">
                <svg v-if="step > i" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                <span v-else>{{ i + 1 }}</span>
              </div>
              <div class="step-label">{{ s }}</div>
            </div>
          </div>
          <div class="steps-actions">
            <button v-if="step === 0" class="cyber-btn step-action" :disabled="previewRows.length === 0" @click="step = 1">
              <span>下一步</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button v-else-if="step === 1" class="cyber-btn step-action" :disabled="!hasRequiredMapping" @click="step = 2">
              <span>下一步</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button v-else-if="step === 2" class="cyber-btn step-action pulse" :class="{ loading: matching }" @click="startMatch" :disabled="matching">
              <span v-if="matching" class="spinner"></span>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>{{ matching ? '匹配中...' : '开始匹配' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 0: Upload -->
      <div v-if="step === 0" class="step-body">
        <div class="step-cards">
          <div class="step-card upload-card" :class="{ 'has-file': !!fileName }" @dragover.prevent @drop.prevent="onDrop" @click="triggerFileInput">
            <input ref="fileInput" type="file" accept=".xlsx,.xls" style="display:none" @change="onFileInputChange" />
            <div class="card-glow"></div>
            <template v-if="!fileName">
              <div class="card-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div class="card-title">上传 Excel 文件</div>
              <div class="card-desc">拖拽文件到此处，或点击上传</div>
              <div class="card-tip">支持 .xlsx / .xls 格式</div>
            </template>
            <template v-else>
              <div class="card-icon uploaded">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="card-title uploaded">{{ fileName }}</div>
              <div class="card-desc">点击重新选择文件</div>
            </template>
          </div>
          <div class="step-card template-card" @click="downloadTemplate">
            <div class="card-glow"></div>
            <div class="card-icon template">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div class="card-title">下载导入模板</div>
            <div class="card-desc">含名称、场站、二级类码等标准列</div>
            <div class="card-tip">.xlsx 格式，可直接填写数据</div>
          </div>
        </div>

        <div class="upload-limit-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>单次最多支持 <strong>20,000</strong> 条编码的自动匹配与生成</span>
        </div>

        <div v-if="previewRows.length > 0" class="preview-box">
          <div class="preview-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>数据预览</span>
            <span class="preview-count">{{ totalRows }} 行</span>
          </div>
          <div class="preview-table-wrap">
            <table class="cyber-table">
              <thead><tr><th>#</th><th v-for="col in previewCols" :key="col">{{ col }}</th></tr></thead>
              <tbody>
                <tr v-for="(row, ri) in previewRows" :key="ri">
                  <td class="row-num">{{ ri + 1 }}</td>
                  <td v-for="col in previewCols" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Step 1: Mapping -->
      <div v-if="step === 1" class="step-body">
        <div class="code-config">
          <div class="config-card">
            <div class="config-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span>列映射</span>
            </div>
            <div class="config-card-body" style="padding-bottom:16px">
              <div class="mapping-info">
                将 Excel 列映射到系统字段，<strong>测点名称</strong>为必填项
              </div>
              <div class="mapping-table-wrap">
                <table class="cyber-table mapping-table">
                  <thead><tr><th>Excel 列名</th><th>映射到系统字段</th><th>说明</th></tr></thead>
                  <tbody>
                    <tr v-for="(item, idx) in mappingList" :key="idx">
                      <td class="col-name">{{ item.colName }}</td>
                      <td>
                        <select v-model="item.mapping" class="cyber-select">
                          <option value="">— 不导入 —</option>
                          <option v-for="opt in fieldOptions" :key="opt.value" :value="opt.value" :disabled="isFieldUsed(opt.value, idx)">{{ opt.label }}</option>
                        </select>
                      </td>
                      <td class="col-hint">{{ fieldHint(item.mapping) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Config -->
      <div v-if="step === 2" class="step-body">
        <div class="code-config">
          <div class="config-card">
            <div class="config-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>编码参数</span>
            </div>
            <div class="config-card-body">
              <div class="config-row">
                <div class="config-item">
                  <label>项目期号 &amp; 并网线路</label>
                  <div class="cfg-input-box">
                    <input v-model="codeConfig.projectLineCode" placeholder="111" maxlength="3" class="cfg-input" />
                    <span class="cfg-hint">第 7-9 位</span>
                  </div>
                </div>
                <div class="config-item">
                  <label>前缀号</label>
                  <div class="cfg-input-box">
                    <input v-model="codeConfig.prefixNo" placeholder="0" maxlength="1" class="cfg-input" />
                    <span class="cfg-hint">第 10 位</span>
                  </div>
                </div>
                <div class="config-item">
                  <label>一级类码</label>
                  <div class="cfg-input-box">
                    <input v-model="codeConfig.firstClassCode" placeholder="B1" maxlength="2" class="cfg-input" />
                    <span class="cfg-hint">第 11-12 位</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Results -->
      <div v-if="step === 3" class="step-body">
        <div class="result-bar">
          <div class="result-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span class="result-title">匹配结果</span>
            <span class="tag tag-success">成功 {{ successCount }}</span>
            <span v-if="failCount > 0" class="tag tag-fail">失败 {{ failCount }}</span>
          </div>
          <div class="result-right">
            <button class="result-btn reset-btn" @click="resetAll">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>重新导入</span>
            </button>
            <button class="result-btn send-btn" :disabled="successCount === 0" @click="sendToPreview">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              <span>发送到编码结果</span>
              <span class="send-badge">{{ successCount }}</span>
              <span class="send-glow"></span>
            </button>
          </div>
        </div>
        <div class="result-table-wrap">
          <table class="cyber-table result-table">
            <thead><tr><th>序号</th><th>测点编码</th><th>测点描述</th><th>状态</th><th>失败原因</th></tr></thead>
            <tbody>
              <tr v-for="(row, ri) in resultRows" :key="ri" :class="{ 'row-fail': !row.allMatched }">
                <td class="row-num">{{ ri + 1 }}</td>
                <td><span v-if="row.generatedCode" class="code-cell">{{ row.generatedCode.code }}</span><span v-else class="text-dim">—</span></td>
                <td class="text-desc">{{ row.name }}</td>
                <td><span class="status-tag" :class="row.allMatched ? 'ok' : 'no'">{{ row.allMatched ? '成功' : '失败' }}</span></td>
                <td class="text-fail">{{ row.error || (row.allMatched ? '' : failedFields(row)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import { autoGenerate, type ImportRow, type AutoCodeConfig, type AutoCodeRowResult } from '@/services/auto-code';

const emit = defineEmits<{
  (e: 'success', codes: Array<{ code: string; name: string; generateTime: string }>): void;
}>();

const steps = ['上传文件', '列映射', '编码配置', '匹配结果'];

const step = ref(0);
const excelData = ref<any[][]>([]);
const previewRows = ref<any[]>([]);
const previewCols = ref<string[]>([]);
const totalRows = ref(0);
const fileName = ref('');
const mappingList = ref<Array<{ colName: string; mapping: string }>>([]);
const matching = ref(false);
const resultRows = ref<AutoCodeRowResult[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const codeConfig = reactive<AutoCodeConfig>({
  typeCode: '',
  projectLineCode: '111',
  prefixNo: '0',
  firstClassCode: 'B1',
});

const fieldOptions = [
  { value: 'name', label: '测点名称' },
  { value: 'stationName', label: '场站名称' },
  { value: 'secondClassName', label: '二级类码名称' },
  { value: 'thirdClassName', label: '三级类码名称' },
  { value: 'dataTypeName', label: '数据类码名称' },
  { value: 'dataName', label: '数据码名称' },
  { value: 'projectLineCode', label: '项目期号' },
];

function fieldHint(value: string): string {
  const map: Record<string, string> = {
    name: '用于提取扩展码',
    stationName: '匹配场站编码',
    secondClassName: '匹配二级类码',
    thirdClassName: '匹配三级类码',
    dataTypeName: '匹配数据类码',
    dataName: '匹配数据码',
    projectLineCode: '项目期号&并网线路',
  };
  return map[value] || '';
}

const hasRequiredMapping = computed(() => {
  return mappingList.value.some(m => m.mapping === 'name');
});

function isFieldUsed(value: string, skipIndex: number): boolean {
  return mappingList.value.some((m, i) => i !== skipIndex && m.mapping === value);
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) handleFile(target.files[0]);
}

function onDrop(e: DragEvent) {
  if (e.dataTransfer?.files.length) handleFile(e.dataTransfer.files[0]);
}

function downloadTemplate() {
  const headers = ['测点描述', '场站名称', '二级类码', '数据类码', '数据码', '项目期号', '三级类码'];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 2, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '模板');
  XLSX.writeFile(wb, '自动编码导入模板.xlsx');
}

function handleFile(file: File) {
  fileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (json.length < 2) { ElMessage.warning('文件为空或只有表头'); return; }
    const headers = json[0].map((h: any) => String(h || ''));
    const rows = json.slice(1).filter((r: any[]) => r.some(c => c !== undefined && c !== null && c !== ''));
    if (rows.length > 20000) {
      ElMessage.warning(`数据行数超出限制（最多 20,000 条），当前文件共 ${rows.length} 行`);
      return;
    }
    excelData.value = rows;
    previewCols.value = headers;
    totalRows.value = rows.length;
    previewRows.value = rows.slice(0, 10).map((r: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, i: number) => { obj[h] = r[i]; });
      return obj;
    });
    autoGuessMapping(headers);
    ElMessage.success(`读取到 ${rows.length} 行数据`);
  };
  reader.readAsArrayBuffer(file);
}

function autoGuessMapping(headers: string[]) {
  const guessMap: Record<string, string> = {
    '名称': 'name', '测点名称': 'name', '测点描述': 'name', '描述': 'name',
    '场站名称': 'stationName', '场站': 'stationName',
    '二级类码': 'secondClassName', '二级类码名称': 'secondClassName',
    '三级类码': 'thirdClassName', '三级类码名称': 'thirdClassName',
    '数据类码': 'dataTypeName', '数据类码名称': 'dataTypeName',
    '数据码': 'dataName', '数据码名称': 'dataName',
    '项目期号': 'projectLineCode', '项目期号&并网线路': 'projectLineCode',
  };
  mappingList.value = headers.map(h => ({
    colName: h,
    mapping: guessMap[h] || '',
  }));
}

function resetAll() {
  step.value = 0;
  excelData.value = [];
  previewRows.value = [];
  previewCols.value = [];
  totalRows.value = 0;
  fileName.value = '';
  resultRows.value = [];
  mappingList.value = [];
  codeConfig.typeCode = '';
  codeConfig.projectLineCode = '111';
  codeConfig.prefixNo = '0';
  codeConfig.firstClassCode = 'B1';
}

async function startMatch() {
  matching.value = true;
  try {
    const mapping = mappingList.value.filter(m => m.mapping);
    const rows: ImportRow[] = excelData.value.map((row: any[]) => {
      const item: Record<string, any> = {};
      mapping.forEach(m => {
        const colIdx = previewCols.value.indexOf(m.colName);
        item[m.mapping] = colIdx >= 0 ? String(row[colIdx] ?? '') : '';
      });
      return item as ImportRow;
    });
    const res = await autoGenerate(rows, { ...codeConfig });
    resultRows.value = res.results;
    step.value = 3;
  } catch (err: any) {
    ElMessage.error(err.message || '自动编码失败');
  } finally {
    matching.value = false;
  }
}

const successCount = computed(() => resultRows.value.filter(r => r.allMatched && r.generatedCode).length);
const failCount = computed(() => resultRows.value.length - successCount.value);

function failedFields(row: AutoCodeRowResult): string {
  return row.matched
    .filter(f => f.status === 'not_found')
    .map(f => `${f.fieldLabel}(${f.sourceValue})`)
    .join('；');
}

function sendToPreview() {
  const codes = resultRows.value.filter(r => r.generatedCode).map(r => r.generatedCode!);
  emit('success', codes);
  resetAll();
}
</script>

<style scoped>
/* ===== Light theme for auto-code panel ===== */
.auto-panel {
  position: relative;
  min-height: 400px;
  padding: 24px 28px;
  margin: -20px;
  background: #fafcff;
}
.panel-bg-layer {
  display: none;
}
.panel-content {
  position: relative;
  z-index: 1;
}
.cyber-steps {
  margin-bottom: 24px;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border: 1px solid #e4e9f2;
  border-radius: 10px;
  position: relative;
}
.cyber-steps::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.4;
  border-radius: 10px 10px 0 0;
}
.steps-track {
  height: 2px;
  background: #e4e9f2;
  border-radius: 2px;
  margin-bottom: 20px;
  position: relative;
}
.steps-progress {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #818cf8);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 6px rgba(59,130,246,0.3);
}
.steps-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.steps-nav {
  display: flex;
  justify-content: space-between;
  flex: 1;
}
.steps-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
  flex: 1;
}
.step-item::before {
  content: '';
  position: absolute;
  top: -22px;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  transition: background 0.3s;
}
.step-item.active::before,
.step-item.done::before {
  background: linear-gradient(90deg, #3b82f6, #818cf8);
}
.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid #d1d9e6;
  color: #94a3b8;
  background: #fff;
  transition: all 0.3s ease;
}
.step-item.active .step-dot {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eef2ff;
  box-shadow: 0 0 8px rgba(59,130,246,0.2);
}
.step-item.done .step-dot {
  border-color: #10b981;
  color: #10b981;
  background: #ecfdf5;
}
.step-label {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
  transition: color 0.3s;
}
.step-item.active .step-label { color: #3b82f6; }
.step-item.done .step-label { color: #10b981; }
.step-body {
  min-height: 200px;
  max-height: calc(100vh - 360px);
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}
.step-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 20px;
}
.step-card {
  position: relative;
  flex: 1;
  max-width: 360px;
  padding: 44px 24px 36px;
  text-align: center;
  border: 2px dashed #d1d9e6;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}
.step-card:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
  box-shadow: 0 6px 24px rgba(59,130,246,0.10);
  transform: translateY(-2px);
}
.step-card:active { transform: translateY(0); }
.step-card.upload-card.has-file { border-color: #10b981; border-style: solid; }
.step-card.upload-card.has-file .card-title { color: #059669; }
.step-card.upload-card.has-file .card-icon svg { stroke: #10b981; }
.step-card.template-card {
  border-style: solid;
  border-color: #e8e0f0;
  background: linear-gradient(135deg, #faf8ff 0%, #f5f0ff 100%);
}
.step-card.template-card:hover {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, #f5f0ff 0%, #ede4ff 100%);
  box-shadow: 0 6px 24px rgba(139,92,246,0.12);
}
.card-glow { display: none; }
.card-icon { margin-bottom: 14px; transition: transform 0.3s; }
.step-card:hover .card-icon { transform: translateY(-4px); }
.card-icon.template svg { stroke: #8b5cf6; }
.card-title { font-size: 16px; font-weight: 700; color: #1a2a4a; margin-bottom: 8px; letter-spacing: 0.3px; }
.card-title.uploaded { color: #059669; }
.card-desc { font-size: 13px; color: #64748b; margin-bottom: 6px; line-height: 1.5; }
.card-tip { font-size: 12px; color: #94a3b8; }
.upload-limit-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0 auto 16px;
  padding: 8px 18px;
  font-size: 13px;
  color: #64748b;
  background: linear-gradient(135deg, rgba(59,130,246,0.05), rgba(34,211,238,0.03));
  border: 1px solid rgba(59,130,246,0.10);
  border-radius: 8px;
  width: fit-content;
}
.upload-limit-hint svg { color: #3b82f6; flex-shrink: 0; }
.upload-limit-hint strong { color: #1e40af; font-weight: 700; }
.preview-box {
  margin-top: 20px;
  background: #fff;
  border: 1px solid #e4e9f2;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
}
.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #1a2a4a;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-bottom: 1px solid #eef2f8;
}
.preview-count {
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  margin-left: 4px;
}
.preview-table-wrap { overflow-x: auto; padding: 0; }
.cyber-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cyber-table thead th {
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #1d40af;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-bottom: 1px solid #eef2f8;
}
.cyber-table tbody td {
  padding: 9px 14px;
  border-bottom: 1px solid #f0f2f5;
  color: #334155;
  transition: background 0.15s;
}
.cyber-table tbody tr:hover td {
  background: #f0f5ff !important;
}
.cyber-table tbody tr:last-child td { border-bottom: none; }
.row-num { color: #94a3b8 !important; font-size: 12px; width: 40px; text-align: center; }
.col-name { font-weight: 500; color: #1a2a4a !important; }
.col-hint { color: #94a3b8 !important; font-size: 12px; }
.text-desc { color: #1a2a4a; }
.text-dim { color: #94a3b8; }
.text-fail { color: #dc2626 !important; font-size: 12px; }
.mapping-info {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: #f8faff;
  border: 1px solid #e8edf5;
  border-radius: 8px;
  line-height: 1.5;
}
.mapping-info strong { color: #1a2a4a; }
.mapping-table-wrap {
  border: 1px solid #eef2f8;
  border-radius: 8px;
  overflow: hidden;
}
.result-table-wrap {
  background: #fff;
  border: 1px solid #e4e9f2;
  border-radius: 10px;
  overflow: hidden;
  max-height: 460px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
}
.cyber-select {
  width: 100%;
  padding: 7px 10px;
  font-size: 13px;
  color: #1a2a4a;
  background: #fff;
  border: 1px solid #d1d9e6;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}
.cyber-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
.cyber-select option { background: #fff; color: #1a2a4a; }
.code-config {
  max-width: 720px;
  margin: 0 auto;
}
.config-card {
  background: #fff;
  border: 1px solid #e4e9f2;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(59,130,246,0.04);
}
.config-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #1a2a4a;
  background: linear-gradient(135deg, #f8faff, #f0f5ff);
  border-bottom: 1px solid #eef2f8;
}
.config-card-body {
  padding: 24px 20px 20px;
}
.config-row {
  display: flex;
  gap: 24px;
}
.config-item {
  flex: 1;
}
.config-item label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}
.cfg-input-box {
  position: relative;
  display: flex;
  align-items: center;
}
.cfg-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  color: #1e293b;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  letter-spacing: 3px;
}
.cfg-input:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.06);
}
.cfg-input::placeholder {
  color: #cbd5e1;
  font-weight: 400;
  letter-spacing: 0;
  font-family: inherit;
}
.cfg-hint {
  position: absolute;
  right: 10px;
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  pointer-events: none;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 4px;
}
.cfg-input:focus ~ .cfg-hint {
  background: #fff;
}
.result-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border: 1px solid #e4e9f2;
  border-radius: 10px;
}
.result-left { display: flex; align-items: center; gap: 10px; }
.result-title { font-size: 14px; font-weight: 600; color: #1a2a4a; }
.result-right { display: flex; align-items: center; gap: 12px; }
.result-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  white-space: nowrap;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.3px;
}
.result-btn svg { flex-shrink: 0; }
/* 重新导入按钮 */
.reset-btn {
  color: #64748b;
  background: transparent;
  border: 1.5px solid #d1d9e6;
}
.reset-btn:hover {
  color: #475569;
  border-color: #94a3b8;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
/* 发送按钮 */
.send-btn {
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  padding: 10px 24px 10px 20px;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
}
.send-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}
.send-btn:hover:not(:disabled)::before {
  transform: translateX(100%);
}
.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(59,130,246,0.4);
}
.send-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.send-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  background: rgba(255,255,255,0.2);
  color: #fff;
}
.send-glow {
  position: absolute;
  top: -30%;
  left: -20%;
  width: 140%;
  height: 140%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.send-btn:hover:not(:disabled) .send-glow {
  opacity: 1;
}
.tag {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 10px;
}
.tag-success {
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}
.tag-fail {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.status-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 4px;
}
.status-tag.ok {
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}
.status-tag.no {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.code-cell {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 12px;
  color: #2563eb;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  border: 1px solid #dbeafe;
}
.row-fail td { background: #fef2f2 !important; }
.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}
.cyber-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(100,116,139,0.2);
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #64748b;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  transition: all 0.25s ease;
  white-space: nowrap;
}
.cyber-btn:hover:not(:disabled) {
  border-color: rgba(100,116,139,0.35);
  background: linear-gradient(135deg, #f1f5f9, #e9edf2);
  color: #475569;
  transform: translateY(-1px);
}
.cyber-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.cyber-btn.primary {
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(59,130,246,0.25);
  position: relative;
  overflow: hidden;
}
.cyber-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 6px 20px rgba(59,130,246,0.35);
  color: #fff;
  transform: translateY(-2px);
}
.cyber-btn.primary.pulse {
  animation: btnPulse 2.5s ease-in-out infinite;
}
@keyframes btnPulse {
  0%, 100% { box-shadow: 0 3px 10px rgba(59,130,246,0.25); }
  50% { box-shadow: 0 4px 24px rgba(59,130,246,0.45), 0 0 40px rgba(59,130,246,0.1); }
}
.cyber-btn.sm { padding: 7px 14px; font-size: 12px; }
.cyber-btn.step-action {
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  border: none;
  border-radius: 10px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
  background-size: 200% 100%;
  background-position: 0% 50%;
  box-shadow:
    0 4px 16px rgba(59,130,246,0.35),
    0 0 0 1px rgba(59,130,246,0.2),
    inset 0 1px 0 rgba(255,255,255,0.15);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  animation: stepActionGlow 2s ease-in-out infinite;
}
@keyframes stepActionGlow {
  0%, 100% {
    background-position: 0% 50%;
    box-shadow: 0 4px 16px rgba(59,130,246,0.35), 0 0 0 1px rgba(59,130,246,0.2);
  }
  50% {
    background-position: 100% 50%;
    box-shadow: 0 4px 24px rgba(59,130,246,0.5), 0 0 0 2px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.1);
  }
}
.cyber-btn.step-action::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}
.cyber-btn.step-action:hover:not(:disabled)::before {
  transform: translateX(100%);
}
.cyber-btn.step-action:hover:not(:disabled) {
  background-position: 100% 50%;
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(59,130,246,0.5), 0 0 0 1px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.15);
}
.cyber-btn.step-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  animation: none;
  transform: none;
  box-shadow: none;
}
.cyber-btn.loading { pointer-events: none; }
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

</style>

<style>
.el-table .error-row { background-color: #fef0f0; }
</style>
