<template>
  <div class="code-generate">
    <!-- 顶部筛选条件面板 -->
    <el-card class="condition-card">
      <template #header>
        <span>筛选条件</span>
      </template>
      <el-form :model="conditions" label-width="140px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in conditionFields" :key="field.key">
            <el-form-item :label="field.label" :required="field.required">
              <!-- 下拉选择框 -->
              <el-select
                v-if="field.type === 'select'"
                v-model="conditions[field.key]"
                :placeholder="'请选择' + field.label"
                filterable
                :disabled="field.disabled(conditions)"
                clearable
                @change="onConditionChange(field.key)"
                style="width: 100%"
              >
                <el-option
                  v-for="item in dictOptions[field.key] || []"
                  :key="item.code"
                  :label="item.code + ' ' + item.name"
                  :value="item.code"
                />
              </el-select>

              <!-- 输入框（带快捷选择） -->
              <div v-else-if="field.type === 'input'" class="input-with-quick-options">
                <el-input
                  v-model="conditions[field.key]"
                  :placeholder="'请输入' + field.label"
                  :disabled="field.disabled(conditions)"
                  clearable
                  @change="onConditionChange(field.key)"
                  style="width: 100%"
                />
                <div v-if="field.quickOptions && field.quickOptions.length > 0" class="quick-options">
                  <el-tag
                    v-for="option in field.quickOptions"
                    :key="option"
                    size="small"
                    class="quick-option-tag"
                    @click="conditions[field.key] = option"
                  >
                    {{ option }}
                  </el-tag>
                </div>
              </div>

              <!-- 扩展数字输入框（两个独立输入框） -->
              <div v-else-if="field.type === 'extend-number'" class="extend-number-input">
                <div class="extend-number-row">
                  <el-input
                    v-model="conditions[field.key + 'Start']"
                    :placeholder="field.key === 'secondExtCode' ? '起始（默认1）' : '起始（默认0）'"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    :min="field.key === 'secondExtCode' ? 1 : 0"
                    max="9999"
                    @change="onExtendNumberChange(field.key)"
                    @input="limitStartInput($event, field.key)"
                    style="width: 48%"
                  />
                  <el-input
                    v-model="conditions[field.key + 'Count']"
                    placeholder="数量（默认1）"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    min="1"
                    max="99"
                    @change="onExtendNumberChange(field.key)"
                    @input="limitCountInput($event, field.key)"
                    style="width: 48%"
                  />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="condition-actions">
        <el-button type="primary" :disabled="!canGenerate" @click="handleGenerate">
          生成编码
        </el-button>
        <el-button @click="handleClear">清空条件</el-button>
        <span v-if="canGenerate && expectedCodeCount > 1" class="expected-count">
          预计生成 {{ expectedCodeCount }} 个编码
        </span>
      </div>
    </el-card>

    <!-- 编码结果展示区 -->
    <el-card class="result-card">
      <template #header>
        <div class="result-header">
          <span>编码结果</span>
          <div>
            <el-button
              size="small"
              :disabled="generatedCodes.length === 0"
              @click="handleSaveDraft"
            >
              保存至临时区
            </el-button>
            <el-button size="small" :disabled="draftCodes.length === 0" @click="handleExport">
              批量导出
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 本次生成标签页 -->
        <el-tab-pane label="本次生成" name="generated">
          <el-table :data="generatedCodes" border stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="code" label="编码" width="320" />
            <el-table-column prop="name" label="编码名称" min-width="200" />
            <el-table-column prop="generateTime" label="生成时间" width="180" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="copyCode(row.code)">复制</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="generatedCodes.length === 0" description="暂无生成记录" />
        </el-tab-pane>

        <!-- 临时区标签页 -->
        <el-tab-pane label="临时区" name="draft">
          <div v-if="draftCodes.length > 0" class="draft-actions">
            <span class="draft-total">共 {{ draftCodes.length }} 条</span>
            <span class="range-selector">
              <el-input-number
                v-model="rangeStart"
                :min="1"
                :max="draftCodes.length"
                size="small"
                controls-position="right"
                placeholder="起始行"
                style="width: 100px"
              />
              <span class="range-separator">~</span>
              <el-input-number
                v-model="rangeEnd"
                :min="1"
                :max="draftCodes.length"
                size="small"
                controls-position="right"
                placeholder="结束行"
                style="width: 100px"
              />
              <el-button size="small" @click="selectRange">选中范围</el-button>
              <el-button size="small" @click="clearSelection">取消选中</el-button>
            </span>
            <el-button size="small" @click="copySelected">复制选中</el-button>
            <el-button size="small" @click="deleteSelected">删除选中</el-button>
          </div>
          <el-table
            ref="draftTableRef"
            :data="draftCodes"
            border
            stripe
            style="width: 100%"
            @selection-change="onSelectionChange"
            :row-class-name="draftRowClassName"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="code" label="编码" width="320" />
            <el-table-column prop="name" label="编码名称" min-width="200" />
            <el-table-column prop="generateTime" label="生成时间" width="180" />
            <el-table-column label="批次" width="120">
              <template #default="{ row }">
                <el-tag :type="getBatchTagType(row.batchNo)" size="small" effect="plain">
                  第{{ row.batchNo }}批
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="draftCodes.length === 0" description="临时区暂无数据" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import * as dictService from '@/services/dict';
import * as codeService from '@/services/code-generation';
import { generateCodeRequestSchema } from '@cec/contracts';

