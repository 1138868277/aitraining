<template>
  <div class="code-validate">
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab 1: 字典查询 -->
        <el-tab-pane label="字典查询" name="dictTree">
          <DictOverviewCard />
          <div class="tree-container">
            <div class="tree-toolbar">
              <el-button size="default" @click="onCollapseAll">收起所有</el-button>
            </div>
            <el-tree
              ref="treeRef"
              :data="dictTreeData"
              lazy
              :load="loadTreeNode"
              :props="treeProps"
              v-loading="loadingTree"
              element-loading-text="字典数据加载中..."
              highlight-current
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

        <!-- Tab 2: 新增字典记录 -->
        <el-tab-pane label="字典新增" name="statistics">
          <div class="statistics-header">
            <span class="statistics-title">手动添加编码记录</span>
            <div class="header-actions">
              <el-button size="small" @click="loadManualStats">刷新</el-button>
              <el-button
                v-if="manualStats.length > 0"
                size="small"
                type="primary"
                @click="handleExportStats"
              >导出Excel</el-button>
            </div>
          </div>
          <div class="statistics-toolbar">
            <el-select
              v-model="statsTypeFilter"
              placeholder="类型筛选"
              clearable
              style="width: 200px"
              @change="onStatsTypeFilterChange"
            >
              <el-option
                v-for="item in typeOptions"
                :key="item.code"
                :label="item.code + ' ' + item.name"
                :value="item.code"
              />
            </el-select>
            <el-select
              v-model="statsSecondClassFilter"
              placeholder="二级类码筛选"
              clearable
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
          <el-table
            :data="manualStats"
            border
            stripe
            style="width: 100%"
            class="stats-table"
            v-loading="loadingStats"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="类型">
              <template #default="{ row }">
                <span v-if="row.typeCode" class="code-type">{{ row.typeCode.charAt(0) }}</span>
                <span v-if="row.typeCode" class="name-muted">{{ row.typeCode.charAt(0) === 'F' ? '风电' : row.typeCode.charAt(0) === 'G' ? '光伏' : row.typeCode.charAt(0) === 'S' ? '水电' : '其他' }}</span>
                <span v-else class="name-error">未识别</span>
              </template>
            </el-table-column>
            <el-table-column label="二级类码">
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
        <!-- Tab 3: 场站维护 -->
        <el-tab-pane label="场站维护" name="station">
          <StationTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import * as validateService from '@/services/validate';
import DictOverviewCard from './dict-overview-card.vue';
import StationTab from './station-tab.vue';
import type { DictTreeNode, ManualStatItem } from '@cec/contracts';

// ========== Tab Switching ==========
const route = useRoute();
const router = useRouter();
const activeTab = ref((route.query.tab as string) || 'dictTree');

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

// ========== Tab 1: 字典查询 ==========
const dictTreeData = ref<DictTreeNode[]>([]);
const treeDataCache = ref<DictTreeNode[]>([]); // lazy load 查找缓存
const loadingTree = ref(false);
const treeRef = ref<any>(null);

const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: any) => data.type === 'dataCode',
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

function formatTime(tm: string): string {
  // ISO 字符串裁剪到秒: "2024-01-01T12:00:00.000Z" → "2024-01-01 12:00:00"
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function loadDictTree() {
  loadingTree.value = true;
  try {
    treeDataCache.value = await validateService.getDictTree();
    dictTreeData.value = treeDataCache.value; // 保留引用供其他逻辑使用
  } catch (err: any) {
    ElMessage.error('字典树加载失败');
  } finally {
    loadingTree.value = false;
  }
}

/** lazy 模式加载子节点：前三级从缓存取，数据类码展开时从 API 懒加载 */
async function loadTreeNode(node: any, resolve: Function) {
  const data = node.data;
  if (data.type === 'typeDomain') {
    // 返回该类型域下的二级类码
    const td = treeDataCache.value.find((t: any) => t.code === data.code);
    resolve(td?.children || []);
  } else if (data.type === 'secondClass') {
    // 返回该二级类码下的数据类码
    for (const td of treeDataCache.value) {
      const sc = (td.children || []).find((c: any) => c.code === data.code);
      if (sc) { resolve(sc.children || []); return; }
    }
    resolve([]);
  } else if (data.type === 'dataCategory') {
    // 从 API 懒加载数据码
    try {
      const typeDomainCode = node.parent?.parent?.data?.code;
      const secondClassCode = node.parent?.data?.code;
      if (!typeDomainCode || !secondClassCode) { resolve([]); return; }
      const dataCodes = await validateService.getDictTreeDataCodes(
        typeDomainCode, secondClassCode, data.code,
      );
      resolve(dataCodes);
    } catch {
      resolve([]);
    }
  } else {
    resolve([]);
  }
}

function onCollapseAll() {
  // 只收起第一层（类型域节点）下的子节点，保留一级目录展开
  for (const node of treeRef.value?.store?.root?.childNodes || []) {
    if (!node.isLeaf) node.collapse();
  }
}

// ========== Tab 2: 新增字典记录 ==========
const manualStats = ref<ManualStatItem[]>([]);
const loadingStats = ref(false);
const statsTotal = ref(0);
const statsPageNum = ref(1);
const statsPageSize = ref(20);
const statsTypeFilter = ref('');
const statsSecondClassFilter = ref('');
const typeOptions = ref<Array<{ code: string; name: string }>>([]);
const secondClassOptions = ref<Array<{ code: string; name: string }>>([]);

async function loadManualStats() {
  loadingStats.value = true;
  try {
    const scFilter = statsSecondClassFilter.value || undefined;
    const tFilter = statsTypeFilter.value || undefined;
    console.log('DEBUG loadManualStats params:', { scFilter, tFilter });
    const result = await validateService.getManualStatistics(statsPageNum.value, statsPageSize.value, scFilter, tFilter);
    console.log('DEBUG loadManualStats result keys:', Object.keys(result));
    console.log('DEBUG secondClassOptions:', JSON.stringify(result.secondClassOptions));
    manualStats.value = result.items;
    statsTotal.value = result.total;
    secondClassOptions.value = result.secondClassOptions || [];
    typeOptions.value = result.typeOptions || [];
  } catch (err: any) {
    ElMessage.error('加载统计数据失败');
  } finally {
    loadingStats.value = false;
  }
}

/** 类型筛选变化：重置二级类码和分页 */
function onStatsTypeFilterChange() {
  statsSecondClassFilter.value = '';
  statsPageNum.value = 1;
  loadManualStats();
}

/** 二级类码筛选变化：重置分页 */
function onStatsFilterChange() {
  statsPageNum.value = 1;
  loadManualStats();
}

async function handleExportStats() {
  try {
    const scFilter = statsSecondClassFilter.value || undefined;
    const tFilter = statsTypeFilter.value || undefined;
    const items = await validateService.exportManualStatistics(scFilter, tFilter);
    const fmtType = (tc: string) => tc ? `${tc.charAt(0)} ${tc.charAt(0) === 'F' ? '风电' : tc.charAt(0) === 'G' ? '光伏' : '其他'}` : '未识别';
    const data = items.map((item, index) => ({
      '序号': index + 1,
      '类型': item.typeCode ? fmtType(item.typeCode) : '未识别',
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

/* Tab 1: 字典查询 */
.tree-container {
  padding: 8px 0;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
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

/* Tab 2: 新增字典记录 */
.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions { display: flex; align-items: center; gap: 8px; }
.statistics-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.statistics-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
}

.statistics-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  padding: 16px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stats-table :deep(table) {
  table-layout: fixed;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Tab 2: 新增字典记录 - styles above */

</style>
