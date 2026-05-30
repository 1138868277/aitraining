<template>
  <el-dialog v-model="dialogVisible" title="批量导入自动编码" width="90%" top="3vh" destroy-on-close :close-on-click-modal="false"
    @closed="onClosed">
    <!-- 步骤条 -->
    <el-steps :active="step" align-center finish-status="success" style="margin-bottom:20px">
      <el-step title="上传文件" />
      <el-step title="列映射" />
      <el-step title="编码配置" />
      <el-step title="匹配预览" />
    </el-steps>

    <!-- 步骤1：上传Excel -->
    <div v-if="step === 0" class="step-body">
      <div style="display:flex;gap:16px;align-items:stretch;">
        <el-upload drag accept=".xlsx,.xls" :auto-upload="false" :show-file-list="false" :on-change="handleFileChange" style="flex:1">
          <el-icon class="upload-icon" style="font-size:48px;color:#409eff"><Upload /></el-icon>
          <div style="font-size:14px;color:#606266;margin-top:8px">拖拽或点击上传 Excel 文件</div>
          <template #tip>
            <div class="upload-tip">支持 .xlsx / .xls 格式</div>
          </template>
        </el-upload>
        <div style="display:flex;flex-direction:column;justify-content:center;gap:8px;">
          <span style="font-size:13px;color:#909399;white-space:nowrap;">还没有模板？</span>
          <button class="dl-template-btn" type="button" @click="downloadTemplate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>下载模板</span>
          </button>
        </div>
      </div>

      <div v-if="previewRows.length > 0" style="margin-top:16px">
        <div style="font-size:13px;color:#909399;margin-bottom:8px">数据预览（前10行，共 {{ totalRows }} 行）</div>
        <el-table :data="previewRows" stripe size="small" max-height="300" border>
          <el-table-column v-for="col in previewCols" :key="col" :prop="col" :label="col" min-width="120" />
        </el-table>
      </div>

      <div class="step-footer">
        <el-button type="primary" :disabled="previewRows.length === 0" @click="step = 1">下一步</el-button>
      </div>
    </div>

    <!-- 步骤2：列映射 -->
    <div v-if="step === 1" class="step-body">
      <el-alert title="将Excel列映射到系统字段。场站名称/二级类码/三级类码/数据类码/数据码用于自动匹配字典编码，测点名称用于提取扩展码。" type="info" :closable="false" show-icon style="margin-bottom:12px" />
      <el-table :data="mappingList" stripe size="small" style="width:100%">
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
            <span style="font-size:12px;color:#909399">{{ fieldHint(row.mapping) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="step-footer" style="margin-top:16px">
        <el-button @click="step = 0">上一步</el-button>
        <el-button type="primary" :disabled="!hasRequiredMapping" @click="step = 2">下一步</el-button>
      </div>
    </div>

    <!-- 步骤3：编码配置 -->
    <div v-if="step === 2" class="step-body">
      <el-form :model="codeConfig" label-width="140px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目期号&并网线路（7-9位）">
              <el-input v-model="codeConfig.projectLineCode" placeholder="默认111" maxlength="3" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="前缀号（10位）">
              <el-input v-model="codeConfig.prefixNo" placeholder="默认0" maxlength="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="一级类码（11-12位）">
              <el-input v-model="codeConfig.firstClassCode" placeholder="默认B1" maxlength="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="step-footer">
        <el-button @click="step = 1">上一步</el-button>
        <el-button type="primary" :loading="matching" @click="startMatch">开始匹配并生成编码</el-button>
      </div>
    </div>

    <!-- 步骤4：结果预览 -->
    <div v-if="step === 3" class="step-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="font-size:14px;font-weight:600">匹配结果</span>
        <el-tag type="success" size="small">成功 {{ successCount }} 条</el-tag>
        <el-tag v-if="failCount > 0" type="danger" size="small">失败 {{ failCount }} 条</el-tag>
        <span style="flex:1" />
        <el-button size="small" @click="copyAllResults">复制全部</el-button>
        <el-button size="small" type="primary" :disabled="successCount === 0" @click="emitResults">将结果发送到编码预览</el-button>
      </div>

      <el-table :data="resultRows" stripe size="small" max-height="500" style="width:100%" border
        :row-class-name="resultRowClass">
        <el-table-column type="index" label="序号" width="60" align="center" fixed />
        <el-table-column prop="name" label="测点名称" min-width="180" />
        <el-table-column label="编码" width="310">
          <template #default="{ row }">
            <span v-if="row.generatedCode" style="font-family:monospace;font-size:13px">{{ row.generatedCode.code }}</span>
            <el-tag v-else type="danger" size="small">匹配失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编码名称" min-width="180">
          <template #default="{ row }">
            <span v-if="row.generatedCode" style="font-size:13px">{{ row.generatedCode.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.allMatched ? 'success' : 'danger'" size="small" effect="plain">
              {{ row.allMatched ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误原因" min-width="200">
          <template #default="{ row }">
            <span v-if="row.error" style="color:#f56c6c;font-size:12px">{{ row.error }}</span>
            <span v-else-if="!row.allMatched" style="color:#e6a23c;font-size:12px">
              {{ failedFields(row) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { autoGenerate, type ImportRow, type AutoCodeConfig, type AutoCodeRowResult } from '@/services/auto-code';

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'success', codes: Array<{ code: string; name: string; generateTime: string }>): void;
}>();

const props = defineProps<{
  modelValue: boolean;
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const step = ref(0);
const excelData = ref<any[][]>([]);
const previewRows = ref<any[]>([]);
const previewCols = ref<string[]>([]);
const totalRows = ref(0);
const mappingList = ref<Array<{ colName: string; mapping: string }>>([]);
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
  const mapped = mappingList.value.filter(m => m.mapping).map(m => m.mapping);
  return mapped.includes('name');
});

function isFieldUsed(value: string, skipIndex: number): boolean {
  return mappingList.value.some((m, i) => i !== skipIndex && m.mapping === value);
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

    // 预览前10行
    previewRows.value = rows.slice(0, 10).map((r: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, i: number) => { obj[h] = r[i]; });
      return obj;
    });

    // 自动猜测列映射
    autoGuessMapping(headers);
    ElMessage.success(`读取到 ${rows.length} 行数据`);
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

function downloadTemplate() {
  const headers = ['名称', '场站名称', '二级类码', '三级类码', '数据类码', '数据码', '项目期号'];
  const exampleRows = [
    ['堆龙光伏_#1箱变_箱变_频率', '堆龙华电光储电站', '光伏箱变', '箱变UPS', '功率', '频率（F）', '111'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);
  const colWidths = headers.map(h => ({ wch: Math.max(h.length * 2, 18) }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '模板');
  XLSX.writeFile(wb, '自动编码导入模板.xlsx');
}

function onClosed() {
  step.value = 0;
  excelData.value = [];
  previewRows.value = [];
  previewCols.value = [];
  totalRows.value = 0;
  resultRows.value = [];
  codeConfig.typeCode = '';
  codeConfig.projectLineCode = '111';
  codeConfig.prefixNo = '0';
  codeConfig.firstClassCode = 'B1';
}

async function startMatch() {
  matching.value = true;
  try {
    // 构建导入数据
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

function copyAllResults() {
  const text = resultRows.value
    .filter(r => r.generatedCode)
    .map(r => `${r.generatedCode!.code} ${r.generatedCode!.name}`)
    .join('\n');
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败'),
  );
}

function emitResults() {
  const codes = resultRows.value
    .filter(r => r.generatedCode)
    .map(r => r.generatedCode!);
  emit('success', codes);
  dialogVisible.value = false;
}
</script>

<style scoped>
.step-body { min-height: 200px; }
.step-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.upload-tip { font-size: 12px; color: #909399; margin-top: 4px; }

.dl-template-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1.5px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #3b82f6;
  background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(34,211,238,0.04));
  transition: all 0.25s ease;
  white-space: nowrap;
  font-family: inherit;
}
.dl-template-btn:hover {
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
  transform: translateY(-1px);
}
.dl-template-btn:active {
  transform: translateY(0);
}
</style>

<style>
.el-table .error-row { background-color: #fef0f0; }
</style>
