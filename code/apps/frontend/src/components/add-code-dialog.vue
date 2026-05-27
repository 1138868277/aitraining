<template>
  <el-dialog v-model="dialogVisible" width="720px" :close-on-click-modal="false" class="add-code-dialog">
    <template #header>
      <div class="dialog-header">
        <div class="dh-icon"><el-icon><Plus /></el-icon></div>
        <div class="dh-text">
          <div class="dh-title">新增数据码</div>
          <div class="dh-sub">为编码字典添加新的数据码条目</div>
        </div>
      </div>
    </template>
    <el-form :model="addForm" label-position="top" class="add-code-form">
      <div class="form-section select-section">
        <div class="section-label">
          <span class="sl-dot"></span>
          <span class="sl-text">所属分类</span>
          <span class="sl-line"></span>
        </div>
        <div class="select-grid">
          <div class="select-item" :class="{ active: addForm.typeCode }">
            <div class="si-label">
              <span class="si-icon type-icon">⚡</span>
              <span>类型</span>
              <span class="si-req">*</span>
            </div>
            <el-select v-model="addForm.typeCode" placeholder="请选择类型" filterable clearable @change="onAddTypeChange">
              <el-option label="F 风力发电" value="F" />
              <el-option label="G 光伏发电" value="G" />
              <el-option label="S 水力发电" value="S" />
              <el-option label="Y 通用" value="Y" />
            </el-select>
          </div>
          <div class="select-item" :class="{ active: addForm.secondClassCode }">
            <div class="si-label">
              <span class="si-icon sc-icon">📂</span>
              <span>二级类码</span>
              <span class="si-req">*</span>
            </div>
            <el-select v-model="addForm.secondClassCode" placeholder="请选择二级类码" filterable clearable :disabled="!addForm.typeCode" @change="onAddSecondClassChange">
              <el-option v-for="item in addSecondClassOptions" :key="item.code" :label="item.code + ' ' + item.name" :value="item.code" />
            </el-select>
            <div v-if="!addForm.typeCode" class="si-hint">请先选择类型</div>
          </div>
          <div class="select-item" :class="{ active: addForm.dataCategoryCode }">
            <div class="si-label">
              <span class="si-icon dc-icon">🏷️</span>
              <span>数据类码</span>
              <span class="si-req">*</span>
            </div>
            <el-select v-model="addForm.dataCategoryCode" placeholder="请选择数据类码" filterable clearable :disabled="!addForm.secondClassCode" @change="onAddDataCategorySelect">
              <el-option v-for="item in addDataTypeOptions" :key="item.code" :label="item.code + ' ' + item.name" :value="item.code" />
            </el-select>
            <div v-if="!addForm.secondClassCode" class="si-hint">请先选择二级类码</div>
          </div>
        </div>
      </div>

      <div class="form-section entry-section">
        <div class="section-label">
          <span class="sl-dot"></span>
          <span class="sl-text">编码条目</span>
          <span class="sl-count">{{ addEntries.length }} 条</span>
          <span class="sl-line"></span>
        </div>
        <div class="entry-card">
          <div class="entry-header">
            <span class="eh-code">数据码</span>
            <span class="eh-name">数据码名称</span>
            <span class="eh-action">操作</span>
          </div>
          <div class="entry-body">
            <div v-for="(entry, index) in addEntries" :key="index" class="entry-row" :style="{ '--i': index }">
              <div class="er-index">{{ String(index + 1).padStart(2, '0') }}</div>
              <el-input v-model="entry.dataCode" placeholder="3位数字" clearable maxlength="3" class="er-code" @input="onDataCodeInput(entry)" />
              <el-input v-model="entry.dataName" placeholder="请输入数据码名称" clearable maxlength="100" class="er-name" />
              <el-button :disabled="addEntries.length <= 1" class="er-del" @click="removeEntryRow(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="entry-footer">
            <el-button class="add-row-btn" @click="addEntryRow">
              <el-icon><Plus /></el-icon> 添加一行
            </el-button>
          </div>
        </div>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="df-cancel" @click="dialogVisible = false">取消</el-button>
        <el-button class="df-confirm" type="primary" :loading="addLoading" :disabled="!addFormValid" @click="handleAddSave">
          <el-icon v-if="!addLoading" style="margin-right:4px;"><Plus /></el-icon>
          <span>确认新增</span>
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete } from '@element-plus/icons-vue';
import * as dictService from '@/services/dict';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const addLoading = ref(false);
const addForm = reactive({
  typeCode: '',
  secondClassCode: '',
  dataCategoryCode: '',
  dataCategoryName: '',
});
const addEntries = ref<Array<{
  dataCode: string;
  dataName: string;
}>>([{ dataCode: '', dataName: '' }]);
const addSecondClassOptions = ref<Array<{ code: string; name: string }>>([]);
const addDataTypeOptions = ref<Array<{ code: string; name: string }>>([]);

