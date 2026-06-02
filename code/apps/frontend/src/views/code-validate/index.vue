<template>
  <div class="code-validate">
<div class="page-body">
      <div class="page-layout">
        <!-- 左侧标签导航 -->
        <div class="cyber-tabs">
          <div
            v-for="tab in visibleTabs"
            :key="tab.name"
            class="cyber-tab"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <div class="cyber-tab-icon" v-html="tab.icon"></div>
            <span class="cyber-tab-label">{{ tab.label }}</span>
            <div class="cyber-tab-indicator"></div>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="tab-content">
        <div v-show="activeTab === 'dictTree'" class="tab-panel">
          <!-- 科技风顶部 -->
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">编码字典查询</div>
                <div class="tech-hero-desc">按层级结构浏览编码字典，支持数据码快速检索与精确定位</div>
              </div>
            </div>
          </div>

          <!-- 数据概览卡片组 -->
          <div class="tech-metrics-wrap">
            <div class="tech-metrics-filter">
              <button :class="['tmf-btn', { active: overviewTypeFilter === 'wind' }]" @click="overviewTypeFilter = 'wind'">🌬️ 风电</button>
              <button :class="['tmf-btn', { active: overviewTypeFilter === 'solar' }]" @click="overviewTypeFilter = 'solar'">☀️ 光伏</button>
              <button :class="['tmf-btn', { active: overviewTypeFilter === 'hydro' }]" @click="overviewTypeFilter = 'hydro'">💧 水电</button>
            </div>
            <div class="tech-metrics">
              <div class="tech-metric-card" v-for="m in metrics" :key="m.label">
                <div class="tmc-icon" :style="{ color: m.color, background: m.bg }">{{ m.icon }}</div>
                <div class="tmc-body">
                  <div class="tmc-value" :style="{ color: m.color }">{{ resolvedOverview[m.field] }}</div>
                  <div class="tmc-label">{{ m.label }}</div>
                </div>
                <div class="tmc-glow" :style="{ background: m.color }"></div>
              </div>
            </div>
          </div>

          <!-- 字典树 + 查询 -->
          <div class="tech-panel">
            <div class="tech-panel-header">
              <div class="tph-left">
                <div class="tph-switch">
                  <button :class="['tph-btn', { active: queryMode === 'search' }]" @click="queryMode = 'search'">
                    <span class="tph-btn-icon">🔎</span> 数据码查询
                  </button>
                  <button :class="['tph-btn', { active: queryMode === 'tree' }]" @click="queryMode = 'tree'">
                    <span class="tph-btn-icon">🌳</span> 树形浏览
                  </button>
                </div>
              </div>
              <div class="tph-right">
                <button v-if="queryMode === 'tree'" class="tph-action-btn" :title="treeExpanded ? '收起所有' : '展开所有'" @click="onToggleTree">
                  <svg v-if="treeExpanded" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>
                </button>
                <button class="tph-action-btn" title="刷新" @click="loadDictTree" :disabled="loadingTree">
                  <svg :class="{ spinning: loadingTree }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </button>
              </div>
            </div>
            <div class="tech-panel-body">
              <!-- 树形浏览 -->
              <div v-show="queryMode === 'tree'" class="tech-tree-container">
                <el-tree
                  ref="treeRef"
                  :data="dictTreeData"
                  lazy
                  :load="loadTreeNode"
                  :props="treeProps"
                  v-loading="loadingTree"
                  element-loading-text="字典数据加载中..."
                  highlight-current
                  class="tech-tree"
                >
                  <template #default="{ node, data }">
                    <span class="tech-tree-node">
                      <span class="ttn-badge" :class="'badge-' + data.type">{{ typeLabel(data.type) }}</span>
                      <span class="ttn-code">{{ data.code }}</span>
                      <span class="ttn-name">{{ data.name }}</span>
                      <span v-if="data.childCount !== undefined" class="ttn-count">{{ data.childCount }} 项</span>
                    </span>
                  </template>
                </el-tree>
                <el-empty v-if="!loadingTree && dictTreeData.length === 0 && queryMode === 'tree'" description="暂无字典数据" />
              </div>
              <!-- 数据码查询 -->
              <QuickSearchPanel v-show="queryMode === 'search'" />
            </div>
          </div>
        </div>

        <!-- Tab 2: 新增字典记录 -->
        <div v-show="activeTab === 'datacode'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">数据码新增</div>
                <div class="tech-hero-desc">新增数据码并提交集团审批，通过后自动下发至全区域</div>
              </div>
            </div>
          </div>
          <div class="section-card" style="margin-top: 10px;">
            <div class="section-header" style="display:flex;align-items:center;justify-content:space-between;">
              <span class="section-title">数据码新增记录</span>
              <div style="display:flex;gap:8px;">
                <el-button class="btn-add-code" @click="showAddDialog = true">
                  <span class="btn-add-code-inner">
                    <span class="btn-add-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </span>
                    <span class="btn-add-text">新增数据码</span>
                  </span>
                </el-button>
                <el-button class="btn-reset" @click="resetTable">
                  <span class="btn-reset-inner">
                    <span class="btn-reset-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                    </span>
                    <span class="btn-reset-text">一键重置</span>
                  </span>
                </el-button>
                <el-button class="btn-refresh" @click="loadManualStats">
                  <span class="btn-refresh-inner">
                    <span class="btn-refresh-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    </span>
                    <span class="btn-refresh-text">刷新</span>
                  </span>
                </el-button>
                <el-button
                  v-if="manualStats.length > 0"
                  class="btn-export"
                  @click="handleExportStats"
                ><span class="btn-export-inner">导出Excel</span></el-button>
              </div>
            </div>
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
              <el-table-column label="序号" type="index" width="60" align="center">
                <template #default="{ $index }">
                  {{ ($index + 1) + (statsPageNum - 1) * statsPageSize }}
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80" align="center" column-key="typeCode" :filters="typeFilterOptions" filter-placement="bottom">
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
              <el-table-column label="创建时间" prop="createTm" width="170" sortable="custom" align="center">
                <template #default="{ row }">
                  <span class="time-cell">{{ formatTime(row.createTm) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="!row.status || row.status === 'draft'" type="info" size="small">待提交</el-tag>
                  <el-tag v-else-if="row.status === 'submitted'" type="warning" size="small">审批中</el-tag>
                  <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
                  <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
                  <el-tag v-else type="info" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right" align="center">
                <template #default="{ row }">
                  <template v-if="!row.status || row.status === 'draft' || row.status === 'rejected'">
                    <span class="enum-badge enum-submit" @click="handleSubmitApproval(row)">提交</span>
                    <span class="enum-badge enum-delete" @click="handleDeleteCode(row)">删除</span>
                    <span v-if="row.status === 'rejected' && row.rejectReason" class="reject-hint">{{ row.rejectReason }}</span>
                  </template>
                  <span v-else-if="row.status === 'submitted'" style="color: #909399; font-size: 12px;">等待审核</span>
                  <span v-else style="color: #c0c4cc;">-</span>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="statsTotal > 0" class="quick-search-pagination tech-pagination">
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

          <!-- 提交记录 -->
          <div class="section-card" style="margin-top: 16px;">
            <div class="section-header">
              <span class="section-title">提交记录</span>
            </div>
            <el-table :data="submissions" stripe style="width:100%" class="styled-table submissions-table" v-loading="loadingSubmissions" empty-text="暂无提交记录" :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }">
              <el-table-column type="index" label="序号" width="60" align="center">
                <template #default="{ $index }">
                  {{ ($index + 1) + (subPageNum - 1) * subPageSize }}
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.typeCode" :type="statsTypeTagType(row.typeCode)" size="small" effect="plain">{{ statsTypeLabel(row.typeCode) }}</el-tag>
                  <el-tag v-else size="small" type="danger">未识别</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="二级类码">
                <template #default="{ row }">
                  <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; margin-right: 4px;">{{ row.secondClassCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.secondClassName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码">
                <template #default="{ row }">
                  <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCategoryCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.dataCategoryName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码">
                <template #default="{ row }">
                  <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCode }}</el-tag>
                  <span class="cell-name-tag">{{ row.dataName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.status === 'submitted'" type="warning" size="small">待审批</el-tag>
                  <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
                  <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已拒绝</el-tag>
                  <el-tag v-else type="info" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="审批意见">
                <template #default="{ row }">
                  <span v-if="row.rejectReason" style="color: #f56c6c; font-size: 12px;">{{ row.rejectReason }}</span>
                  <span v-else style="color: #c0c4cc;">-</span>
                </template>
              </el-table-column>
              <el-table-column label="提交时间" width="170" align="center">
                <template #default="{ row }">
                  <span class="time-cell">{{ formatTime(row.submitTm || row.createTm) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="审批时间" width="170" align="center">
                <template #default="{ row }">
                  <span class="time-cell">{{ row.reviewTm ? formatTime(row.reviewTm) : '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="subTotal > 0" class="quick-search-pagination tech-pagination">
              <el-pagination
                v-model:current-page="subPageNum"
                v-model:page-size="subPageSize"
                :total="subTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="loadSubmissions"
                @size-change="loadSubmissions"
              />
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'approval'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">数据码审批</div>
                <div class="tech-hero-desc">审批各区域数据码申请，通过后自动同步下发至全区域</div>
              </div>
            </div>
          </div>
          <ApprovalMgmtTab @refresh="loadPendingApprovalCount" :key="approvalTabKey" />
        </div>

      </div>
    </div>
    </div>
    <AddCodeDialog v-model="showAddDialog" @success="onAddCodeSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import * as validateService from '@/services/validate';
import * as approvalService from '@/services/approval';
import * as statsService from '@/services/statistics';
import AddCodeDialog from '@/components/add-code-dialog.vue';
import QuickSearchPanel from './quick-search-panel.vue';
import ApprovalMgmtTab from '@/views/system-settings/approval-mgmt-tab.vue';
import type { DictTreeNode, ManualStatItem } from '@cec/contracts';

// ========== Tab Switching ==========
const route = useRoute();
const router = useRouter();

const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
const currentUser = authUser?.username || '';

// ========== 审批待办计数 ==========
const pendingApprovalCount = ref(0);
const approvalTabKey = ref(0);

async function loadPendingApprovalCount() {
  if (currentUser !== 'admin') return;
  try {
    const result = await approvalService.getApprovalList(1, 1, 'pending');
    pendingApprovalCount.value = result.total;
  } catch {}
}

const savedTab = localStorage.getItem('codevalidate_active_tab');
const activeTab = ref(
  currentUser !== 'admin' && ((route.query.tab as string) === 'approval' || savedTab === 'approval')
    ? 'dictTree'
    : (route.query.tab as string) || savedTab || 'dictTree'
);

const tabDefs = [
  { name: 'dictTree', label: '字典查询', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' },
  { name: 'datacode', label: '数据码管理', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
  { name: 'approval', label: '数据码审批', adminOnly: true,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
];
const visibleTabs = computed(() => tabDefs.filter(t => !t.adminOnly || currentUser === 'admin'));

watch(activeTab, (tab) => {
  localStorage.setItem('codevalidate_active_tab', tab);
  router.replace({ query: { ...route.query, tab } });
});

// ========== Tab 1: 字典查询 ==========
const dictOverviewData = ref<any>(null);
const overviewTypeFilter = ref<'wind' | 'solar' | 'hydro'>('wind');

const resolvedOverview = computed(() => {
  const d = dictOverviewData.value?.[overviewTypeFilter.value];
  return d || { firstClassCount: 0, secondClassCount: 0, thirdClassCount: 0, dataCategoryCount: 0, dataCodeCount: 0 };
});

const metrics = [
  { icon: '📂', label: '一级类码', field: 'firstClassCount', color: '#667eea', bg: 'rgba(102,126,234,0.1)' },
  { icon: '📁', label: '二级类码', field: 'secondClassCount', color: '#764ba2', bg: 'rgba(118,75,162,0.1)' },
  { icon: '🗂️', label: '三级类码', field: 'thirdClassCount', color: '#f093fb', bg: 'rgba(240,147,251,0.1)' },
  { icon: '📋', label: '数据类码', field: 'dataCategoryCount', color: '#4facfe', bg: 'rgba(79,172,254,0.1)' },
  { icon: '🏷️', label: '数据码', field: 'dataCodeCount', color: '#43e97b', bg: 'rgba(67,233,123,0.1)' },
];

async function loadDictOverview() {
  try {
    dictOverviewData.value = await statsService.getDictOverview();
  } catch {}
}

const dictTreeData = ref<DictTreeNode[]>([]);
const treeDataCache = ref<DictTreeNode[]>([]); // lazy load 查找缓存
const loadingTree = ref(false);
const treeRef = ref<any>(null);
const treeExpanded = ref(false);

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

// ========== 数据码查询 ==========
const queryMode = ref<'tree' | 'search'>((localStorage.getItem('codevalidate_query_mode') as 'tree' | 'search') || 'tree');
watch(queryMode, (mode) => {
  localStorage.setItem('codevalidate_query_mode', mode);
});

function formatTime(tm: string): string {
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

function onToggleTree() {
  treeExpanded.value = !treeExpanded.value;
  for (const node of treeRef.value?.store?.root?.childNodes || []) {
    if (!node.isLeaf) {
      treeExpanded.value ? node.expand() : node.collapse();
    }
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

/** 新增数据码对话框 */
const showAddDialog = ref(false);
function onAddCodeSuccess() {
  loadManualStats();
}

/** 提交审批和删除操作 */
const submittingId = ref<string | null>(null);
const deletingId = ref<string | null>(null);

async function handleSubmitApproval(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定提交「${row.dataCode} ${row.dataName}」到审批吗？`,
      '提交审批',
      { confirmButtonText: '确定提交', cancelButtonText: '取消', type: 'info' },
    );
    submittingId.value = row.dataCode;
    const domainCode = row.typeCode ? row.typeCode.charAt(0) : '';
    if (!domainCode) {
      ElMessage.warning('无法确定类型域代码');
      return;
    }
    await validateService.submitCodeForApproval({
      typeDomainCode: domainCode,
      secondClassCode: row.secondClassCode,
      dataCategoryCode: row.dataCategoryCode,
      dataCode: row.dataCode,
    });
    ElMessage.success('已提交审批，请等待集团审核');
    loadManualStats();
  } catch (err: any) {
    if (err !== 'cancel' && err?.code !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '提交失败');
    }
  } finally {
    submittingId.value = null;
  }
}

async function handleDeleteCode(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.dataCode} ${row.dataName}」吗？删除后不可恢复。`,
      '确认删除',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    );
    deletingId.value = row.dataCode;
    const domainCode = row.typeCode ? row.typeCode.charAt(0) : '';
    if (!domainCode) {
      ElMessage.warning('无法确定类型域代码');
      return;
    }
    await validateService.deleteManualCode({
      typeDomainCode: domainCode,
      secondClassCode: row.secondClassCode,
      dataCategoryCode: row.dataCategoryCode,
      dataCode: row.dataCode,
    });
    ElMessage.success('已删除');
    loadManualStats();
  } catch (err: any) {
    if (err !== 'cancel' && err?.code !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '删除失败');
    }
  } finally {
    deletingId.value = null;
  }
}

/** 提交记录 */
const submissions = ref<any[]>([]);
const loadingSubmissions = ref(false);
const subTotal = ref(0);
const subPageNum = ref(1);
const subPageSize = ref(20);

async function loadSubmissions() {
  loadingSubmissions.value = true;
  try {
    const result = await approvalService.getMySubmissions(subPageNum.value, subPageSize.value);
    submissions.value = result.items;
    subTotal.value = result.total;
  } catch {
    ElMessage.error('加载提交记录失败');
  } finally {
    loadingSubmissions.value = false;
  }
}

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
  loadDictOverview();
  loadManualStats();
  loadSubmissions();
  loadPendingApprovalCount();
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


/* ==================== 页面主体 ==================== */
.page-body {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  padding: 8px 0 16px 0;
  overflow: hidden;
}

/* ==================== 左侧标签导航 ==================== */
.page-layout {
  display: flex;
  gap: 0;
  align-items: stretch;
}
.cyber-tabs {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 6px;
  width: 130px;
  flex-shrink: 0;
  border-right: 1px solid #eef0f5;
  background: linear-gradient(180deg, #fafbff 0%, #f5f7ff 100%);
  position: relative;
}
.cyber-tabs::before {
  content: '';
  position: absolute;
  top: 0;
  right: -1px;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(59,130,246,0.12), rgba(139,92,246,0.12), transparent);
}
.cyber-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  overflow: hidden;
}
.cyber-tab::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}
.cyber-tab:hover::before {
  opacity: 1;
}
.cyber-tab:hover .cyber-tab-icon {
  color: #3b82f6;
  transform: scale(1.1);
}
.cyber-tab.active {
  background: linear-gradient(135deg, #3b82f6, #6366f1, #3b82f6);
  background-size: 200% 200%;
  animation: tabGradShift 3s ease infinite;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3), 0 0 20px rgba(59,130,246,0.1);
}
.cyber-tab.active .cyber-tab-label {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.cyber-tab.active .cyber-tab-icon {
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
  animation: tabIconPulse 2s ease-in-out infinite;
}
.cyber-tab.active .cyber-tab-indicator {
  opacity: 1;
  animation: tabIndicatorPulse 1.5s ease-in-out infinite;
}
.cyber-tab:not(.active):hover {
  transform: translateX(2px);
}
.cyber-tab:not(.active):active {
  transform: translateX(0);
}
.cyber-tab-indicator {
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: #fff;
  box-shadow: 0 0 8px rgba(255,255,255,0.5);
  opacity: 0;
  transition: opacity 0.3s ease;
}

@keyframes tabGradShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes tabIconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes tabIndicatorPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.5); height: 20px; }
  50% { box-shadow: 0 0 16px rgba(255,255,255,0.8); height: 28px; }
}
.cyber-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}
.cyber-tab-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
}
.tab-content {
  flex: 1;
  min-width: 0;
  padding: 12px 16px 12px 16px;
}
.tab-panel {
  animation: panelIn 0.25s ease;
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== Tab 1: 字典树工具栏 ==================== */
/* ==================== 科技风 - 字典查询 ==================== */

/* --- 顶部 Hero --- */
.tech-hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #e8f4fd 0%, #eef2ff 50%, #e0f2fe 100%);
  background-size: 200% 200%;
  animation: heroGradient 8s ease infinite;
  border: 1px solid rgba(59,130,246,0.12);
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
}
.tech-hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.tech-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px);
  background-size: 28px 28px;
  animation: gridShift 20s linear infinite;
}
.tech-glow {
  position: absolute;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.1;
  pointer-events: none;
  animation: glowPulse 6s ease-in-out infinite;
}
.tech-glow-1 { top: -120px; right: -60px; background: #93c5fd; animation-delay: 0s; }
.tech-glow-2 { bottom: -120px; left: -80px; background: #c4b5fd; animation-delay: 3s; }
.tech-hero-content {
  position: relative;
  padding: 22px 28px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59,130,246,0.25);
}
.tech-hero-icon svg {
  width: 18px;
  height: 18px;
}
.tech-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-title {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Ma Shan Zheng', 'STXingkai', 'KaiTi', serif;
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  letter-spacing: 4px;
  flex-shrink: 0;
}
.tech-hero-desc {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
}
.tech-hero::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 0 2px 2px 0;
  z-index: 2;
}
.tech-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59,130,246,0.15), transparent);
  z-index: 2;
}

