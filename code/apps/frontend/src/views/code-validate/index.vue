<template>
  <div class="code-validate">
<div class="page-body">
      <el-tabs v-model="activeTab" class="page-tabs">
        <!-- Tab 1: 字典查询 -->
        <el-tab-pane label="字典查询" name="dictTree">
          <div class="subpage-hero">
            <div class="hero-icon">🔍</div>
            <div class="hero-text">
              <div class="hero-title">字典查询</div>
              <div class="hero-subtitle">按照类型→二级类码→数据类码→数据码的层级结构浏览编码字典，支持树形展开和手动来源标识</div>
            </div>
          </div>
          <DictOverviewCard />
          <div class="tree-toolbar-card">
            <div class="toolbar-left">
              <span class="tree-section-label">编码字典树</span>
            </div>
            <div class="toolbar-right">
              <el-button size="default" @click="onCollapseAll">收起所有</el-button>
              <el-button size="default" type="primary" :loading="loadingTree" @click="loadDictTree">刷新</el-button>
            </div>
          </div>
          <div class="tree-container-card">
            <el-tree
              ref="treeRef"
              :data="dictTreeData"
              lazy
              :load="loadTreeNode"
              :props="treeProps"
              v-loading="loadingTree"
              element-loading-text="字典数据加载中..."
              highlight-current
              class="styled-tree"
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
        <el-tab-pane label="数据码管理" name="statistics">
          <div class="subpage-hero">
            <div class="hero-icon">📝</div>
            <div class="hero-text">
              <div class="hero-title">数据码管理</div>
              <div class="hero-subtitle">手动添加数据码词典，录入新增的数据类码及其对应的数据码，支持批量操作和Excel导出</div>
            </div>
          </div>
          <div class="list-header">
            <span class="list-header-title">新增数据码记录</span>
            <div class="list-header-actions">
              <el-button @click="resetTable">一键重置</el-button>
              <el-button @click="loadManualStats">刷新</el-button>
              <el-button
                v-if="manualStats.length > 0"
                type="primary"
                @click="handleExportStats"
              >导出Excel</el-button>
            </div>
          </div>
          <div class="data-mgmt-section">
            <el-table
              ref="statsTableRef"
              :data="manualStats"
              stripe
              style="width: 100%"
              class="styled-table"
              v-loading="loadingStats"
              :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }"
              :header-cell-class-name="headerCellClass"
              @sort-change="onSortChange"
              @filter-change="onFilterChange"
            >
              <el-table-column label="序号" type="index" width="70" align="center">
                <template #default="{ $index }">
                  {{ ($index + 1) + (statsPageNum - 1) * statsPageSize }}
                </template>
              </el-table-column>
              <el-table-column label="类型" width="270" align="center" column-key="typeCode" :filters="typeFilterOptions" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag v-if="row.typeCode" :type="statsTypeTagType(row.typeCode)" size="small" effect="plain">{{ statsTypeLabel(row.typeCode) }}</el-tag>
                  <el-tag v-else size="small" type="danger">未识别</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="二级类码" prop="secondClassCode" column-key="secondClassCode" :filters="secondClassFilterOptions" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; margin-right: 4px;">{{ row.secondClassCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.secondClassName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码" prop="dataCategoryCode" sortable="custom">
                <template #default="{ row }">
                  <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCategoryCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.dataCategoryName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码" prop="dataCode" sortable="custom">
                <template #default="{ row }">
                  <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.dataName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="增加时间" prop="createTm" width="170" sortable="custom">
                <template #default="{ row }">
                  <span class="time-cell">{{ formatTime(row.createTm) }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="!loadingStats && manualStats.length === 0" description="暂无手动添加记录" />
            <div v-if="statsTotal > 0" class="data-mgmt-pagination">
              <el-pagination
                v-model:current-page="statsPageNum"
                v-model:page-size="statsPageSize"
                :total="statsTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="loadManualStats"
                @size-change="loadManualStats"
              />
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 场站维护 -->
        <el-tab-pane label="场站管理" name="station">
          <StationTab />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
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

/** 表头筛选：类型选项 */
const typeFilterOptions = computed(() => {
  return typeOptions.value.map(t => ({
    text: `${t.code} ${t.name}`,
    value: t.code,
  }));
});

/** 表头筛选：二级类码选项 */
const secondClassFilterOptions = computed(() => {
  const seen = new Set<string>();
  return secondClassOptions.value.filter(s => {
    const key = `${s.code}|${s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(s => ({
    text: `${s.code} ${s.name}`,
    value: `${s.code}|${s.name}`,
  }));
});

/** 表格引用，用于控制排序指示器 */
const statsTableRef = ref<any>(null);

/** 表头筛选变化 → 触发服务端筛选 */
function onFilterChange(filters: Record<string, any[]>) {
  // @filter-change 只包含发生变化的列，需用 in 判断
  if ('typeCode' in filters) {
    const typeVal = filters.typeCode || [];
    statsTypeFilter.value = typeVal.length > 0 ? typeVal[0] : '';
    // 类型切换时清除二级类码筛选，因为不同类型下二级类码不同
    statsSecondClassFilter.value = '';
  }
  if ('secondClassCode' in filters) {
    const scVal = filters.secondClassCode || [];
    statsSecondClassFilter.value = scVal.length > 0 ? scVal[0] : '';
  }
  statsPageNum.value = 1;
  loadManualStats();
}

/** 排序状态（多列联动排序，最后点击的优先级最高） */
const sortStates = ref<Array<{ prop: string; order: 'ascending' | 'descending' }>>([]);

/** 表头排序变化 → 触发服务端排序 */
function onSortChange(sortInfo: { prop?: string; order?: 'ascending' | 'descending' | null }) {
  if (!sortInfo.prop || !sortInfo.order) {
    // 取消该列的排序
    sortStates.value = sortStates.value.filter(s => s.prop !== sortInfo.prop);
  } else {
    const existing = sortStates.value.find(s => s.prop === sortInfo.prop);
    if (existing) {
      existing.order = sortInfo.order;
    } else {
      sortStates.value.push({ prop: sortInfo.prop, order: sortInfo.order });
    }
  }
  statsPageNum.value = 1;
  loadManualStats();
}

/** 给排序列的表头添加标识类名 */
function headerCellClass({ column }: { column: any }): string {
  const found = sortStates.value.find(s => s.prop === column.property);
  if (found) {
    return `sorted-column sorted-${found.order}`;
  }
  return '';
}

async function loadManualStats() {
  loadingStats.value = true;
  try {
    const scFilter = statsSecondClassFilter.value || undefined;
    const tFilter = statsTypeFilter.value || undefined;
    // 多列排序：以逗号分隔传递（最后添加的优先级最高）
    const sBy = sortStates.value.length > 0 ? sortStates.value.map(s => s.prop).join(',') : undefined;
    const sOrder = sortStates.value.length > 0 ? sortStates.value.map(s => s.order).join(',') : undefined;
    const result = await validateService.getManualStatistics(statsPageNum.value, statsPageSize.value, scFilter, tFilter, sBy, sOrder);
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

/** 一键重置：清除所有筛选、排序、分页，恢复表格初始状态 */
function resetTable() {
  statsTypeFilter.value = '';
  statsSecondClassFilter.value = '';
  sortStates.value = [];
  statsPageNum.value = 1;
  // 清除 Element Plus 表格的筛选高亮状态
  statsTableRef.value?.clearFilter();
  loadManualStats();
}

function statsTypeTagType(code: string): 'primary' | 'success' | 'info' | 'warning' {
  if (!code) return 'info';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return 'primary';
  if (first === 'G') return 'success';
  if (first === 'S') return 'info';
  return 'warning';
}

function statsTypeLabel(code: string): string {
  if (!code) return '其他';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return '风电';
  if (first === 'G') return '光伏';
  if (first === 'S') return '水电';
  return '其他';
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 功能介绍卡片 ==================== */
.hero-icon {
  font-size: 36px;
  line-height: 1;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.hero-text { flex: 1; position: relative; z-index: 1; }

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.hero-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 4px;
}

/* ==================== 页面主体 ==================== */
.page-body {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  padding: 8px 16px 16px;
}

.page-tabs {
  margin-top: -8px;
}

/* ==================== Tab 1: 字典树工具栏 ==================== */
.tree-toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin: 8px 0 12px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
}

.tree-section-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tree-container-card {
  padding: 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.styled-tree {
  font-size: 14px;
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

.code-type-domain { color: #f56c6c; }
.code-second-class { color: #409eff; }
.code-data-category { color: #67c23a; }
.code-data-code { color: #e6a23c; }

.tree-node-name {
  color: #606266;
  margin-left: 2px;
}

.tree-node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-tag { font-size: 11px; }
.child-count { font-size: 12px; color: #909399; }

/* ==================== Tab 2: 数据码管理 ==================== */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}
.list-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}
.list-header-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
}
.list-header-actions {
  display: flex;
  gap: 8px;
}

.data-mgmt-section {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  padding: 4px;
  overflow: hidden;
}
.data-mgmt-pagination {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}

/* 排序列标识：隐藏原生箭头，使用自定义伪元素箭头 */
.styled-table :deep(.sorted-column .caret-wrapper) {
  display: none;
}
.styled-table :deep(.sorted-column .cell) {
  color: #409eff !important;
}
.styled-table :deep(.sorted-column.sorted-ascending .cell)::after {
  content: '▲';
  font-size: 10px;
  color: #409eff;
  vertical-align: middle;
  margin-left: 6px;
}
.styled-table :deep(.sorted-column.sorted-descending .cell)::after {
  content: '▼';
  font-size: 10px;
  color: #409eff;
  vertical-align: middle;
  margin-left: 6px;
}

.styled-table {
  border: none !important;
}
.styled-table :deep(.el-table__inner-wrapper) {
  border: none !important;
}
.styled-table :deep(.el-table__body tr) {
  transition: background 0.2s ease;
}
.styled-table :deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}
.styled-table :deep(.el-table__body tr.el-table__row--striped:hover) {
  background: #e8f0fe !important;
}
.styled-table :deep(.el-table__cell) {
  padding: 8px 0 !important;
}
.styled-table :deep(.el-table--border) { border-color: #ebeef5; }

.cell-name-tag {
  color: #909399;
  font-size: 12px;
}

.time-cell {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
}

/* ==================== 子页面功能介绍卡片 ==================== */
.subpage-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.15);
  position: relative;
  overflow: hidden;
}
.subpage-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  border-radius: 50%;
}

</style>

<style>
/* ==================== 表头筛选：科技风格（全局样式穿透弹窗） ==================== */
.styled-table .el-table__column-filter-trigger {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: rgba(64, 158, 255, 0.06);
  border: 1px solid rgba(64, 158, 255, 0.15);
  position: relative;
  top: -1px;
}
.styled-table .el-table__column-filter-trigger:hover {
  background: rgba(64, 158, 255, 0.12);
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.15);
}
.styled-table .el-table__column-filter-trigger .el-icon {
  font-size: 14px;
  color: #7c9cf5;
  transition: all 0.3s ease;
  line-height: 1;
}
.styled-table .el-table__column-filter-trigger:hover .el-icon {
  color: #409eff;
  transform: scale(1.15);
  filter: drop-shadow(0 0 4px rgba(64, 158, 255, 0.5));
}
.styled-table .el-table__column-filter-trigger.is-active {
  background: rgba(64, 158, 255, 0.15);
  border-color: #409eff;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.25);
}
.styled-table .el-table__column-filter-trigger.is-active .el-icon {
  color: #409eff;
  filter: drop-shadow(0 0 6px rgba(64, 158, 255, 0.7));
}
/* 表头单元格内容垂直居中 */
.styled-table .el-table__header-wrapper .cell {
  display: inline-flex;
  align-items: center;
}
.el-table-filter {
  background: rgba(20, 28, 52, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  border-radius: 12px !important;
  box-shadow:
    0 0 20px rgba(64, 158, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(64, 158, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  padding: 8px !important;
  overflow: hidden;
}
.el-table-filter__list {
  padding: 4px !important;
}
.el-table-filter__list-item {
  padding: 0 !important;
  margin: 2px 0 !important;
}
.el-table-filter__list-item .el-checkbox {
  display: flex !important;
  align-items: center;
  padding: 8px 14px !important;
  border-radius: 8px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__list-item .el-checkbox:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.12), rgba(64, 158, 255, 0.05)) !important;
}
.el-table-filter__list-item.is-checked .el-checkbox {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.08)) !important;
}
.el-table-filter__list-item .el-checkbox__label {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
}
.el-table-filter__list-item.is-checked .el-checkbox__label {
  color: #66b1ff !important;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}
.el-table-filter__list-item .el-checkbox__inner {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
  border-radius: 4px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__list-item .el-checkbox__inner::after {
  border-color: #409eff !important;
}
.el-table-filter__list-item .el-checkbox.is-checked .el-checkbox__inner {
  background: rgba(64, 158, 255, 0.3) !important;
  border-color: #409eff !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4) !important;
}
.el-table-filter__bottom {
  border-top: 1px solid rgba(64, 158, 255, 0.15) !important;
  padding: 8px 14px !important;
  margin-top: 4px !important;
}
.el-table-filter__bottom button {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 12px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__bottom button:hover {
  color: #66b1ff !important;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}
</style>