const addFormValid = computed(() => {
  if (!addForm.typeCode || !addForm.secondClassCode) return false;
  return !!addForm.dataCategoryCode
    && addEntries.value.length > 0
    && addEntries.value.every(e => /^\d{3}$/.test(e.dataCode) && e.dataName);
});

/** 编码递增工具 */
function padStart3(num: number): string {
  return String(num).padStart(3, '0');
}
function getNextDataCode(prev: string): string {
  const n = parseInt(prev, 10);
  return padStart3(isNaN(n) ? 1 : n + 1);
}
/** 用起始数据码填充编码列表（连续递增） */
function fillEntries(startCode: string) {
  const start = parseInt(startCode, 10);
  addEntries.value = [{ dataCode: padStart3(isNaN(start) ? 1 : start), dataName: '' }];
}

function addEntryRow() {
  const last = addEntries.value[addEntries.value.length - 1];
  addEntries.value.push({ dataCode: getNextDataCode(last.dataCode), dataName: '' });
}

function removeEntryRow(index: number) {
  if (addEntries.value.length <= 1) return;
  addEntries.value.splice(index, 1);
}

/** 数据码输入：只允许数字，最多3位 */
function onDataCodeInput(entry: { dataCode: string }) {
  entry.dataCode = entry.dataCode.replace(/\D/g, '').slice(0, 3);
}

/** 选择已有数据类码 → 自动填充名称 + 获取最大数据码并自动编号 */
async function onAddDataCategorySelect(code: string) {
  if (!code) { addForm.dataCategoryName = ''; return; }
  const selected = addDataTypeOptions.value.find(o => o.code === code);
  addForm.dataCategoryName = selected?.name || '';
  try {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode] || addForm.typeCode;
    const maxDataCode = await dictService.getMaxDataCode(addForm.secondClassCode, code, mappedType);
    fillEntries(maxDataCode ? getNextDataCode(maxDataCode) : '001');
  } catch {
    fillEntries('001');
  }
}

/** 二级类码变更 → 加载已有数据类码 */
async function onAddSecondClassChange() {
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addDataTypeOptions.value = [];
  addEntries.value = [{ dataCode: '', dataName: '' }];
  if (!addForm.typeCode || !addForm.secondClassCode) return;
  await loadAddDataTypeOptions();
}

async function loadAddDataTypeOptions() {
  try {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode] || addForm.typeCode;
    addDataTypeOptions.value = await dictService.getDataTypeBySecondClass(mappedType, addForm.secondClassCode);
  } catch {
    addDataTypeOptions.value = [];
  }
}

// F/G/Y 映射到具体类型码，用于加载二级类码
const TYPE_CODE_MAP: Record<string, string> = {
  F: 'F1',
  S: 'S1',
  G: 'G1',
  Y: 'Y0',
};

async function onAddTypeChange() {
  addForm.secondClassCode = '';
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addEntries.value = [{ dataCode: '', dataName: '' }];
  addSecondClassOptions.value = [];
  addDataTypeOptions.value = [];
  if (addForm.typeCode) {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode];
    if (mappedType) {
      try {
        addSecondClassOptions.value = await dictService.getSecondClassByType(mappedType);
      } catch {
        addSecondClassOptions.value = [];
      }
    }
  }
}

async function handleAddSave() {
  if (!addFormValid.value) return;
  addLoading.value = true;
  try {
    const secondClass = addSecondClassOptions.value.find(item => item.code === addForm.secondClassCode);
    await dictService.batchCreateManualCode({
      mode: 'existing',
      typeCode: addForm.typeCode,
      secondClassCode: addForm.secondClassCode,
      secondClassName: secondClass?.name || '',
      entries: addEntries.value.map(e => ({
        dataCategoryCode: addForm.dataCategoryCode,
        dataCategoryName: addForm.dataCategoryName,
        dataCode: e.dataCode,
        dataName: e.dataName,
      })),
    });
    ElMessage.success(`新增成功，共 ${addEntries.value.length} 条`);
    dialogVisible.value = false;
    emit('success');
  } catch (err: any) {
    ElMessage.error(err.message || '新增失败');
  } finally {
    addLoading.value = false;
  }
}

// 监听对话框关闭，重置表单
watch(dialogVisible, (val) => {
  if (!val) {
    addForm.typeCode = '';
    addForm.secondClassCode = '';
    addForm.dataCategoryCode = '';
    addForm.dataCategoryName = '';
    addEntries.value = [{ dataCode: '', dataName: '' }];
    addSecondClassOptions.value = [];
    addDataTypeOptions.value = [];
  }
});
</script>

<style scoped>
/* ===== Dialog 容器 ===== */
.add-code-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
  background: linear-gradient(145deg, #ffffff, #fafbfc);
}
.add-code-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border: none;
}
.add-code-dialog :deep(.el-dialog__body) {
  padding: 0 28px 8px;
}
.add-code-dialog :deep(.el-dialog__footer) {
  padding: 12px 28px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
  border-radius: 0 0 16px 16px;
}