interface ConditionField {
  key: string;
  label: string;
  required: boolean;
  disabled: (conds: Record<string, string>) => boolean;
  type?: 'select' | 'input' | 'extend-input' | 'extend-number'; // 字段类型：下拉选择、输入框、扩展输入框、扩展数字输入框
  quickOptions?: string[]; // 快捷选择项
}

const conditionFields: ConditionField[] = [
  { key: 'stationCode', label: '场站', required: true, disabled: () => false, type: 'select' },
  { key: 'typeCode', label: '类型', required: true, disabled: () => false, type: 'select' },
  { key: 'projectLineCode', label: '项目期号&并网线路', required: true, disabled: () => false, type: 'input', quickOptions: ['111', '112', '121', '122'] },
  { key: 'prefixNo', label: '前缀号', required: true, disabled: () => false, type: 'select' },
  { key: 'firstClassCode', label: '一级类码', required: true, disabled: () => false, type: 'select' },
  { key: 'secondClassCode', label: '二级类码', required: true, disabled: (c) => !c.firstClassCode, type: 'select' },
  { key: 'secondExtCode', label: '二级类扩展码', required: true, disabled: (c) => !c.secondClassCode, type: 'extend-number' },
  { key: 'thirdClassCode', label: '三级类码', required: true, disabled: (c) => !c.secondClassCode, type: 'select' },
  { key: 'thirdExtCode', label: '三级类扩展码', required: true, disabled: (c) => !c.thirdClassCode, type: 'extend-number' },
  { key: 'dataTypeCode', label: '数据类码', required: false, disabled: (c) => !c.secondClassCode, type: 'select' },
  { key: 'dataCode', label: '数据码', required: false, disabled: (c) => !c.dataTypeCode, type: 'select' },
];

const conditions = reactive<Record<string, string>>({});
const dictOptions = reactive<Record<string, Array<{ code: string; name: string }>>>({});
const generatedCodes = ref<Array<{ code: string; name: string; generateTime: string }>>([]);
const draftCodes = ref<Array<{ code: string; name: string; generateTime: string; batchNo: string }>>([]);
const selectedDraftIds = ref<number[]>([]);
const activeTab = ref('generated');
const draftTableRef = ref<any>(null);
const rangeStart = ref(1);
const rangeEnd = ref(1);

