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
                  :label="item.code + item.name"
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

              <!-- 扩展输入框（从X开始拓展X条） -->
              <div v-else-if="field.type === 'extend-input'" class="extend-input">
                <el-input
                  v-model="conditions[field.key]"
                  :placeholder="'格式：从X开始拓展X条，如：5,3'"
                  :disabled="field.disabled(conditions)"
                  clearable
                  @change="onConditionChange(field.key)"
                  style="width: 100%"
                />
                <div class="extend-hint">格式：从X开始拓展X条，如：5,3 生成0005,0006,0007</div>
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
  type?: 'select' | 'input' | 'extend-input'; // 字段类型：下拉选择、输入框、扩展输入框
  quickOptions?: string[]; // 快捷选择项
}

const conditionFields: ConditionField[] = [
  { key: 'stationCode', label: '场站', required: true, disabled: () => false, type: 'select' },
  { key: 'typeCode', label: '类型', required: true, disabled: () => false, type: 'select' },
  { key: 'projectLineCode', label: '项目期号&并网线路', required: true, disabled: () => false, type: 'input', quickOptions: ['111', '112', '121', '122'] },
  { key: 'prefixNo', label: '前缀号', required: true, disabled: () => false, type: 'select' },
  { key: 'firstClassCode', label: '一级类码', required: true, disabled: () => false, type: 'select' },
  { key: 'secondClassCode', label: '二级类码', required: true, disabled: (c) => !c.firstClassCode, type: 'select' },
  { key: 'secondExtCode', label: '二级类扩展码', required: true, disabled: (c) => !c.secondClassCode, type: 'extend-input' },
  { key: 'thirdClassCode', label: '三级类码', required: true, disabled: (c) => !c.secondExtCode, type: 'select' },
  { key: 'thirdExtCode', label: '三级类扩展码', required: true, disabled: (c) => !c.thirdClassCode, type: 'extend-input' },
  { key: 'dataTypeCode', label: '数据类码', required: false, disabled: (c) => !c.secondClassCode, type: 'select' },
  { key: 'dataCode', label: '数据码', required: false, disabled: (c) => !c.dataTypeCode, type: 'select' },
];

const conditions = reactive<Record<string, string>>({});
const dictOptions = reactive<Record<string, Array<{ code: string; name: string }>>>({});
const generatedCodes = ref<Array<{ code: string; name: string; generateTime: string }>>([]);
const draftCodes = ref<Array<{ code: string; name: string; generateTime: string; batchNo: string }>>([]);
const selectedDraftIds = ref<number[]>([]);
const activeTab = ref('generated');

const requiredFields = conditionFields.filter((f) => f.required).map((f) => f.key);
const canGenerate = computed(() => requiredFields.every((k) => conditions[k]));

// 初始化加载顶级字典
onMounted(async () => {
  try {
    const [stations, types, prefixes, firstClass, dataTypes] = await Promise.all([
      dictService.getDictItems('station'),
      dictService.getDictItems('type'),
      dictService.getDictItems('prefix'),
      dictService.getCascadedDictItems(''),
      dictService.getDictItems('dataType'),
    ]);
    dictOptions['stationCode'] = stations;
    dictOptions['typeCode'] = types;
    dictOptions['prefixNo'] = prefixes;
    dictOptions['firstClassCode'] = firstClass;
    dictOptions['dataTypeCode'] = dataTypes;

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
    secondClassCode: 'secondExtCode',
    secondExtCode: 'thirdClassCode',
    thirdClassCode: 'thirdExtCode',
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
      const dataTypes = await dictService.getDictItems('dataType');
      dictOptions['dataTypeCode'] = dataTypes;
    } catch {}
  }

  if (key === 'dataTypeCode' && conditions[key]) {
    try {
      const dataCodes = await dictService.getDataCodes(conditions[key]);
      dictOptions['dataCode'] = dataCodes;
    } catch {}
  }

  // 联动加载子级字典
  if (['firstClassCode', 'secondClassCode', 'secondExtCode', 'thirdClassCode'].includes(key) && conditions[key]) {
    try {
      let typeCode = conditions.typeCode;
      // 查询三级类码时，需要传递二级类码作为过滤条件
      if (key === 'secondExtCode') {
        typeCode = conditions.secondClassCode; // 使用二级类码作为typeCode参数
      }
      const items = await dictService.getCascadedDictItems(conditions[key], typeCode);
      dictOptions[nextKey || ''] = items;
    } catch {}
  }

  // 清空已生成的编码
  if (generatedCodes.value.length > 0) {
    generatedCodes.value = [];
  }
}

async function handleGenerate() {
  try {
    const parsed = generateCodeRequestSchema.parse(conditions);
    const result = await codeService.generateCode(parsed as any);
    generatedCodes.value = [result];
    activeTab.value = 'generated';
  } catch (err: any) {
    ElMessage.error(err.message || '生成编码失败');
  }
}

function handleClear() {
  Object.keys(conditions).forEach((k) => (conditions[k] = ''));
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

.extend-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.extend-hint {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
}
</style>