/* ===== 头部 ===== */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px 16px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 40%, #3b7bbd 100%);
  position: relative;
  overflow: hidden;
}
.dialog-header::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}
.dialog-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
}
.dh-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.1);
}
.dh-text { position: relative; z-index: 1; }
.dh-title {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.dh-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-top: 2px;
}

/* ===== 表单 ===== */
.add-code-form { padding: 6px 0; }

.form-section { margin-bottom: 22px; }
.form-section:last-child { margin-bottom: 0; }

/* ===== 分区标题 ===== */
.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.sl-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.select-section .sl-dot { background: linear-gradient(135deg, #667eea, #764ba2); }
.entry-section .sl-dot { background: linear-gradient(135deg, #f093fb, #f5576c); }
.sl-text {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
.sl-count {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 1px 10px;
  border-radius: 20px;
  line-height: 20px;
}
.sl-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #e2e8f0, transparent);
}

/* ===== 选择区域 ===== */
.select-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.select-item {
  background: #f8fafc;
  border: 1.5px solid #e8ecf1;
  border-radius: 12px;
  padding: 14px 14px 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.select-item:hover {
  border-color: #c1d3e8;
  background: #f5f8fe;
}
.select-item.active {
  border-color: #3b7bbd;
  background: #f0f6ff;
  box-shadow: 0 0 0 3px rgba(59, 123, 189, 0.08);
}

.si-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.si-icon { font-size: 14px; }
.type-icon { filter: none; }
.sc-icon { filter: none; }
.dc-icon { filter: none; }
.si-req { color: #f56c6c; margin-left: 1px; }

.si-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
  padding-left: 2px;
}

.select-item :deep(.el-select) { width: 100%; }
.select-item :deep(.el-select .el-input__wrapper) {
  background: #fff;
  border: none;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.25s ease;
  padding: 2px 8px;
}
.select-item :deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #94a3b8 inset;
}
.select-item :deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 123, 189, 0.25) inset;
}
.select-item :deep(.el-select .el-input__inner) {
  height: 32px;
  font-size: 13px;
}

/* ===== 编码卡片 ===== */
.entry-card {
  background: #ffffff;
  border: 1.5px solid #e8ecf1;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.3s ease;
}
.entry-card:hover {
  border-color: #d0d8e3;
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f6;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}
.eh-code { width: 120px; padding-left: 34px; }
.eh-name { flex: 1; }
.eh-action { width: 44px; text-align: center; }

.entry-body { padding: 6px 14px; }

.entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f1f4f8;
  animation: rowIn 0.3s ease both;
  animation-delay: calc(var(--i, 0) * 0.05s);
}
.entry-row:last-child { border-bottom: none; }

@keyframes rowIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

.er-index {
  width: 24px;
  font-size: 11px;
  font-weight: 700;
  color: #c0c8d6;
  text-align: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.er-code {
  width: 120px;
  flex-shrink: 0;
}
.er-name { flex: 1; min-width: 0; }
.er-del {
  width: 36px;
  height: 32px;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  color: #c0c8d6;
  background: transparent;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 15px;
}
.er-del:hover {
  color: #f56c6c;
  background: #fef0f0;
}
.er-del:disabled {
  color: #d0d5dd;
  cursor: not-allowed;
  background: transparent;
}

.entry-row :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e8ecf1 inset;
  background: #fff;
  transition: all 0.25s ease;
}
.entry-row :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #94a3b8 inset;
}
.entry-row :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 123, 189, 0.2) inset;
}
.entry-row :deep(.el-input__inner) {
  height: 32px;
  font-size: 13px;
}

.entry-footer {
  padding: 8px 14px 10px;
  border-top: 1px solid #f1f4f8;
}

.add-row-btn {
  width: 100%;
  height: 34px;
  border: 1.5px dashed #d0d8e3;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  background: #fafbfc;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.add-row-btn:hover {
  border-color: #3b7bbd;
  color: #3b7bbd;
  background: #f0f6ff;
  border-style: solid;
}

/* ===== 底部 ===== */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.df-cancel {
  border-radius: 8px;
  font-size: 13px;
  padding: 8px 20px;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  transition: all 0.25s ease;
}
.df-cancel:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #475569;
}
.df-confirm {
  border-radius: 8px;
  font-size: 13px;
  padding: 8px 22px;
  font-weight: 600;
  background: linear-gradient(135deg, #1e3a5f, #2d5a8e);
  border: none;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}
.df-confirm:hover {
  background: linear-gradient(135deg, #2d5a8e, #3b7bbd);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(45, 90, 142, 0.3);
}
.df-confirm:active {
  transform: translateY(0);
}
.df-confirm.is-disabled {
  background: linear-gradient(135deg, #94a3b8, #b0bec5) !important;
}
</style>