@keyframes heroGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes glowPulse {
  0%, 100% { opacity: 0.08; transform: scale(1); }
  50% { opacity: 0.2; transform: scale(1.15); }
}
@keyframes gridShift {
  0% { transform: translateY(0); }
  100% { transform: translateY(28px); }
}

	/* --- 数据概览卡片组 --- */
.tech-metrics-wrap { margin-bottom: 12px; }
.tech-metrics-filter {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}
.tmf-btn {
  padding: 5px 16px;
  border-radius: 8px;
  border: 1.5px solid #e8ecf1;
  background: #fff;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.tmf-btn:hover { border-color: #c0c8d6; color: #606266; }
.tmf-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.06));
  color: #667eea;
  font-weight: 600;
}
.tech-metrics {
  display: flex;
  gap: 8px;
}
.tech-metric-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tech-metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}
.tmc-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0.6;
}
.tmc-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.tmc-body { flex: 1; min-width: 0; }
.tmc-value { font-size: 18px; font-weight: 700; line-height: 1.2; }
.tmc-label { font-size: 11px; color: #909399; margin-top: 1px; white-space: nowrap; }

/* --- 主面板 (树/查询) --- */
.tech-panel {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.tech-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f2f4f8;
}
.tph-left { display: flex; align-items: center; gap: 12px; }
.tph-switch { display: flex; gap: 4px; background: #f2f4f8; border-radius: 8px; padding: 3px; }
.tph-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.tph-btn:hover { color: #606266; }
.tph-btn.active {
  background: #fff;
  color: #302b63;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  font-weight: 600;
}
.tph-btn-icon { font-size: 15px; }

.tph-right { display: flex; align-items: center; gap: 8px; }
.tph-search { display: flex; align-items: center; gap: 6px; }
.tph-search :deep(.el-input__wrapper) { border-radius: 8px !important; }
.tph-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1.5px solid #e4e9f2;
  background: #fff;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.tph-action-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
  box-shadow: 0 2px 12px rgba(59,130,246,0.15);
  transform: translateY(-1px);
}
.tph-action-btn:active {
  transform: translateY(0);
}
.tph-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
.tph-action-btn .spinning {
  animation: tphSpin 1s linear infinite;
}
@keyframes tphSpin {
  to { transform: rotate(360deg); }
}

.tech-panel-body { padding: 8px 0; }

/* --- 树形浏览 --- */
.tech-tree-container { min-height: 300px; }
.tech-tree { font-size: 13px; }
.tech-tree :deep(.el-tree-node__content) {
  height: 38px;
  padding: 0 12px;
  border-radius: 6px;
  margin: 1px 6px;
  transition: all 0.2s ease;
}
.tech-tree :deep(.el-tree-node__content:hover) {
  background: linear-gradient(135deg, rgba(102,126,234,0.06), rgba(118,75,162,0.04));
}
.tech-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.06));
  box-shadow: inset 3px 0 0 #667eea;
}
.tech-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.ttn-badge {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.badge-typeDomain { background: rgba(245,108,108,0.12); color: #f56c6c; }
.badge-secondClass { background: rgba(64,158,255,0.12); color: #409eff; }
.badge-dataCategory { background: rgba(103,194,58,0.12); color: #67c23a; }
.badge-dataCode { background: rgba(230,162,60,0.12); color: #e6a23c; }
.ttn-code { font-weight: 600; color: #303133; font-family: monospace; }
.ttn-name { color: #606266; }
.ttn-count {
  margin-left: auto;
  font-size: 11px;
  color: #c0c4cc;
  white-space: nowrap;
}


/* ==================== Tab 2: 数据码管理 ==================== */
.quick-search-pagination {
  margin-top: 8px;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(34,211,238,0.03) 100%);
  border-top: 1px solid #eef2f8;
  position: relative;
}
.quick-search-pagination::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #3b82f6, #22d3ee, transparent);
  opacity: 0.5;
}
.tech-pagination :deep(.el-pagination) {
  font-weight: 500;
}
.quick-search-pagination :deep(.el-pagination button) {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e4e9f2;
  background: #fff;
  color: #475569;
  transition: all 0.2s ease;
}
.quick-search-pagination :deep(.el-pagination button:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
  box-shadow: 0 0 12px rgba(59,130,246,0.15);
}
.quick-search-pagination :deep(.el-pagination button:disabled) {
  border-color: #e4e9f2;
  color: #cbd5e1;
  background: #f8fafc;
  box-shadow: none;
}
.quick-search-pagination :deep(.el-pager li) {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e4e9f2;
  background: #fff;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  margin: 0 2px;
}
.quick-search-pagination :deep(.el-pager li:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
}
.quick-search-pagination :deep(.el-pager li.is-active) {
  border-color: transparent;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(59,130,246,0.30);
}
.quick-search-pagination :deep(.el-pagination__total) {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
  margin-right: 12px;
  padding: 0 12px;
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.05));
  border: 1px solid rgba(59,130,246,0.12);
  border-radius: 6px;
  line-height: 28px;
  height: 28px;
  letter-spacing: 0.3px;
}
.quick-search-pagination :deep(.el-pagination__sizes) {
  margin-right: 8px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid rgba(59,130,246,0.15);
  box-shadow: none !important;
  background: linear-gradient(135deg, #fff, rgba(59,130,246,0.04));
  min-height: 32px;
  height: 32px;
  transition: all 0.2s ease;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59,130,246,0.12) !important;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__inner) {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__suffix) {
  color: #3b82f6;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown) {
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(59,130,246,0.12);
  padding: 6px;
  background: rgba(255,255,255,0.98);
  min-width: 100px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item) {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  transition: all 0.15s ease;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item:hover) {
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.04));
  color: #3b82f6;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 600;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected:hover) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.quick-search-pagination :deep(.el-pagination__rightwrapper) {
  gap: 4px;
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
.styled-table :deep(.el-table__header-wrapper .el-table__cell) {
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

/* ==================== 提交记录卡片 ==================== */
.section-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}

.section-header {
  padding: 8px 10px;
  border-bottom: 1px solid #f5f5f5;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
}

/* ==================== 子页面功能介绍卡片 ==================== */
/* 审批待办红点 */
.approval-tab-label { display: inline-flex; align-items: center; gap: 6px; }
.approval-tab-label :deep(.el-badge__content) {
  background: #f56c6c;
  border: none;
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 6px;
  animation: badgePulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(245,108,108,0.4);
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(245,108,108,0.4); }
  50% { transform: scale(1.15); box-shadow: 0 0 16px rgba(245,108,108,0.7); }
}

/* ==================== 炫酷新增按钮 ==================== */
.btn-add-code {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-add-code::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6);
  background-size: 300% 300%;
  animation: btnGradient 4s ease infinite;
  z-index: 0;
}
.btn-add-code::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-add-code:hover::after {
  background: linear-gradient(135deg, #2563eb, #9333ea);
  inset: 1px;
}
.btn-add-code:hover {
  box-shadow: 0 8px 32px rgba(59,130,246,0.35) !important;
  transform: translateY(-1px);
}
.btn-add-code:active {
  transform: translateY(0) !important;
}
.btn-add-code-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 22px;
  height: 100%;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}
