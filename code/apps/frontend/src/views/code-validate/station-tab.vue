<template>
  <div class="station-tab">
    <!-- 顶部横幅 -->
    <div class="station-hero">
      <div class="hero-icon">🏭</div>
      <div class="hero-text">
        <div class="hero-title">场站管理</div>
        <div class="hero-subtitle">统一维护新能源场站基本信息，支持新增、编辑、批量导入和导出</div>
      </div>
      <div class="hero-stats">
        <div class="stat-badge">
          <span class="stat-num">{{ total }}</span>
          <span class="stat-label">场站总数</span>
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
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="addDialogVisible = true">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon>新增场站
        </el-button>
        <el-button @click="showBatchDialog = true">
          <el-icon style="margin-right: 4px;"><DocumentAdd /></el-icon>批量新增
        </el-button>
        <el-button :disabled="stationList.length === 0" @click="handleExport">
          <el-icon style="margin-right: 4px;"><Download /></el-icon>导出Excel
        </el-button>
        <el-popconfirm
          title="确认删除所有场站数据？此操作不可恢复"
          confirm-button-text="确认删除"
          cancel-button-text="取消"
          @confirm="handleDeleteAll"
        >
          <template #reference>
            <el-button type="danger" :disabled="stationList.length === 0">
              <el-icon style="margin-right: 4px;"><Delete /></el-icon>一键删除
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
        <el-table-column prop="station_code" label="场站编码" width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; font-size: 14px; font-weight: 600;">{{ row.station_code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="station_name" label="场站名称" min-width="180">
          <template #default="{ row }">
            <span class="station-name-cell">{{ row.station_name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="management_domain" label="所属区域" min-width="150">
          <template #default="{ row }">
            <span v-if="row.management_domain" class="region-tag">{{ row.management_domain }}</span>
            <span v-else class="no-data">—</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" align="center">
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
      <div v-if="total > 0" class="pagination-wrapper">
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
      :title="isEditing ? '编辑场站' : '新增场站'"
      width="500px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item
          label="场站编码"
          :rules="[
            { required: true, message: '请输入场站编码', trigger: 'blur' },
            { pattern: /^\d{4}$/, message: '场站编码必须为4位数字', trigger: 'blur' },
          ]"
          prop="stationCode"
        >
          <el-input
            v-model="form.stationCode"
            placeholder="4位数字编码"
            maxlength="4"
            :disabled="isEditing"
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item
          label="场站名称"
          :rules="[
            { required: true, message: '请输入场站名称', trigger: 'blur' },
            { max: 100, message: '场站名称不能超过100个字符', trigger: 'blur' },
          ]"
          prop="stationName"
        >
          <el-input v-model="form.stationName" placeholder="请输入场站名称" maxlength="100" />
        </el-form-item>
        <el-form-item label="所属区域" prop="managementDomain">
          <el-input v-model="form.managementDomain" placeholder="请输入所属区域（可选）" maxlength="50" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量新增对话框 -->
    <el-dialog v-model="showBatchDialog" title="批量新增场站" width="600px" @close="resetBatchForm">
      <div class="batch-hint">
        请粘贴场站数据，每行一条，格式：<code>编码 名称</code>，编码和名称之间用空格或Tab分隔。
        <br>例如：<code>1001 张三风电场</code>
        <br>如包含所属区域，格式：<code>编码 名称 区域</code>
      </div>
      <el-input
        v-model="batchText"
        type="textarea"
        :rows="8"
        placeholder="请粘贴场站数据，每行一条&#10;编码 名称&#10;编码 名称 区域"
      />
      <div class="batch-preview" v-if="parsedBatchEntries.length > 0">
        <div class="batch-preview-title">已解析 {{ parsedBatchEntries.length }} 条：</div>
        <div class="batch-preview-list">
          <el-tag
            v-for="(entry, index) in parsedBatchEntries"
            :key="index"
            size="small"
            closable
            @close="removeBatchEntry(index)"
          >
            {{ entry.stationCode }} {{ entry.stationName }}
            <template v-if="entry.managementDomain">({{ entry.managementDomain }})</template>
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" :disabled="parsedBatchEntries.length === 0" @click="confirmBatch">
          确认新增 ({{ parsedBatchEntries.length }} 条)
        </el-button>
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
  managementDomain: '',
});

function resetForm() {
  form.stationCode = '';
  form.stationName = '';
  form.managementDomain = '';
  isEditing.value = false;
  editingId.value = null;
}

function handleEdit(row: StationItem) {
  isEditing.value = true;
  editingId.value = row.station_id;
  form.stationCode = row.station_code;
  form.stationName = row.station_name;
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
        managementDomain: form.managementDomain || undefined,
      });
      ElMessage.success('更新成功');
    } else {
      await stationService.createStation({
        stationCode: form.stationCode,
        stationName: form.stationName,
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
  managementDomain?: string;
}

const parsedBatchEntries = computed<BatchEntry[]>(() => {
  return batchText.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\t\s]+/);
      return {
        stationCode: parts[0] || '',
        stationName: parts[1] || '',
        managementDomain: parts[2] || undefined,
      };
    })
    .filter(item => item.stationCode.length > 0 && item.stationName.length > 0);
});

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
    if (!/^\d{4}$/.test(entry.stationCode)) {
      ElMessage.warning(`场站编码 ${entry.stationCode} 必须为4位数字，请检查后重试`);
      return;
    }
  }
  batchSubmitting.value = true;
  try {
    const result = await stationService.batchCreateStation(parsedBatchEntries.value);
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

/* ==================== 顶部横幅 ==================== */
.station-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #1a3a8a 0%, #2563eb 50%, #3b82f6 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.25);
  position: relative;
  overflow: hidden;
}

.station-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  border-radius: 50%;
}

.station-hero::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: 10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  border-radius: 50%;
}

.hero-icon {
  font-size: 36px;
  line-height: 1;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.hero-text {
  flex: 1;
  position: relative;
  z-index: 1;
}

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

.hero-stats {
  position: relative;
  z-index: 1;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-num {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
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
.pagination-wrapper {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}

/* ==================== 批量提示 ==================== */
.batch-hint {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.8;
}

.batch-hint code {
  background: #f0f5ff;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
}

.batch-preview {
  margin-top: 12px;
}

.batch-preview-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.batch-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ==================== 对话框美化 ==================== */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding: 20px 24px 0;
  font-weight: 700;
  font-size: 17px;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
}

:deep(.el-dialog__footer) {
  padding: 0 24px 20px;
  border: none;
}

/* ==================== 过渡动效 ==================== */
.station-table :deep(.el-table__body tr) {
  animation: rowIn 0.25s ease both;
}

@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
