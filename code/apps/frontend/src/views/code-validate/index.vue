<template>
  <div class="code-validate">
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab 1: 字典查询 -->
        <el-tab-pane label="字典查询" name="dictTree">
          <div class="tree-container">
            <div class="tree-toolbar">
              <el-input
                v-model="treeFilterText"
                placeholder="搜索节点..."
                clearable
                class="tree-filter-input"
              />
              <el-button size="default" @click="onCollapseAll">收起所有</el-button>
            </div>
            <el-tree
              ref="treeRef"
              :data="dictTreeData"
              :props="treeProps"
              :filter-node-method="filterTreeNode"
              v-loading="loadingTree"
              element-loading-text="字典数据加载中..."
              highlight-current
              @node-click="onTreeNodeClick"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span class="tree-node-label">
                    <el-tag
                      :type="typeTagType(data.type)"
                      size="small"
                      class="type-tag"
                    >{{ typeLabel(data.type) }}</el-tag>
                    <span :class="['tree-node-code', typeCodeClass(data.type)]">{{ data.code }}</span>
                    <span class="tree-node-name">{{ data.name }}</span>
                  </span>
                  <span class="tree-node-meta">
                    <el-tag
                      v-if="data.type === 'dataCode' && data.isManual === '1'"
                      size="small"
                      type="warning"
                      class="source-tag"
                    >手动添加</el-tag>
                    <el-tag
                      v-else-if="data.type === 'dataCode' && data.isManual === '0'"
                      size="small"
                      type="info"
                      class="source-tag"
                    >集团统一</el-tag>
                    <span
                      v-if="data.childCount !== undefined"
                      class="child-count"
                    >{{ data.childCount }} 项</span>
                  </span>
                </span>
              </template>
            </el-tree>
            <el-empty v-if="!loadingTree && dictTreeData.length === 0" description="暂无字典数据" />
          </div>
        </el-tab-pane>

        <!-- Tab 2: 字典统计 -->
        <el-tab-pane label="字典统计" name="statistics">
          <div class="statistics-header">
            <div class="statistics-left">
              <span class="statistics-title">手动添加编码记录</span>
              <el-select
                v-model="statsSecondClassFilter"
                placeholder="二级类码筛选"
                clearable
                size="small"
                style="width: 200px"
                @change="onStatsFilterChange"
              >
                <el-option
                  v-for="item in secondClassOptions"
                  :key="item.code"
                  :label="item.code + ' ' + item.name"
                  :value="item.code"
                />
              </el-select>
            </div>
            <el-button
              v-if="manualStats.length > 0"
              size="small"
              type="primary"
              @click="handleExportStats"
            >导出Excel</el-button>
          </div>
          <el-table
            :data="manualStats"
            border
            stripe
            style="width: 100%"
            v-loading="loadingStats"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="二级类码" width="390">
              <template #default="{ row }">
                <span class="code-second-class">{{ row.secondClassCode }}</span> <span class="name-muted">{{ row.secondClassName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据类码">
              <template #default="{ row }">
                <span class="code-data-category">{{ row.dataCategoryCode }}</span> <span class="name-muted">{{ row.dataCategoryName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据码">
              <template #default="{ row }">
                <span class="code-data-code">{{ row.dataCode }}</span> <span class="name-muted">{{ row.dataName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="增加时间" width="248">
              <template #default="{ row }">
                {{ formatTime(row.createTm) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingStats && manualStats.length === 0" description="暂无手动添加记录" />
          <div v-if="statsTotal > 0" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="statsPageNum"
              v-model:page-size="statsPageSize"
              :total="statsTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @current-change="loadManualStats"
              @size-change="loadManualStats"
            />
          </div>
        </el-tab-pane>

        <!-- Tab 3: 编码校验 -->
        <el-tab-pane label="编码校验" name="validate">
          <!-- 输入区域 -->
          <el-card shadow="never" class="input-section">
            <el-tabs v-model="inputMode">
              <el-tab-pane label="批量粘贴" name="paste">
                <el-input
                  v-model="batchInput"
                  type="textarea"
                  :rows="6"
                  class="paste-textarea"
                  placeholder="请粘贴编码列表，每行一条：编码 名称（编码和名称之间用空格或Tab分隔）"
                />
                <div class="input-hint">已解析 {{ inputMode === 'paste' ? pasteCodes.length : parsedCodes.length }} 条编码</div>
              </el-tab-pane>
              <el-tab-pane label="上传Excel" name="excel">
                <el-upload
                  drag
                  action="#"
                  accept=".xlsx,.xls"
                  :auto-upload="false"
                  :on-change="handleFileUpload"
                  :on-exceed="handleUploadExceed"
                  :limit="1"
                  :file-list="uploadFileList"
                >
                  <template #default>
                    <template v-if="uploadFileList.length === 0">
                      <el-icon class="el-icon--upload">
                        <svg viewBox="0 0 1024 1024" width="40" height="40" fill="#909399">
                          <path d="M544 864V288h-64v576H352l160 160 160-160z"/>
                          <path d="M128 128h768v128H128z"/>
                        </svg>
                      </el-icon>
                      <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
                    </template>
                    <template v-else>
                      <div class="excel-file-display">
                        <svg viewBox="0 0 1024 1024" width="64" height="64" fill="#67c23a">
                          <path d="M854.6 288.7L639.4 73.4c-6-6-14.2-9.4-22.7-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.6-9.4-22.6zM790.2 326H602V137.8L790.2 326zM840 896H184V96h368v232c0 17.7 14.3 32 32 32h232v536h24zM421.1 476.4l-42.4 86.1-42.4-86.1h-39.9l60.9 124.3-67.6 132.3h40.6l45.5-93.8 45.5 93.8h41.5l-67.2-131.6 59.1-124.9zM544 599.8h72.3v-39.9H544v-45.6h82.4v-40.4H503.6V733h41.4l0.3-133.2h-0.6z"/>
                        </svg>
                        <div class="excel-file-name">{{ uploadFileList[0]?.name }}</div>
                        <div class="excel-file-size">{{ formatFileSize(uploadFileList[0]?.size) }}</div>
                      </div>
                    </template>
                  </template>
                  <template #tip>
                    <div class="el-upload__tip">支持 .xlsx/.xls 文件，请确保包含"测点编码"和"测点描述"列</div>
                  </template>
                </el-upload>
              </el-tab-pane>
            </el-tabs>
            <div class="validate-actions">
              <el-button
                type="primary"
                :disabled="!hasCodes || resolvingCodes"
                @click="handleResolveCodes"
              >{{ resolvingCodes ? '解析中...' : '开始校验' }}</el-button>
              <el-button :disabled="!hasCodes" @click="clearCodes">清空</el-button>
            </div>
          </el-card>

          <!-- 校验结果 -->
          <div v-if="resolvedItems.length > 0" class="result-section">
            <div class="result-header">
              <span>校验结果（共 {{ resolvedItems.length }} 组去重编码）</span>
            </div>
            <el-table
              :data="resolvedItems"
              border
              stripe
              style="width: 100%"
              row-key="rowKey"
            >
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="expanded-codes">
                    <div class="expanded-title">测点编码列表：</div>
                    <el-table :data="row.matchedCodes" size="small" border>
                      <el-table-column type="index" label="序号" width="60" />
                      <el-table-column prop="code" label="测点编码" width="320" />
                      <el-table-column prop="name" label="编码名称" min-width="200" />
                    </el-table>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="210">
                <template #default="{ row }">
                  <span class="code-val">{{ row.typeCode }}</span>
                  <span :class="row.typeName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.typeName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="二级类码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.secondClassCode }}</span>
                  <span :class="row.secondClassName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.secondClassName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.dataCategoryCode }}</span>
                  <span :class="row.dataCategoryName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.dataCategoryName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.dataCode }}</span>
                  <span :class="row.dataName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.dataName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <template v-if="processedKeys.has((row as any).rowKey)">
                    <span class="processed-tag">已处理</span>
                  </template>
                  <template v-else-if="row.typeName !== '未识别' && row.secondClassName !== '未识别' && row.dataCategoryName !== '未识别' && row.dataName !== '未识别'">
                    <span class="processed-tag">已识别</span>
                  </template>
                  <template v-else>
                    <el-button link type="primary" size="small" @click="handleAddItem(row)">新增</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增编码字典" width="500px" @close="resetAddForm">
      <el-form label-width="100px" label-position="top">
        <el-form-item label="二级类码">
          <el-input :model-value="addTarget?.secondClassCode + ' ' + addTarget?.secondClassName" disabled />
        </el-form-item>
        <el-form-item label="数据类码">
          <el-input v-model="addForm.dataCategoryCode" placeholder="2位数字" maxlength="2" style="width: 80px" />
        </el-form-item>
        <el-form-item label="数据类名称">
          <el-input v-model="addForm.dataCategoryName" placeholder="输入数据类名称" />
        </el-form-item>
        <el-form-item label="数据码">
          <el-input v-model="addForm.dataCode" placeholder="3位数字" maxlength="3" style="width: 80px" />
        </el-form-item>
        <el-form-item label="数据名称">
          <el-input v-model="addForm.dataName" placeholder="输入数据名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addingCode" @click="confirmAddItem">确认新增</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import * as validateService from '@/services/validate';
import * as dictService from '@/services/dict';
import type { DictTreeNode, ManualStatItem, ResolvedCodeItem } from '@cec/contracts';

// ========== Tab Switching ==========
const route = useRoute();
const router = useRouter();
const activeTab = ref((route.query.tab as string) || 'dictTree');

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

// ========== Tab 1: 字典查询 ==========
const dictTreeData = ref<DictTreeNode[]>([]);
const loadingTree = ref(false);
const treeFilterText = ref('');
const treeRef = ref<any>(null);

const treeProps = {
  children: 'children',
  label: 'name',
};

const typeLabelMap: Record<string, string> = {
  typeDomain: '类型',
  secondClass: '二级类码',
  dataCategory: '数据类码',
  dataCode: '数据码',
};

function typeLabel(type: string): string {
  return typeLabelMap[type] || type;
}

const typeTagMap: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
  typeDomain: 'danger',
  secondClass: 'primary',
  dataCategory: 'success',
  dataCode: 'warning',
};

function typeTagType(type: string): 'primary' | 'success' | 'warning' | 'danger' | '' {
  return typeTagMap[type] || '';
}

function typeCodeClass(type: string): string {
  if (type === 'typeDomain') return 'code-type-domain';
  if (type === 'secondClass') return 'code-second-class';
  if (type === 'dataCategory') return 'code-data-category';
  if (type === 'dataCode') return 'code-data-code';
  return '';
}

function filterTreeNode(value: string, data: any): boolean {
  if (!value) return true;
  return data.name.includes(value) || data.code.includes(value);
}

function formatTime(tm: string): string {
  // ISO 字符串裁剪到秒: "2024-01-01T12:00:00.000Z" → "2024-01-01 12:00:00"
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

watch(treeFilterText, (val) => {
  treeRef.value?.filter(val);
});

async function loadDictTree() {
  loadingTree.value = true;
  try {
    dictTreeData.value = await validateService.getDictTree();
    await nextTick();
    // 展开第一层（类型域节点）
    const rootNodes = treeRef.value?.store?.root?.childNodes || [];
    for (const node of rootNodes) {
      node.expand();
    }
  } catch (err: any) {
    ElMessage.error('字典树加载失败');
  } finally {
    loadingTree.value = false;
  }
}

function onTreeNodeClick(data: any) {
  // 点击节点不做特殊处理
}

function onCollapseAll() {
  function collapseRecursive(nodes: any[]) {
    for (const node of nodes) {
      if (!node.isLeaf) {
        node.collapse();
        collapseRecursive(node.childNodes || []);
      }
    }
  }
  const rootNodes = treeRef.value?.store?.root?.childNodes || [];
  collapseRecursive(rootNodes);
  // 展开第一层（类型域节点）
  for (const node of rootNodes) {
    node.expand();
  }
}

// ========== Tab 2: 字典统计 ==========
const manualStats = ref<ManualStatItem[]>([]);
const loadingStats = ref(false);
const statsTotal = ref(0);
const statsPageNum = ref(1);
const statsPageSize = ref(20);
const statsSecondClassFilter = ref('');
const secondClassOptions = ref<Array<{ code: string; name: string }>>([]);

async function loadManualStats() {
  loadingStats.value = true;
  try {
    const filter = statsSecondClassFilter.value || undefined;
    const result = await validateService.getManualStatistics(statsPageNum.value, statsPageSize.value, filter);
    manualStats.value = result.items;
    statsTotal.value = result.total;
    secondClassOptions.value = result.secondClassOptions || [];
  } catch (err: any) {
    ElMessage.error('加载统计数据失败');
  } finally {
    loadingStats.value = false;
  }
}

function onStatsFilterChange() {
  statsPageNum.value = 1;
  loadManualStats();
}

async function handleExportStats() {
  try {
    const filter = statsSecondClassFilter.value || undefined;
    const items = await validateService.exportManualStatistics(filter);
    const data = items.map((item, index) => ({
      '序号': index + 1,
      '二级类码': `${item.secondClassCode} ${item.secondClassName}`,
      '数据类码': `${item.dataCategoryCode} ${item.dataCategoryName}`,
      '数据码': `${item.dataCode} ${item.dataName}`,
      '增加时间': formatTime(item.createTm),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '手动添加编码');
    XLSX.writeFile(wb, `手动编码统计_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`已导出 ${data.length} 条记录`);
  } catch (err: any) {
    ElMessage.error('导出失败');
  }
}

// ========== Tab 3: 编码校验 ==========
const inputMode = ref('paste');
const batchInput = ref('');
const uploadFileList = ref<Array<{ name: string; size: number }>>([]);
const parsedCodes = ref<Array<{ code: string; name: string }>>([]);
const resolvingCodes = ref(false);
const resolvedItems = ref<ResolvedCodeItem[]>([]);
const processedKeys = ref<Set<string>>(new Set());
const addDialogVisible = ref(false);
const addTarget = ref<ResolvedCodeItem | null>(null);
const addingCode = ref(false);
const addForm = reactive({
  dataCategoryCode: '',
  dataCategoryName: '',
  dataCode: '',
  dataName: '',
});


// 根据当前输入模式判断是否有编码可操作
const hasCodes = computed(() => {
  if (inputMode.value === 'paste') {
    return pasteCodes.value.length > 0;
  }
  return parsedCodes.value.length > 0;
});

// 解析批量粘贴的内容
const pasteCodes = computed(() => {
  return batchInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\t\s]+/);
      return {
        code: parts[0] || '',
        name: parts.slice(1).join(' ') || '',
      };
    })
    .filter(item => item.code.length > 0);
});

// 上传Excel
function handleFileUpload(file: any) {
  uploadFileList.value = [{ name: file.name, size: file.size }];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

      const codes: Array<{ code: string; name: string }> = [];
      for (const row of jsonData) {
        const code = row['测点编码'] || row['编码'] || row['code'] || '';
        const name = row['测点描述'] || row['编码名称'] || row['name'] || '';
        if (code) {
          codes.push({ code: String(code).trim(), name: String(name).trim() });
        }
      }

      if (codes.length === 0) {
        ElMessage.warning('文件中未识别到有效编码');
        return;
      }
      parsedCodes.value = codes;
      ElMessage.success(`已解析 ${codes.length} 条编码`);
    } catch {
      ElMessage.error('文件解析失败，请检查文件格式');
    }
  };
  reader.readAsArrayBuffer(file.raw);
  return false;
}

function handleUploadExceed() {
  ElMessage.warning('只支持上传一个文件');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function handleResolveCodes() {
  let codes: Array<{ code: string; name: string }> = [];

  if (inputMode.value === 'paste') {
    codes = pasteCodes.value;
    parsedCodes.value = codes;
  } else if (inputMode.value === 'excel') {
    codes = parsedCodes.value;
  }

  if (codes.length === 0) {
    ElMessage.warning('请先输入或上传编码');
    return;
  }

  if (codes.length > 10000) {
    ElMessage.warning('单次解析数量超出限制（上限10000条）');
    return;
  }

  resolvingCodes.value = true;
  try {
    resolvedItems.value = await validateService.resolveCodes(codes);
    // 为每行添加唯一 key（含类型）
    resolvedItems.value.forEach((item, idx) => {
      (item as any).rowKey = `${item.typeCode}|${item.secondClassCode}|${item.dataCategoryCode}|${item.dataCode}|${idx}`;
    });
    ElMessage.success(`解析完成，共 ${resolvedItems.value.length} 组去重编码`);
  } catch (err: any) {
    ElMessage.error(err.message || '编码解析失败');
  } finally {
    resolvingCodes.value = false;
  }
}

function clearCodes() {
  batchInput.value = '';
  parsedCodes.value = [];
  resolvedItems.value = [];
  processedKeys.value = new Set();
  uploadFileList.value = [];
}

// ---------- 新增操作 ----------
function handleAddItem(row: ResolvedCodeItem) {
  addTarget.value = row;
  addForm.dataCategoryCode = row.dataCategoryCode;
  addForm.dataCategoryName = row.dataCategoryName === '未识别' ? '' : row.dataCategoryName;
  addForm.dataCode = row.dataCode;
  addForm.dataName = row.dataName === '未识别' ? '' : row.dataName;
  addDialogVisible.value = true;
}

function resetAddForm() {
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addForm.dataCode = '';
  addForm.dataName = '';
}

async function confirmAddItem() {
  if (!addTarget.value) return;
  if (!addForm.dataCategoryCode || !addForm.dataCode || !addForm.dataName) {
    ElMessage.warning('请填写数据类码、数据码和数据名称');
    return;
  }
  addingCode.value = true;
  try {
    await dictService.createManualCode({
      typeCode: addTarget.value.typeCode,
      secondClassCode: addTarget.value.secondClassCode,
      secondClassName: addTarget.value.secondClassName,
      dataCategoryCode: addForm.dataCategoryCode,
      dataCategoryName: addForm.dataCategoryName || addForm.dataCategoryCode,
      dataCode: addForm.dataCode,
      dataName: addForm.dataName,
    });
    ElMessage.success('新增成功');
    // 标记本行为已处理
    if (addTarget.value) {
      const key = (addTarget.value as any).rowKey;
      const newSet = new Set(processedKeys.value);
      newSet.add(key);
      processedKeys.value = newSet;
    }
    addDialogVisible.value = false;
    addTarget.value = null;
    resetAddForm();
  } catch (err: any) {
    ElMessage.error(err.message || '新增失败');
  } finally {
    addingCode.value = false;
  }
}


// ========== 生命周期 ==========
onMounted(() => {
  loadDictTree();
  loadManualStats();
});
</script>

<style scoped>
.code-validate {
  width: 100%;
}

.main-card {
  min-height: 500px;
}

.main-tabs {
  margin-top: -16px;
}

/* Tab 1: Tree */
.tree-container {
  padding: 8px 0;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tree-filter-input {
  width: 300px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding-right: 16px;
  font-size: 14px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  min-width: 60px;
  text-align: center;
}

.tree-node-code {
  font-weight: 600;
}

.code-type-domain {
  color: #f56c6c;
}

.code-second-class {
  color: #409eff;
}

.code-data-category {
  color: #67c23a;
}

.code-data-code {
  color: #e6a23c;
}

.tree-node-name {
  color: #606266;
}

.tree-node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-tag {
  font-size: 11px;
}

.child-count {
  font-size: 12px;
  color: #909399;
}

/* Tab 2: Statistics */
.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.statistics-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.statistics-title {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Tab 3: Validate */
.input-section {
  margin-bottom: 16px;
  border: none;
  max-width: 1400px;
}

.paste-textarea {
  max-width: 700px;
}

.processed-tag {
  color: #909399;
  font-size: 13px;
}

.input-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.excel-file-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}

.excel-file-name {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.excel-file-size {
  font-size: 13px;
  color: #909399;
}

.validate-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.result-section {
  margin-top: 12px;
}

.result-header {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
  margin-bottom: 12px;
}

.expanded-codes {
  padding: 12px 24px;
}

.expanded-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.code-val {
  font-weight: 600;
  color: #409eff;
}

.name-muted {
  color: #606266;
  margin-left: 6px;
}

.name-error {
  color: #f56c6c;
  font-weight: 700;
  margin-left: 6px;
}

</style>
