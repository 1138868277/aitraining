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
      :title="isEditing ? '编辑场站' : '新增场站'"
      width="500px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item
          label="场站编码"
          :rules="[
            { required: true, message: '请输入场站编码', trigger: 'blur' },
            { pattern: /^[A-Za-z0-9]{4}$/, message: '场站编码必须为4位数字或字母', trigger: 'blur' },
          ]"
          prop="stationCode"
        >
          <el-input
            v-model="form.stationCode"
            placeholder="4位数字或字母"
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
        <el-form-item label="场站类型" prop="stationType">
          <el-select v-model="form.stationType" placeholder="请选择场站类型" filterable style="width:100%">
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
    if (!/^[A-Za-z0-9]{4}$/.test(entry.stationCode)) {
      ElMessage.warning(`场站编码 ${entry.stationCode} 必须为4位数字或字母，请检查后重试`);
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
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 20px;
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
  width: 350px;
  height: 350px;
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
  padding: 20px 30px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}
.tech-hero-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
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
  width: 22px;
  height: 22px;
}
.tech-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}
.tech-hero-title {
  font-size: 28px;
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