.btn-add-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}
.btn-add-code:hover .btn-add-icon {
  transform: rotate(90deg) scale(1.1);
}
.btn-add-text {
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

@keyframes btnGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ==================== 一键重置按钮 ==================== */
.btn-reset {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-reset::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #f97316, #f59e0b);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-reset::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #fffbeb);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-reset:hover::after {
  background: #fff;
  inset: 1px;
}
.btn-reset:hover {
  box-shadow: 0 6px 24px rgba(245,158,11,0.3) !important;
  transform: translateY(-1px);
}
.btn-reset:active {
  transform: translateY(0) !important;
}
.btn-reset-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  height: 100%;
  color: #d97706;
  font-size: 14px;
  font-weight: 600;
}
.btn-reset-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.4s ease;
}
.btn-reset:hover .btn-reset-icon {
  transform: rotate(-60deg);
}

/* ==================== 刷新按钮 ==================== */
.btn-refresh {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-refresh::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #6366f1, #3b82f6);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-refresh::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #f0f4ff);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-refresh:hover::after {
  background: #fff;
  inset: 1px;
}
.btn-refresh:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.3) !important;
  transform: translateY(-1px);
}
.btn-refresh:active {
  transform: translateY(0) !important;
}
.btn-refresh-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  height: 100%;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
}
.btn-refresh-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.4s ease;
}
.btn-refresh:hover .btn-refresh-icon {
  transform: rotate(360deg);
}