const canGenerate = computed(() => {
  return conditionFields.every((field) => {
    if (!field.required) return true;

    if (field.type === 'extend-number') {
      // 对于扩展数字字段，检查起始值是否已填写
      return !!conditions[field.key + 'Start'];
    } else {
      // 对于其他字段，检查字段值是否存在
      return !!conditions[field.key];
    }
  });
});

/** 解析扩展格式，如"5,3"返回数量，如"0005"返回1 */
function parseExtendFormatCount(extendStr: string): number {
  if (!extendStr) return 0;

  // 如果是标准的4位编码，直接返回1
  if (/^\d{4}$/.test(extendStr)) {
    return 1;
  }

  // 尝试解析"从X开始拓展X条"格式，如"5,3"
  const match = extendStr.match(/^(\d+)\s*,\s*(\d+)$/);
  if (match) {
    const count = parseInt(match[2], 10);
    return Math.max(1, count);
  }

  // 默认返回1
  return 1;
}

/** 预计生成的编码数量 */
const expectedCodeCount = computed(() => {
  // 获取二级类扩展码字符串
  let secondExtStr = '';
  if (conditions.secondExtCodeStart && conditions.secondExtCodeCount) {
    secondExtStr = `${conditions.secondExtCodeStart},${conditions.secondExtCodeCount}`;
  } else if (conditions.secondExtCodeStart) {
    secondExtStr = conditions.secondExtCodeStart.toString().padStart(4, '0');
  }

  // 获取三级类扩展码字符串
  let thirdExtStr = '';
  if (conditions.thirdExtCodeStart && conditions.thirdExtCodeCount) {
    thirdExtStr = `${conditions.thirdExtCodeStart},${conditions.thirdExtCodeCount}`;
  } else if (conditions.thirdExtCodeStart) {
    thirdExtStr = conditions.thirdExtCodeStart.toString().padStart(4, '0');
  }

  const secondCount = parseExtendFormatCount(secondExtStr);
  const thirdCount = parseExtendFormatCount(thirdExtStr);

  return secondCount * thirdCount;
});

// 初始化加载顶级字典
onMounted(async () => {
  try {
    const [stations, types, prefixes, firstClass] = await Promise.all([
      dictService.getDictItems('station'),
      dictService.getDictItems('type'),
      dictService.getDictItems('prefix'),
      dictService.getCascadedDictItems(''),
    ]);
    dictOptions['stationCode'] = stations;
    dictOptions['typeCode'] = types;
    dictOptions['prefixNo'] = prefixes;
    dictOptions['firstClassCode'] = firstClass;
    dictOptions['dataTypeCode'] = []; // 数据类码需要根据类型和二级类码加载，初始化为空

    // 设置默认值
    // 前缀号默认"内部数据"（编码为0）
    const internalDataPrefix = prefixes.find(p => p.name === '内部数据');
    if (internalDataPrefix) {
      conditions.prefixNo = internalDataPrefix.code;
    }

    // 一级类码默认"生产运行"（编码为B1）
    const productionOperation = firstClass.find(f => f.name === '生产运行');
    if (productionOperation) {
      conditions.firstClassCode = productionOperation.code;
    }

    // 项目期号&并网线路默认"111"
    conditions.projectLineCode = '111';

    // 设置扩展码默认值
    // 二级类扩展码：起始默认1，数量默认1
    conditions.secondExtCodeStart = '1';
    conditions.secondExtCodeCount = '1';

    // 三级类扩展码：起始默认0，数量默认1
    conditions.thirdExtCodeStart = '0';
    conditions.thirdExtCodeCount = '1';
  } catch (err: any) {
    ElMessage.error('筛选条件加载失败，请刷新重试');
  }
});

