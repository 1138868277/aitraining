<template>
  <div class="station-tab">
    <!-- 顶部横幅 -->
    <div class="tech-hero">
      <div class="tech-hero-bg">
        <div class="tech-grid"></div>
        <div class="tech-glow tech-glow-1"></div>
        <div class="tech-glow tech-glow-2"></div>
      </div>
      <div class="tech-hero-content">
        <div class="tech-hero-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="10" width="6" height="12" rx="1"/><rect x="9" y="6" width="6" height="16" rx="1"/><rect x="16" y="3" width="6" height="19" rx="1"/></svg>
        </div>
        <div class="tech-hero-text">
          <div class="tech-hero-title">场站管理</div>
          <div class="tech-hero-desc">统一管理新能源场站信息，支持新增、编辑及批量导入导出</div>
        </div>
      </div>
    </div>

    <!-- 工具栏卡片 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="🔍 搜索场站编码或名称"
          clearable
          class="search-input"
          size="default"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button class="btn-search" @click="handleSearch">
          <span class="btn-search-inner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style="margin-left:4px;">查询</span>
          </span>
        </el-button>
        <el-button class="btn-reset" @click="resetSearch">
          <span class="btn-reset-inner">
            <span class="btn-reset-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </span>
            <span class="btn-reset-text">重置</span>
          </span>
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button class="btn-add-code" @click="addDialogVisible = true">
          <span class="btn-add-code-inner">
            <span class="btn-add-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            <span class="btn-add-text">新增场站</span>
          </span>
        </el-button>
        <el-button class="btn-batch" @click="showBatchDialog = true">
          <span class="btn-batch-inner">
            <span class="btn-batch-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </span>
            <span class="btn-batch-text">批量新增</span>
          </span>
        </el-button>
        <el-button class="btn-export" :disabled="stationList.length === 0" @click="handleExport">
          <span class="btn-export-inner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span style="margin-left:4px;">导出Excel</span>
          </span>
        </el-button>
        <el-popconfirm
          title="确认删除所有场站数据？此操作不可恢复"
          confirm-button-text="确认删除"
          cancel-button-text="取消"
          @confirm="handleDeleteAll"
        >
          <template #reference>
            <el-button class="btn-delete" type="button" :disabled="stationList.length === 0">
              <span class="btn-delete-inner">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                <span style="margin-left:4px;">一键删除</span>
              </span>
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 统计小卡片 -->
    <div class="stats-row">
      <div class="stat-card stat-card-total">
        <div class="stat-card-icon">📋</div>
        <div class="stat-card-body">
          <div class="stat-card-value">{{ total }}</div>
          <div class="stat-card-label">总记录数</div>
        </div>
      </div>
      <div class="stat-card stat-card-page">
        <div class="stat-card-icon">📄</div>
        <div class="stat-card-body">
          <div class="stat-card-value">{{ stationList.length }}</div>
          <div class="stat-card-label">当前页</div>
        </div>
      </div>
      <div class="stat-card stat-card-search" v-if="searchKeyword">
        <div class="stat-card-icon">🔍</div>
        <div class="stat-card-body">
          <div class="stat-card-value">{{ total }}</div>
          <div class="stat-card-label">搜索结果</div>
        </div>
      </div>
    </div>

    <!-- 场站表格 -->
    <div class="table-container">
      <el-table
        :data="stationList"
        stripe
        style="width: 100%"
        size="default"
        v-loading="loading"
        class="station-table"
        :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="station_code" label="场站编码" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; font-size: 14px; font-weight: 600;">{{ row.station_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="station_name" label="场站名称">
          <template #default="{ row }">
            <span class="station-name-cell">{{ row.station_name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="场站类型" width="140" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.station_type ? 'primary' : 'info'" effect="plain">
              {{ row.station_type || '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="management_domain" label="所属区域">
          <template #default="{ row }">
            <span v-if="row.management_domain" class="region-tag">{{ row.management_domain }}</span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center">
          <template #default="{ row }">
            <span class="time-cell">{{ formatTime(row.create_tm) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)" class="action-btn">
              <el-icon style="margin-right: 2px;"><Edit /></el-icon>编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm
              :title="`确认删除场站「${row.station_code}」？`"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button link type="danger" size="small" class="action-btn">
                  <el-icon style="margin-right: 2px;"><Delete /></el-icon>删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && stationList.length === 0" description="暂无场站数据">
        <template #image>
          <div class="empty-icon">🏗️</div>
        </template>
        <el-button type="primary" @click="addDialogVisible = true">新增首个场站</el-button>
      </el-empty>

      <!-- 分页 -->
      <div v-if="total > 0" class="quick-search-pagination tech-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadStationList"
          @size-change="loadStationList"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      width="560px"
      :close-on-click-modal="false"
      @close="resetForm"
      class="station-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dh-icon"><el-icon><Plus /></el-icon></div>
          <div class="dh-text">
            <div class="dh-title">{{ isEditing ? '编辑场站' : '新增场站' }}</div>
            <div class="dh-sub">{{ isEditing ? '修改场站基本信息' : '添加新的场站到系统中' }}</div>
          </div>
        </div>
      </template>
      <el-form ref="formRef" :model="form" label-position="top" class="station-dialog-form">
        <div class="form-section">
          <div class="section-label">
            <span class="sl-dot"></span>
            <span class="sl-text">基本信息</span>
            <span class="sl-line"></span>
          </div>
          <div class="form-grid">
            <div class="form-item" :class="{ active: form.stationCode }">
              <div class="fi-label">
                <span class="fi-icon">📡</span>
                <span>场站编码</span>
                <span class="fi-req">*</span>
              </div>
              <el-input
                v-model="form.stationCode"
                placeholder="4位数字或字母"
                maxlength="4"
                :disabled="isEditing"
              />
            </div>
            <div class="form-item" :class="{ active: form.stationName }">
              <div class="fi-label">
                <span class="fi-icon">🏭</span>
                <span>场站名称</span>
                <span class="fi-req">*</span>
              </div>
              <el-input v-model="form.stationName" placeholder="请输入场站名称" maxlength="100" />
            </div>
            <div class="form-item" :class="{ active: form.stationType }">
              <div class="fi-label">
                <span class="fi-icon">⚡</span>
                <span>场站类型</span>
              </div>
              <el-select v-model="form.stationType" placeholder="请选择场站类型" filterable>
                <el-option label="— 未设置 —" value="" />
                <el-option label="F1 风电" value="F1" />
                <el-option label="F2 风电" value="F2" />
                <el-option label="F3 风电" value="F3" />
                <el-option label="F4 风电" value="F4" />
                <el-option label="G1 光伏" value="G1" />
                <el-option label="G2 光伏" value="G2" />
                <el-option label="S1 水电" value="S1" />
                <el-option label="Y0 储能" value="Y0" />
              </el-select>
            </div>
            <div class="form-item" :class="{ active: form.managementDomain }">
              <div class="fi-label">
                <span class="fi-icon">🌐</span>
                <span>所属区域</span>
              </div>
              <el-input v-model="form.managementDomain" placeholder="请输入所属区域（可选）" maxlength="50" />
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="df-cancel" @click="addDialogVisible = false">取消</el-button>
          <el-button class="df-confirm" type="primary" :loading="submitting" @click="confirmSubmit">
            <el-icon v-if="!submitting" style="margin-right:4px;"><Plus /></el-icon>
            <span>{{ isEditing ? '确认更新' : '确认新增' }}</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量新增对话框 -->
    <el-dialog v-model="showBatchDialog" width="600px" :close-on-click-modal="false" @close="resetBatchForm" class="station-dialog batch-dialog">
      <template #header>
        <div class="dialog-header">
          <div class="dh-icon"><el-icon><DocumentAdd /></el-icon></div>
          <div class="dh-text">
            <div class="dh-title">批量新增场站</div>
            <div class="dh-sub">批量导入场站数据，一次新增多条记录</div>
          </div>
        </div>
      </template>
      <div class="batch-body">
        <div class="form-section">
          <div class="section-label">
            <span class="sl-dot"></span>
            <span class="sl-text">粘贴数据</span>
            <span class="sl-line"></span>
          </div>
          <div class="batch-hint-card">
            <div class="bhc-icon">📋</div>
            <div class="bhc-text">
              <div class="bhc-title">格式说明</div>
              <div class="bhc-desc">每行一条，字段之间用空格或Tab分隔，支持2~4个字段</div>
            </div>
          </div>
          <div class="batch-format-examples">
            <div class="bfe-item">
              <span class="bfe-label">2字段：编码 + 名称</span>
              <code>1001 张三风电场</code>
            </div>
            <div class="bfe-item">
              <span class="bfe-label">3字段：编码 + 名称 + 管理域</span>
              <code>1001 张三风电场 云南</code>
            </div>
            <div class="bfe-item">
              <span class="bfe-label">4字段：编码 + 名称 + 类型 + 管理域</span>
              <code>1001 张三风电场 F 云南</code>
            </div>
          </div>
          <div style="margin-bottom:12px;padding:8px 12px;background:#fff7e6;border-radius:8px;font-size:12px;color:#d46b08">
            类型编码: F=风电 G=光伏 S=水电 F1~F4=风电 G1~G2=光伏 S1=水电 Y0=储能
          </div>
          <el-input
            v-model="batchText"
            type="textarea"
            :rows="8"
            placeholder="请粘贴场站数据，每行一条&#10;编码 名称&#10;编码 名称 管理域&#10;编码 名称 类型 管理域"
            class="batch-textarea"
          />
        </div>
        <div class="form-section" v-if="parsedBatchEntries.length > 0">
          <div class="section-label">
            <span class="sl-dot"></span>
            <span class="sl-text">解析预览</span>
            <span class="sl-count">{{ parsedBatchEntries.length }} 条</span>
            <span class="sl-line"></span>
          </div>
          <div class="batch-preview-list">
            <div
              v-for="(entry, index) in parsedBatchEntries"
              :key="index"
              class="batch-tag-item"
              :style="{ '--i': index }"
            >
              <span class="bti-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="bti-code">{{ entry.stationCode }}</span>
              <span class="bti-name">{{ entry.stationName }}</span>
              <span v-if="entry.stationType" class="bti-type">{{ entry.stationType }}</span>
              <span v-if="entry.managementDomain" class="bti-region">{{ entry.managementDomain }}</span>
              <button class="bti-del" @click="removeBatchEntry(index)">✕</button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="df-cancel" @click="showBatchDialog = false">取消</el-button>
          <el-button class="df-confirm" type="primary" :loading="batchSubmitting" :disabled="parsedBatchEntries.length === 0" @click="confirmBatch">
            <el-icon v-if="!batchSubmitting" style="margin-right:4px;"><Plus /></el-icon>
            <span>确认新增 ({{ parsedBatchEntries.length }} 条)</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Plus, DocumentAdd, Download, Delete, Edit } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import * as stationService from '@/services/station';
import type { StationItem } from '@/services/station';

// ========== 列表 ==========
const stationList = ref<StationItem[]>([]);
const loading = ref(false);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const searchKeyword = ref('');

async function loadStationList() {
  loading.value = true;
  try {
    const result = await stationService.listStation(pageNum.value, pageSize.value, searchKeyword.value || undefined);
    stationList.value = result.list;
    total.value = result.total;
  } catch (err: any) {
    ElMessage.error(err.message || '加载场站列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pageNum.value = 1;
  loadStationList();
}

function resetSearch() {
  searchKeyword.value = '';
  pageNum.value = 1;
  loadStationList();
}

// ========== 新增/编辑 ==========
const addDialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const submitting = ref(false);
const formRef = ref<any>(null);

const form = reactive({
  stationCode: '',
  stationName: '',
  stationType: '',
  managementDomain: '',
});

function resetForm() {
  form.stationCode = '';
  form.stationName = '';
  form.stationType = '';
  form.managementDomain = '';
  isEditing.value = false;
  editingId.value = null;
}

function handleEdit(row: StationItem) {
  isEditing.value = true;
  editingId.value = row.station_id;
  form.stationCode = row.station_code;
  form.stationName = row.station_name;
  form.stationType = row.station_type || '';
  form.managementDomain = row.management_domain || '';
  addDialogVisible.value = true;
}

async function confirmSubmit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  submitting.value = true;
  try {
    if (isEditing.value && editingId.value) {
      await stationService.updateStation(editingId.value, {
        stationName: form.stationName,
        stationType: form.stationType || undefined,
        managementDomain: form.managementDomain || undefined,
      });
      ElMessage.success('更新成功');
    } else {
      await stationService.createStation({
        stationCode: form.stationCode,
        stationName: form.stationName,
        stationType: form.stationType || undefined,
        managementDomain: form.managementDomain || undefined,
      });
      ElMessage.success('新增成功');
    }
    addDialogVisible.value = false;
    loadStationList();
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败');
  } finally {
    submitting.value = false;
  }
}

// ========== 删除 ==========
async function handleDelete(row: StationItem) {
  try {
    await stationService.deleteStation(row.station_id);
    ElMessage.success('删除成功');
    loadStationList();
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败');
  }
}

/** 一键删除所有场站 */
async function handleDeleteAll() {
  try {
    const result = await stationService.deleteAllStation();
    ElMessage.success(`已删除 ${result.deletedCount} 条场站数据`);
    loadStationList();
  } catch (err: any) {
    ElMessage.error(err.message || '删除失败');
  }
}

// ========== 批量新增 ==========
const showBatchDialog = ref(false);
const batchText = ref('');
const batchSubmitting = ref(false);

interface BatchEntry {
  stationCode: string;
  stationName: string;
  stationType?: string;
  managementDomain?: string;
}

const parsedBatchEntries = computed<BatchEntry[]>(() => {
  return batchText.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\t\s]+/);
      const entry: BatchEntry = {
        stationCode: (parts[0] || '').toUpperCase(),
        stationName: parts[1] || '',
      };
      if (parts.length >= 4) {
        entry.stationType = normalizeStationType(parts[2]);
        entry.managementDomain = parts[3] || undefined;
      } else if (parts.length >= 3) {
        // 3字段：编码 名称 管理域（自动判断第三个是区域还是类型）
        const third = parts[2].trim();
        if (/^[FGSY]\d?$|^[FGSY]$/i.test(third)) {
          entry.stationType = normalizeStationType(third);
        } else {
          entry.managementDomain = third || undefined;
        }
      }
      return entry;
    })
    .filter(item => item.stationCode.length > 0 && item.stationName.length > 0);
});

function normalizeStationType(val: string): string {
  const v = val.toUpperCase().trim();
  if (/^F\d?$/.test(v)) return v.startsWith('F') ? (v.length === 1 ? 'F' : v) : v;
  if (/^G\d?$/.test(v)) return v.startsWith('G') ? (v.length === 1 ? 'G' : v) : v;
  if (/^S\d?$/.test(v)) return v.startsWith('S') ? (v.length === 1 ? 'S' : v) : v;
  if (v === 'Y0') return 'Y0';
  return '';
}

function removeBatchEntry(index: number) {
  const lines = batchText.value.split('\n').filter(l => l.trim());
  lines.splice(index, 1);
  batchText.value = lines.join('\n');
}

function resetBatchForm() {
  batchText.value = '';
}

async function confirmBatch() {
  if (parsedBatchEntries.value.length === 0) {
    ElMessage.warning('请至少输入一条有效数据');
    return;
  }
  for (const entry of parsedBatchEntries.value) {
    if (!/^[A-Za-z0-9]{4}$/.test(entry.stationCode)) {
      ElMessage.warning(`场站编码 ${entry.stationCode} 必须为4位数字或字母，请检查后重试`);
      return;
    }
  }
  batchSubmitting.value = true;
  try {
    const entries = parsedBatchEntries.value.map(e => ({
      stationCode: e.stationCode,
      stationName: e.stationName,
      stationType: e.stationType || undefined,
      managementDomain: e.managementDomain || undefined,
    }));
    const result = await stationService.batchCreateStation(entries);
    ElMessage.success(`成功新增 ${result.insertedCount} 条场站数据`);
    showBatchDialog.value = false;
    resetBatchForm();
    loadStationList();
  } catch (err: any) {
    ElMessage.error(err.message || '批量新增失败');
  } finally {
    batchSubmitting.value = false;
  }
}

// ========== 导出Excel ==========
function formatTime(tm: string): string {
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function handleExport() {
  try {
    const items = await stationService.exportAllStation();
    const data = items.map((item, index) => ({
      '序号': index + 1,
      '场站编码': item.station_code,
      '场站名称': item.station_name,
      '场站类型': item.station_type || '',
      '所属区域': item.management_domain || '',
      '创建时间': formatTime(item.create_tm),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '场站数据');
    XLSX.writeFile(wb, `场站数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`已导出 ${data.length} 条场站数据`);
  } catch (err: any) {
    ElMessage.error(err.message || '导出失败');
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  loadStationList();
});
</script>

<style scoped>
/* ==================== 全局 ==================== */
.station-tab {
  padding: 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 科技风英雄卡片 ==================== */
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

/* ==================== 工具栏卡片 ==================== */
.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 280px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.25s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 inset;
}

/* ==================== 统计小卡片 ==================== */
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  flex: 1;
  transition: all 0.3s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card-icon {
  font-size: 28px;
  line-height: 1;
}

.stat-card-body {
  display: flex;
  flex-direction: column;
}

.stat-card-value {
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1d;
  line-height: 1.2;
}

.stat-card-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.stat-card-total { border-left: 3px solid #3b82f6; }
.stat-card-page { border-left: 3px solid #10b981; }
.stat-card-search { border-left: 3px solid #f59e0b; }

/* ==================== 表格容器 ==================== */
.table-container {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  padding: 4px;
  overflow: hidden;
}

.station-table {
  border: none !important;
}
.station-table :deep(table) {
  table-layout: fixed;
}
.station-table :deep(colgroup col:nth-child(1)) { width: 60px; }
.station-table :deep(colgroup col:nth-child(6)) { width: 160px; }

.station-table :deep(.el-table__inner-wrapper) {
  border: none !important;
}

.station-table :deep(.el-table__body tr) {
  transition: background 0.2s ease;
}

.station-table :deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}

.station-table :deep(.el-table__cell) {
  padding: 8px 0 !important;
}
.station-table :deep(.cell) {
  text-align: center;
}

.station-table :deep(.el-table__header-wrapper tr) {
  border-top: none !important;
}

.station-name-cell {
  font-weight: 500;
  color: #1d1d1d;
}

.region-tag {
  display: inline-block;
  background: #f0fdf4;
  color: #16a34a;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.no-data {
  color: #d0d0d0;
}

.time-cell {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.action-btn {
  font-size: 12px;
}

.action-btn:hover {
  opacity: 0.8;
}

.empty-icon {
  font-size: 48px;
  line-height: 1;
}

/* ==================== 分页 ==================== */
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

/* ==================== 批量对话框 ==================== */
.batch-dialog {
  --batch-primary: #3b7bbd;
}
.batch-body {
  padding: 4px 28px;
}
.batch-body .form-section {
  margin-bottom: 20px;
}
.batch-body .form-section:last-child {
  margin-bottom: 0;
}

.batch-hint-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f6ff, #eef2ff);
  border: 1px solid rgba(59, 123, 189, 0.12);
  border-radius: 10px;
  margin-bottom: 12px;
}
.bhc-icon { font-size: 24px; line-height: 1; }
.bhc-text { flex: 1; }
.bhc-title {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.bhc-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 1px;
}

.batch-format-examples {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.bfe-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1.5px solid #e8ecf1;
  border-radius: 10px;
  transition: all 0.25s ease;
}
.bfe-item:hover {
  border-color: #c1d3e8;
  background: #f5f8fe;
}
.bfe-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.3px;
}
.bfe-item code {
  font-size: 12px;
  color: #3b7bbd;
  font-weight: 600;
  background: rgba(59, 123, 189, 0.06);
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.batch-textarea :deep(.el-textarea__inner) {
  border-radius: 10px;
  border: 1.5px solid #e8ecf1;
  box-shadow: none;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  line-height: 1.6;
  padding: 12px 14px;
  transition: all 0.25s ease;
  background: #fafbfc;
}
.batch-textarea :deep(.el-textarea__inner:hover) {
  border-color: #c1d3e8;
  background: #f5f8fe;
}
.batch-textarea :deep(.el-textarea__inner:focus) {
  border-color: #3b7bbd;
  box-shadow: 0 0 0 3px rgba(59, 123, 189, 0.08);
  background: #fff;
}

.batch-preview-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.batch-tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1.5px solid #e8ecf1;
  border-radius: 8px;
  transition: all 0.25s ease;
  animation: tagIn 0.25s ease both;
  animation-delay: calc(var(--i, 0) * 0.04s);
}
.batch-tag-item:hover {
  border-color: #c1d3e8;
  background: #f5f8fe;
}
@keyframes tagIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.bti-index {
  width: 24px;
  font-size: 11px;
  font-weight: 700;
  color: #c0c8d6;
  text-align: center;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.bti-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #3b7bbd;
  width: 70px;
  flex-shrink: 0;
}
.bti-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bti-type {
  font-size: 11px;
  color: #8b5cf6;
  background: #f5f3ff;
  padding: 1px 8px;
  border-radius: 4px;
  flex-shrink: 0;
  font-weight: 600;
}
.bti-region {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f4f8;
  padding: 1px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.bti-del {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #c0c8d6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.bti-del:hover {
  color: #f56c6c;
  background: #fef0f0;
}

/* ==================== 对话框科技风 ==================== */
.station-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
  background: linear-gradient(145deg, #ffffff, #fafbfc);
}
.station-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border: none;
}
.station-dialog :deep(.el-dialog__body) {
  padding: 0 28px 8px;
}
.station-dialog :deep(.el-dialog__footer) {
  padding: 12px 28px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
  border-radius: 0 0 16px 16px;
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 28px 16px;
  background: linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 40%, #2d5a8e 100%);
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
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
}
.dh-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.08);
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
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.station-dialog-form { padding: 6px 0; }
.form-section { margin-bottom: 22px; }

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
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.sl-text {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.3px;
}
.sl-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, #e2e8f0, transparent);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-item {
  background: #f8fafc;
  border: 1.5px solid #e8ecf1;
  border-radius: 12px;
  padding: 14px 14px 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.form-item:hover {
  border-color: #c1d3e8;
  background: #f5f8fe;
}
.form-item.active {
  border-color: #3b7bbd;
  background: #f0f6ff;
  box-shadow: 0 0 0 3px rgba(59, 123, 189, 0.08);
}

.fi-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}
.fi-icon { font-size: 14px; }
.fi-req { color: #f56c6c; margin-left: 1px; }

.form-item :deep(.el-input__wrapper),
.form-item :deep(.el-select .el-input__wrapper) {
  background: #fff;
  border: none;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  border-radius: 8px;
  transition: all 0.25s ease;
  padding: 2px 8px;
}
.form-item :deep(.el-input__wrapper:hover),
.form-item :deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #94a3b8 inset;
}
.form-item :deep(.el-input__wrapper.is-focus),
.form-item :deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(59, 123, 189, 0.25) inset;
}
.form-item :deep(.el-input__inner) {
  height: 32px;
  font-size: 13px;
}
.form-item :deep(.el-select) { width: 100%; }

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
  background: linear-gradient(135deg, #0f1b2d, #1e3a5f);
  border: none;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}
.df-confirm:hover {
  background: linear-gradient(135deg, #1e3a5f, #2d5a8e);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(30, 58, 95, 0.35);
}
.df-confirm:active {
  transform: translateY(0);
}
.df-confirm.is-disabled {
  background: linear-gradient(135deg, #94a3b8, #b0bec5) !important;
}

/* ==================== 过渡动效 ==================== */
.station-table :deep(.el-table__body tr) {
  animation: rowIn 0.25s ease both;
}

@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
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

/* ==================== 查询按钮 ==================== */
.btn-search {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-search::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #6366f1, #3b82f6);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-search::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #f0f4ff);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-search:hover::after {
  background: #fff;
  inset: 1px;
}
.btn-search:hover {
  box-shadow: 0 6px 24px rgba(59,130,246,0.3) !important;
  transform: translateY(-1px);
}
.btn-search:active {
  transform: translateY(0) !important;
}
.btn-search-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  height: 100%;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
}

/* ==================== 重置按钮 ==================== */
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

/* ==================== 批量新增按钮 ==================== */
.btn-batch {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-batch::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #06b6d4, #8b5cf6);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-batch::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #f5f3ff);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-batch:hover::after {
  background: #fff;
  inset: 1px;
}
.btn-batch:hover {
  box-shadow: 0 6px 24px rgba(139,92,246,0.3) !important;
  transform: translateY(-1px);
}
.btn-batch:active {
  transform: translateY(0) !important;
}
.btn-batch-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  height: 100%;
  color: #7c3aed;
  font-size: 14px;
  font-weight: 600;
}
.btn-batch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}
.btn-batch:hover .btn-batch-icon {
  transform: scale(1.15);
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
.btn-export.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-export.is-disabled::before {
  animation: none;
}

/* ==================== 一键删除按钮 ==================== */
.btn-delete {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-delete::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #f97316, #ef4444);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-delete::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #fff, #fef2f2);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-delete:hover::after {
  background: #fff;
  inset: 1px;
}
.btn-delete:hover {
  box-shadow: 0 6px 24px rgba(239,68,68,0.3) !important;
  transform: translateY(-1px);
}
.btn-delete:active {
  transform: translateY(0) !important;
}
.btn-delete.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-delete.is-disabled::before {
  animation: none;
}
.btn-delete-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 18px;
  height: 100%;
  color: #dc2626;
  font-size: 14px;
  font-weight: 600;
}

@keyframes btnGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes btnGrad {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
