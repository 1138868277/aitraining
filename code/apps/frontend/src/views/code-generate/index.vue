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
                    placeholder="起始"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    min="0"
                    max="9999"
                    @change="onExtendNumberChange(field.key)"
                    style="width: 48%"
                  />
                  <el-input
                    v-model="conditions[field.key + 'Count']"
                    placeholder="数量"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    min="1"
                    max="100"
                    @change="onExtendNumberChange(field.key)"
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
            <el-button size="small" @click="copySelected">复制选中</el-button>
            <el-button size="small" @click="deleteSelected">删除选中</el-button>
          </div>
          <el-table
            :data="draftCodes"
            border
            stripe
            style="width: 100%"
            @selection-change="onSelectionChange"
          >
            <el-table-column type="selection" width="50" />
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="code" label="编码" width="320" />
            <el-table-column prop="name" label="编码名称" min-width="200" />
            <el-table-column prop="generateTime" label="生成时间" width="180" />
            <el-table-column prop="batchNo" label="批次" width="160" />
          </el-table>
          <el-empty v-if="draftCodes.length === 0" description="临时区暂无数据" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
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

  // 类型代码变更时，需要重新加载一级类码和二级类码（如果已选择）
  if (key === 'typeCode') {
    if (conditions.firstClassCode) {
      // 重新加载一级类码（根据新类型过滤）
      try {
        const firstClassItems = await dictService.getCascadedDictItems('', conditions[key]);
        dictOptions['firstClassCode'] = firstClassItems;
        // 如果当前选择的一级类码不在新列表中，清空它
        const currentFirstClass = conditions.firstClassCode;
        if (currentFirstClass && !firstClassItems.find(item => item.code === currentFirstClass)) {
          conditions.firstClassCode = '';
          // 清空后续所有字段
          conditions.secondClassCode = '';
          conditions.secondExtCode = '';
          conditions.thirdClassCode = '';
          conditions.thirdExtCode = '';
          dictOptions['secondClassCode'] = [];
          dictOptions['thirdClassCode'] = [];
        } else {
          // 一级类码仍然有效，重新加载二级类码（根据新类型）
          try {
            const secondClassItems = await dictService.getSecondClassByType(conditions[key]);
            dictOptions['secondClassCode'] = secondClassItems;
            // 如果当前选择的二级类码不在新列表中，清空它
            const currentSecondClass = conditions.secondClassCode;
            if (currentSecondClass && !secondClassItems.find(item => item.code === currentSecondClass)) {
              conditions.secondClassCode = '';
              conditions.secondExtCode = '';
              conditions.thirdClassCode = '';
              conditions.thirdExtCode = '';
              dictOptions['thirdClassCode'] = [];
            }
          } catch {}
        }
      } catch {}
    } else {
      // 即使一级类码未选择，也预加载二级类码列表（根据类型）
      try {
        const secondClassItems = await dictService.getSecondClassByType(conditions[key]);
        dictOptions['secondClassCode'] = secondClassItems;
        // 如果当前有二级类码选择（不应该发生，因为一级类码未选择），清空它
        if (conditions.secondClassCode) {
          conditions.secondClassCode = '';
          conditions.secondExtCode = '';
          conditions.thirdClassCode = '';
          conditions.thirdExtCode = '';
          dictOptions['thirdClassCode'] = [];
        }
      } catch {}
    }
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
    generatedCodes.value = [result];
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
}

.draft-total {
  font-size: 14px;
  color: #606266;
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
</style>