// 条件变更联动
async function onConditionChange(key: string) {
  const cascadeMap: Record<string, string> = {
    firstClassCode: 'secondClassCode',
    secondClassCode: 'thirdClassCode', // 二级类码变更时清空三级类码
    dataTypeCode: 'dataCode',
  };

  const nextKey = cascadeMap[key];
  if (nextKey) {
    conditions[nextKey] = '';
    dictOptions[nextKey] = [];
  }

  // 类型代码变更时，重新加载二级类码（根据新类型）
  if (key === 'typeCode') {
    // 预加载二级类码列表（根据类型）
    try {
      const secondClassItems = await dictService.getSecondClassByType(conditions[key]);
      dictOptions['secondClassCode'] = secondClassItems;
      // 如果当前有二级类码选择，清空它（因为类型变了）
      if (conditions.secondClassCode) {
        conditions.secondClassCode = '';
        conditions.secondExtCode = '';
        conditions.thirdClassCode = '';
        conditions.thirdExtCode = '';
        dictOptions['thirdClassCode'] = [];
      }
      // 清空数据类码和数据码
      dictOptions['dataTypeCode'] = [];
      dictOptions['dataCode'] = [];
      conditions.dataTypeCode = '';
      conditions.dataCode = '';
    } catch {}
    // 清空已生成的编码
    if (generatedCodes.value.length > 0) {
      generatedCodes.value = [];
    }
    return;
  }

  if (key === 'secondClassCode' && conditions[key]) {
    try {
      // 根据类型和二级类码获取数据类码
      if (conditions.typeCode && conditions[key]) {
        const dataTypes = await dictService.getDataTypeBySecondClass(conditions.typeCode, conditions[key]);
        dictOptions['dataTypeCode'] = dataTypes;
      } else {
        dictOptions['dataTypeCode'] = [];
      }
    } catch {}
  }

  if (key === 'dataTypeCode' && conditions[key]) {
    try {
      const dataCodes = await dictService.getDataCodes(conditions[key], conditions.secondClassCode, conditions.typeCode);
      dictOptions['dataCode'] = dataCodes;
    } catch {}
  }

  // 联动加载子级字典
  if (['firstClassCode', 'secondClassCode', 'thirdClassCode'].includes(key) && conditions[key]) {
    try {
      if (key === 'firstClassCode') {
        // 根据类型获取二级类码
        if (conditions.typeCode) {
          const secondClassItems = await dictService.getSecondClassByType(conditions.typeCode);
          dictOptions['secondClassCode'] = secondClassItems;
          // 如果当前选择的二级类码不在新列表中，清空它（虽然cascadeMap已清空，但为了安全）
          const currentSecondClass = conditions.secondClassCode;
          if (currentSecondClass && !secondClassItems.find(item => item.code === currentSecondClass)) {
            conditions.secondClassCode = '';
            conditions.secondExtCode = '';
            conditions.thirdClassCode = '';
            conditions.thirdExtCode = '';
            dictOptions['thirdClassCode'] = [];
          }
        } else {
          // 类型未选择，清空二级类码列表
          dictOptions['secondClassCode'] = [];
          conditions.secondClassCode = '';
          conditions.secondExtCode = '';
          conditions.thirdClassCode = '';
          conditions.thirdExtCode = '';
          dictOptions['thirdClassCode'] = [];
        }
      } else if (key === 'secondClassCode') {
        // 查询三级类码，使用二级类码作为parentCode，类型代码作为typeCode参数
        const items = await dictService.getCascadedDictItems(conditions[key], conditions.typeCode);
        dictOptions['thirdClassCode'] = items;
      } else if (key === 'thirdClassCode') {
        // 三级类码变化时，没有后续级联
      }
    } catch {}
  }

  // 清空已生成的编码
  if (generatedCodes.value.length > 0) {
    generatedCodes.value = [];
  }
}

/** 限制起始输入：最多4位数字，按类型限制最小值 */
function limitStartInput(value: string, key: string) {
  // 去除非数字字符
  const cleaned = value.replace(/\D/g, '');
  // 最多4位
  const truncated = cleaned.slice(0, 4);
  conditions[key + 'Start'] = truncated;
}