/* ==================== 导出Excel按钮 ==================== */
.btn-export {
  border: none !important;
  background: transparent !important;
  padding: 0 20px !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
  color: #fff !important;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}
.btn-export::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981, #06b6d4, #10b981);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-export::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #059669, #0891b2);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-export:hover::after {
  background: linear-gradient(135deg, #10b981, #06b6d4);
}
.btn-export:hover {
  box-shadow: 0 6px 24px rgba(16,185,129,0.3) !important;
  transform: translateY(-1px);
}
.btn-export:active {
  transform: translateY(0) !important;
}
.btn-export .btn-export-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

@keyframes btnGrad {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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

/* 科技风枚举值徽章 */
.enum-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  position: relative;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
  margin-right: 4px;
}
.enum-badge::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  pointer-events: none;
}
.enum-submit {
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.enum-submit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
}
.enum-submit:active {
  transform: translateY(0);
}
.enum-delete {
  color: #fff;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 2px 8px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.enum-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
}
.enum-delete:active {
  transform: translateY(0);
}
.reject-hint {
  display: block;
  margin-top: 2px;
  color: #f56c6c;
  font-size: 11px;
  line-height: 1.4;
  max-width: 160px;
}

/* 提交记录表各列均分宽度 */
.styled-table.submissions-table .el-table__body-wrapper table,
.styled-table.submissions-table .el-table__header-wrapper table {
  table-layout: fixed !important;
}
.styled-table.submissions-table .el-table__body-wrapper {
  overflow-x: hidden !important;
}
</style>
