<template>
  <div class="auto-code-panel">
    <!-- 科技风步骤条 -->
    <div class="tech-steps-wrapper">
      <el-steps :active="step" align-center finish-status="success" class="tech-steps">
        <el-step title="上传文件" />
        <el-step title="列映射" />
        <el-step title="编码配置" />
        <el-step title="匹配结果" />
      </el-steps>
    </div>

    <!-- 步骤1：上传Excel -->
    <div v-if="step === 0" class="step-body">
      <div class="upload-zone-card">
        <el-upload drag accept=".xlsx,.xls" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange" class="tech-upload">
          <div class="upload-inner">
            <div class="upload-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div class="upload-title">拖拽或点击上传 Excel 文件</div>
            <div class="upload-hint">支持 .xlsx / .xls 格式，测点名称列必须有</div>
          </div>
        </el-upload>
      </div>

      <div v-if="previewRows.length > 0" class="preview-section">
        <div class="preview-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>数据预览</span>
          <span class="preview-badge">前10行，共 {{ totalRows }} 行</span>
        </div>
        <el-table :data="previewRows" stripe size="small" max-height="300" border class="tech-table">
          <el-table-column v-for="col in previewCols" :key="col" :prop="col" :label="col" min-width="120" />
        </el-table>
      </div>

      <div class="step-footer">
        <button class="btn-prev" disabled style="visibility:hidden">上一步</button>
        <button class="btn-next" :disabled="previewRows.length === 0" @click="step = 1">
          <span>下一步</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- 步骤2：列映射 -->
    <div v-if="step === 1" class="step-body">
      <div class="mapping-alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>将Excel列映射到系统字段。场站名称/二级类码/三级类码/数据类码/数据码用于匹配字典编码，测点名称用于提取扩展码。</span>
      </div>
      <el-table :data="mappingList" stripe size="small" style="width:100%" class="tech-table" border>
        <el-table-column label="Excel列名" prop="colName" width="200" />
        <el-table-column label="映射到系统字段" width="320">
          <template #default="{ row, $index }">
            <el-select v-model="row.mapping" placeholder="请选择" filterable style="width:100%">
              <el-option label="— 不导入 —" value="" />
              <el-option v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" :disabled="isFieldUsed(opt.value, $index)" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200">
          <template #default="{ row }">
            <span class="mapping-hint">{{ fieldHint(row.mapping) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="step-footer">
        <button class="btn-prev" @click="step = 0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>上一步</span>
        </button>
        <button class="btn-next" :disabled="!hasRequiredMapping" @click="step = 2">
          <span>下一步</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>

    <!-- 步骤3：编码配置 -->
    <div v-if="step === 2" class="step-body">
      <div class="config-card">
        <div class="config-card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          编码参数配置
        </div>
        <el-form :model="codeConfig" label-position="top" class="config-form">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="类型编码（5-6位）" required>
                <el-select v-model="codeConfig.typeCode" placeholder="请选择" filterable style="width:100%">
                  <el-option v-for="t in typeOptions" :key="t.code" :label="t.code + ' ' + t.name" :value="t.code" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="项目期号&amp;并网线路（7-9位）">
                <el-input v-model="codeConfig.projectLineCode" placeholder="默认111" maxlength="3" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="前缀号（10位）">
                <el-input v-model="codeConfig.prefixNo" placeholder="默认0" maxlength="1" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="一级类码（11-12位）">
                <el-input v-model="codeConfig.firstClassCode" placeholder="默认B1" maxlength="2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="step-footer" style="margin-top:20px">
        <button class="btn-prev" @click="step = 1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>上一步</span>
        </button>
        <button class="btn-generate-action" :disabled="!codeConfig.typeCode" :class="{ loading: matching }" @click="startMatch">
          <span v-if="matching" class="btn-spinner"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span>{{ matching ? '匹配中...' : '开始匹配并生成编码' }}</span>
          <span class="btn-glow"></span>
        </button>
      </div>
    </div>

    <!-- 步骤4：结果 -->
    <div v-if="step === 3" class="step-body">
      <div class="result-toolbar">
        <div class="result-toolbar-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span class="result-title">匹配结果</span>
          <span class="result-badge success">成功 {{ successCount }} 条</span>
          <span v-if="failCount > 0" class="result-badge fail">失败 {{ failCount }} 条</span>
        </div>
        <div class="result-toolbar-right">
          <button class="btn-clear-small" @click="resetAll">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            重新导入
          </button>
          <button class="btn-generate-small" :disabled="successCount === 0" @click="sendToPreview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            发送到编码结果 ({{ successCount }}条)
          </button>
        </div>
      </div>

      <el-table :data="resultRows" stripe size="small" max-height="400" style="width:100%" class="tech-table" border
        :row-class-name="resultRowClass">
        <el-table-column type="index" label="序号" width="60" align="center" fixed />
        <el-table-column prop="name" label="测点名称" min-width="180" />
        <el-table-column label="编码" width="310">
          <template #default="{ row }">
            <span v-if="row.generatedCode" class="code-value">{{ row.generatedCode.code }}</span>
            <el-tag v-else type="danger" size="small">匹配失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编码名称" min-width="180">
          <template #default="{ row }">
            <span v-if="row.generatedCode" class="code-name">{{ row.generatedCode.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.allMatched" class="status-dot success"></span>
            <span v-else class="status-dot fail"></span>
            <span :class="row.allMatched ? 'status-text-success' : 'status-text-fail'">
              {{ row.allMatched ? '成功' : '失败' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" min-width="200">
          <template #default="{ row }">
            <span v-if="row.error" class="error-text">{{ row.error }}</span>
            <span v-else-if="!row.allMatched" class="warn-text">{{ failedFields(row) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import * as dictService from '@/services/dict';
import { autoGenerate, type ImportRow, type AutoCodeConfig, type AutoCodeRowResult } from '@/services/auto-code';

const emit = defineEmits<{
  (e: 'success', codes: Array<{ code: string; name: string; generateTime: string }>): void;
}>();

const step = ref(0);
const excelData = ref<any[][]>([]);
const previewRows = ref<any[]>([]);
const previewCols = ref<string[]>([]);
const totalRows = ref(0);
const mappingList = ref<Array<{ colName: string; mapping: string }>>([]);
const typeOptions = ref<Array<{ code: string; name: string }>>([]);
const matching = ref(false);
const resultRows = ref<AutoCodeRowResult[]>([]);

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

async function loadTypeOptions() {
  try {
    const items = await dictService.getDictItems('type');
    typeOptions.value = items;
    if (items.length > 0 && !codeConfig.typeCode) {
      codeConfig.typeCode = items[0].code;
    }
  } catch {
    typeOptions.value = [];
  }
}

function resetAll() {
  step.value = 0;
  excelData.value = [];
  previewRows.value = [];
  previewCols.value = [];
  totalRows.value = 0;
  resultRows.value = [];
  mappingList.value = [];
  codeConfig.typeCode = '';
  codeConfig.projectLineCode = '111';
  codeConfig.prefixNo = '0';
  codeConfig.firstClassCode = 'B1';
}

function handleFileChange(file: any) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    if (json.length < 2) {
      ElMessage.warning('文件为空或只有表头');
      return;
    }

    const headers = json[0].map((h: any) => String(h || ''));
    const rows = json.slice(1).filter((r: any[]) => r.some(c => c !== undefined && c !== null && c !== ''));
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
    loadTypeOptions();
  };
  reader.readAsArrayBuffer(file.raw);
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

function resultRowClass({ row }: { row: AutoCodeRowResult }) {
  return row.allMatched ? '' : 'error-row';
}

function failedFields(row: AutoCodeRowResult): string {
  return row.matched
    .filter(f => f.status === 'not_found')
    .map(f => `${f.fieldLabel}(${f.sourceValue})`)
    .join('；');
}

function sendToPreview() {
  const codes = resultRows.value
    .filter(r => r.generatedCode)
    .map(r => r.generatedCode!);
  emit('success', codes);
  resetAll();
}
</script>

<style scoped>
/* ===== 科技风步骤条 ===== */
.tech-steps-wrapper {
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 10px;
  padding: 24px 20px 20px;
  margin-bottom: 20px;
  border: 1px solid #e4e9f2;
  position: relative;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}
.tech-steps-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.5;
  border-radius: 10px 10px 0 0;
}
.tech-steps :deep(.el-step__title) {
  font-size: 13px;
  font-weight: 600;
}
.tech-steps :deep(.el-step__head.is-finish) {
  color: #3b82f6;
  border-color: #3b82f6;
}
.tech-steps :deep(.el-step__head.is-process) {
  color: #2563eb;
  border-color: #2563eb;
}
.tech-steps :deep(.el-step__icon) {
  border-width: 2px;
  font-weight: 700;
}

/* ===== 上传区域 ===== */
.upload-zone-card {
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border: 2px dashed #c4d4f0;
  border-radius: 12px;
  padding: 4px;
  transition: all 0.3s ease;
  max-width: 500px;
  margin: 0 auto;
}
.upload-zone-card:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
  box-shadow: 0 4px 16px rgba(59,130,246,0.08);
}
.tech-upload :deep(.el-upload-dragger) {
  border: none !important;
  background: transparent !important;
  border-radius: 10px;
  padding: 32px 20px;
}
.upload-inner {
  text-align: center;
}
.upload-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f0fe, #dbeafe);
  margin-bottom: 12px;
  transition: transform 0.3s ease;
}
.upload-zone-card:hover .upload-icon-wrap {
  transform: scale(1.05);
}
.upload-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a2a4a;
  margin-bottom: 6px;
}
.upload-hint {
  font-size: 12px;
  color: #909399;
}

/* ===== 预览区域 ===== */
.preview-section {
  margin-top: 20px;
}
.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1a2a4a;
  margin-bottom: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 8px;
  border: 1px solid #e4e9f2;
}
.preview-badge {
  font-size: 12px;
  font-weight: 400;
  color: #909399;
  margin-left: 4px;
}

/* ===== 科技风表格 ===== */
.tech-table {
  border-radius: 8px;
  overflow: hidden;
}
.tech-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%) !important;
  color: #1d40af !important;
  font-weight: 600 !important;
  font-size: 13px;
}
.tech-table :deep(.el-table__body tr:hover td) {
  background-color: #f0f5ff !important;
}