/** 限制数量输入：最多2位数字，最大值99 */
function limitCountInput(value: string, key: string) {
  // 去除非数字字符
  const cleaned = value.replace(/\D/g, '');
  // 最多2位
  const truncated = cleaned.slice(0, 2);
  // 超过99则截断为99
  const num = parseInt(truncated, 10);
  if (!isNaN(num) && num > 99) {
    conditions[key + 'Count'] = '99';
  } else {
    conditions[key + 'Count'] = truncated;
  }
}

// 扩展数字输入框变化处理
function onExtendNumberChange(key: string) {
  // 扩展码不与其他筛选条件联动，只清空已生成的编码
  if (generatedCodes.value.length > 0) {
    generatedCodes.value = [];
  }
}

async function handleGenerate() {
  try {
    // 组合扩展码：将起始值和数量组合成"5,3"格式
    const processedConditions = { ...conditions };

    // 处理二级类扩展码
    if (conditions.secondExtCodeStart && conditions.secondExtCodeCount) {
      processedConditions.secondExtCode = `${conditions.secondExtCodeStart},${conditions.secondExtCodeCount}`;
    } else if (conditions.secondExtCodeStart) {
      processedConditions.secondExtCode = conditions.secondExtCodeStart.toString().padStart(4, '0');
    }

    // 处理三级类扩展码
    if (conditions.thirdExtCodeStart && conditions.thirdExtCodeCount) {
      processedConditions.thirdExtCode = `${conditions.thirdExtCodeStart},${conditions.thirdExtCodeCount}`;
    } else if (conditions.thirdExtCodeStart) {
      processedConditions.thirdExtCode = conditions.thirdExtCodeStart.toString().padStart(4, '0');
    }

    // 删除扩展数字字段的原始Start/Count属性，避免schema验证问题
    delete processedConditions.secondExtCodeStart;
    delete processedConditions.secondExtCodeCount;
    delete processedConditions.thirdExtCodeStart;
    delete processedConditions.thirdExtCodeCount;

    const parsed = generateCodeRequestSchema.parse(processedConditions);
    const result = await codeService.generateCode(parsed as any);

    // 处理返回结果：可能是单个对象或数组
    if (Array.isArray(result)) {
      generatedCodes.value = result;
    } else if (result && typeof result === 'object') {
      generatedCodes.value = [result];
    } else {
      // 如果返回格式不符合预期，尝试从批量响应中提取
      if (result && result.codes && Array.isArray(result.codes)) {
        generatedCodes.value = result.codes;
      } else {
        throw new Error('生成编码返回格式错误');
      }
    }

    // 显示生成数量提示
    if (generatedCodes.value.length > 1) {
      ElMessage.success(`成功生成 ${generatedCodes.value.length} 个编码`);
    }

    activeTab.value = 'generated';
  } catch (err: any) {
    ElMessage.error(err.message || '生成编码失败');
  }
}

function handleClear() {
  // 清空所有条件
  Object.keys(conditions).forEach((k) => (conditions[k] = ''));

  // 重置前缀号为默认值（内部数据）
  const internalDataPrefix = dictOptions['prefixNo']?.find(p => p.name === '内部数据');
  if (internalDataPrefix) {
    conditions.prefixNo = internalDataPrefix.code;
  }

  // 重置一级类码为默认值（生产运行）
  const productionOperation = dictOptions['firstClassCode']?.find(f => f.name === '生产运行');
  if (productionOperation) {
    conditions.firstClassCode = productionOperation.code;
  }

  // 重置扩展码默认值
  conditions.secondExtCodeStart = '1';
  conditions.secondExtCodeCount = '1';
  conditions.thirdExtCodeStart = '0';
  conditions.thirdExtCodeCount = '1';

  generatedCodes.value = [];
  draftCodes.value = [];
}

async function handleSaveDraft() {
  try {
    const result = await codeService.saveToDraft({ codes: generatedCodes.value });
    ElMessage.success(`已保存 ${result.savedCount} 条`);
    // 刷新临时区
    const draftList = await codeService.getDraftList(1, 5000);
    draftCodes.value = draftList.list;
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败');
  }
}

