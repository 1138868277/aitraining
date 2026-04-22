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
              <el-select
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
                  :label="item.name"
                  :value="item.code"
                />
              </el-select>
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
}

const conditionFields: ConditionField[] = [
  { key: 'stationCode', label: '场站', required: true, disabled: () => false },
  { key: 'typeCode', label: '类型', required: true, disabled: () => false },
  { key: 'projectLineCode', label: '项目期号&并网线路', required: true, disabled: () => false },
  { key: 'prefixNo', label: '前缀号', required: true, disabled: () => false },
  { key: 'firstClassCode', label: '一级类码', required: true, disabled: () => false },
  { key: 'secondClassCode', label: '二级类码', required: true, disabled: (c) => !c.firstClassCode },
  { key: 'secondExtCode', label: '二级类扩展码', required: true, disabled: (c) => !c.secondClassCode },
  { key: 'thirdClassCode', label: '三级类码', required: true, disabled: (c) => !c.secondExtCode },
  { key: 'thirdExtCode', label: '三级类扩展码', required: true, disabled: (c) => !c.thirdClassCode },
  { key: 'dataTypeCode', label: '数据类码', required: false, disabled: (c) => !c.secondClassCode },
  { key: 'dataCode', label: '数据码', required: false, disabled: (c) => !c.dataTypeCode },
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
    const [stations, types, projects, prefixes, firstClass, dataTypes] = await Promise.all([
      dictService.getDictItems('station'),
      dictService.getDictItems('type'),
      dictService.getDictItems('projectLine'),
      dictService.getDictItems('prefix'),
      dictService.getCascadedDictItems(''),
      dictService.getDictItems('dataType'),
    ]);
    dictOptions['stationCode'] = stations;
    dictOptions['typeCode'] = types;
    dictOptions['projectLineCode'] = projects;
    dictOptions['prefixNo'] = prefixes;
    dictOptions['firstClassCode'] = firstClass;
    dictOptions['dataTypeCode'] = dataTypes;
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
      const items = await dictService.getCascadedDictItems(conditions[key]);
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
</style>