/* ===== 映射提示 ===== */
.mapping-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%);
  border-radius: 8px;
  border: 1px solid #dbeafe;
  margin-bottom: 16px;
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
}
.mapping-hint {
  font-size: 12px;
  color: #909399;
}

/* ===== 配置卡片 ===== */
.config-card {
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 10px;
  border: 1px solid #e4e9f2;
  padding: 20px;
  position: relative;
}
.config-card::before {
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
.config-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #1a2a4a;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f8;
}
.config-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #1a2a4a;
  padding-bottom: 4px;
}

/* ===== 步骤底部 ===== */
.step-body {
  min-height: 150px;
  max-width: 900px;
  margin: 0 auto;
}
.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

/* ===== 科技风按钮 ===== */
.btn-prev {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #64748b;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  transition: all 0.25s ease;
}
.btn-prev:hover:not(:disabled) {
  border-color: rgba(100, 116, 139, 0.35);
  background: linear-gradient(135deg, #f1f5f9, #e9edf2);
  transform: translateY(-1px);
  color: #475569;
}
.btn-prev:disabled {
  opacity: 0;
  pointer-events: none;
}

.btn-next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 24px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 3px 10px rgba(59,130,246,0.25);
  transition: all 0.25s ease;
}
.btn-next:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59,130,246,0.35);
}
.btn-next:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-generate-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 30%, #60a5fa 50%, #2563eb 70%, #3b82f6 100%);
  background-size: 300% 100%;
  background-position: 0% 50%;
  box-shadow: 0 3px 12px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  overflow: hidden;
  animation: btnShimmer 2.5s ease-in-out infinite;
}
@keyframes btnShimmer {
  0%   { background-position: 0% 50%; box-shadow: 0 3px 12px rgba(59,130,246,0.3); }
  50%  { background-position: 100% 50%; box-shadow: 0 3px 20px rgba(59,130,246,0.5), 0 0 30px rgba(59,130,246,0.15); }
  100% { background-position: 0% 50%; box-shadow: 0 3px 12px rgba(59,130,246,0.3); }
}
.btn-generate-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59,130,246,0.5);
  animation: none;
}
.btn-generate-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
  background: linear-gradient(135deg, #94a3b8, #64748b);
  animation: none;
}
.btn-generate-action .btn-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.btn-generate-action:hover:not(:disabled) .btn-glow {
  opacity: 1;
}
.btn-generate-action.loading {
  pointer-events: none;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ===== 结果工具栏 ===== */
.result-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 8px;
  border: 1px solid #e4e9f2;
}
.result-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a2a4a;
}
.result-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 10px;
}
.result-badge.success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}
.result-badge.fail {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
.result-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-clear-small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(100,116,139,0.2);
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  transition: all 0.2s ease;
}
.btn-clear-small:hover {
  border-color: rgba(100,116,139,0.35);
  background: linear-gradient(135deg, #f1f5f9, #e9edf2);
  color: #475569;
}

.btn-generate-small {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59,130,246,0.2);
  transition: all 0.2s ease;
}
.btn-generate-small:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(59,130,246,0.3);
}
.btn-generate-small:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* ===== 编码展示 ===== */
.code-value {
  font-family: monospace;
  font-size: 13px;
  color: #2563eb;
  background: #eef2ff;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}
.code-name {
  font-size: 13px;
  color: #1a2a4a;
}

/* ===== 状态指示 ===== */
.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
.status-dot.success { background: #059669; }
.status-dot.fail { background: #dc2626; }
.status-text-success { color: #059669; font-size: 12px; font-weight: 500; }
.status-text-fail { color: #dc2626; font-size: 12px; font-weight: 500; }
.error-text { color: #dc2626; font-size: 12px; }
.warn-text { color: #d97706; font-size: 12px; }
</style>

<style>
.el-table .error-row { background-color: #fef0f0; }
</style>