function onSelectionChange(rows: any[]) {
  selectedDraftIds.value = rows.map((r) => r.id);
}

/** 按行号范围选中临时区中的行（追加选中，不影响已有选中） */
function selectRange() {
  const start = Math.max(1, Math.min(rangeStart.value, rangeEnd.value));
  const end = Math.min(draftCodes.value.length, Math.max(rangeStart.value, rangeEnd.value));

  for (let i = start - 1; i < end; i++) {
    draftTableRef.value?.toggleRowSelection(draftCodes.value[i], true);
  }
}

/** 取消指定范围行的选中 */
function clearSelection() {
  const start = Math.max(1, Math.min(rangeStart.value, rangeEnd.value));
  const end = Math.min(draftCodes.value.length, Math.max(rangeStart.value, rangeEnd.value));

  for (let i = start - 1; i < end; i++) {
    draftTableRef.value?.toggleRowSelection(draftCodes.value[i], false);
  }
}

/** 批次对应的背景色（按批次索引循环） */
const BATCH_COLORS = [
  '#ecf5ff', // 淡蓝
  '#f0f9eb', // 淡绿
  '#fdf6ec', // 淡橙
  '#fef0f0', // 淡红
  '#f5f7fa', // 淡灰
  '#e8f4f8', // 青
  '#f3e8ff', // 紫
  '#fff7e6', // 米黄
];

/** 根据批次号返回行样式名 */
function draftRowClassName({ row }: { row: { batchNo: string } }) {
  const index = (parseInt(row.batchNo, 10) - 1) % BATCH_COLORS.length;
  return `draft-row-batch-${index}`;
}

/** 根据批次号返回 el-tag 类型 */
function getBatchTagType(batchNo: string) {
  const index = (parseInt(batchNo, 10) - 1) % 4;
  const types = ['primary', 'success', 'warning', 'danger'] as const;
  return types[index];
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败，请手动选择复制'),
  );
}

function copySelected() {
  if (selectedDraftIds.value.length === 0) {
    ElMessage.warning('请先选择要复制的编码');
    return;
  }
  const codes = draftCodes.value
    .filter((d) => selectedDraftIds.value.includes(d.id))
    .map((d) => d.code)
    .join('\n');
  navigator.clipboard.writeText(codes).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败，请手动选择复制'),
  );
}

async function deleteSelected() {
  if (selectedDraftIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的编码');
    return;
  }
  try {
    await codeService.batchDeleteDraft(selectedDraftIds.value);
    ElMessage.success('删除成功');
    const draftList = await codeService.getDraftList(1, 5000);
    draftCodes.value = draftList.list;
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败');
  }
}

async function handleExport() {
  ElMessage.success('导出任务已创建');
}
</script>

<style scoped>
.code-generate {
  max-width: 1400px;
  margin: 0 auto;
}

.condition-card {
  margin-bottom: 20px;
}

.condition-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.draft-actions {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.draft-total {
  font-size: 14px;
  color: #606266;
}

.range-selector {
  display: flex;
  align-items: center;
  gap: 4px;
}

.range-separator {
  color: #909399;
  font-size: 14px;
}

.input-with-quick-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.quick-option-tag {
  cursor: pointer;
  user-select: none;
}

.quick-option-tag:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

.extend-number-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extend-number-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expected-count {
  margin-left: 12px;
  font-size: 14px;
  color: #67c23a;
  display: flex;
  align-items: center;
}

/* 临时区批次行颜色 */
.draft-row-batch-0 { background-color: #ecf5ff; }
.draft-row-batch-1 { background-color: #f0f9eb; }
.draft-row-batch-2 { background-color: #fdf6ec; }
.draft-row-batch-3 { background-color: #fef0f0; }
.draft-row-batch-4 { background-color: #f5f7fa; }
.draft-row-batch-5 { background-color: #e8f4f8; }
.draft-row-batch-6 { background-color: #f3e8ff; }
.draft-row-batch-7 { background-color: #fff7e6; }
</style>
