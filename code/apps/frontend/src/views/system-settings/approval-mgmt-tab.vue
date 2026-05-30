<template>
  <div class="approval-mgmt-tab">
    <!-- 子标签：待审批 / 已审批 -->
    <el-tabs v-model="activeSubTab" class="sub-tabs" @tab-change="onTabChange">
      <el-tab-pane label="待审批" name="pending" />
      <el-tab-pane label="已审批" name="done" />
    </el-tabs>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <span class="section-label">审批列表</span>
      </div>
      <div class="filter-right">
        <el-select v-if="activeSubTab === 'done'" v-model="filterStatus" placeholder="审批状态" style="width:140px" clearable @change="loadList">
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-button class="btn-search" @click="loadList">
          <span class="btn-search-inner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span style="margin-left:4px;">搜索</span>
          </span>
        </el-button>
        <el-button class="btn-reset" @click="resetFilter">
          <span class="btn-reset-inner">
            <span class="btn-reset-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </span>
            <span class="btn-reset-text">重置</span>
          </span>
        </el-button>
      </div>
    </div>

    <!-- 审批表格 -->
    <div class="table-container">
      <el-table :data="items" stripe style="width:100%" v-loading="loading" empty-text="暂无审批记录">
        <el-table-column type="index" label="序号" align="center">
          <template #default="{ $index }">
            {{ ($index + 1) + (pageNum - 1) * pageSize }}
          </template>
        </el-table-column>
        <el-table-column label="类型" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.typeCode)" size="small" effect="plain">{{ typeLabel(row.typeCode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二级类码">
          <template #default="{ row }">
            <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none;">{{ row.secondClassCode }}</el-tag>
            <span class="cell-name-tag">{{ row.secondClassName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据类码">
          <template #default="{ row }">
            <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none;">{{ row.dataCategoryCode }}</el-tag>
            <span class="cell-name-tag">{{ row.dataCategoryName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据码">
          <template #default="{ row }">
            <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none;">{{ row.dataCode }}</el-tag>
            <span class="cell-name-tag">{{ row.dataName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提交区域" align="center" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain" :color="regionColor(row.sourceTenant)" style="color:#fff;border:none;">{{ regionLabel(row.sourceTenant) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning" size="small">待审批</el-tag>
            <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间">
          <template #default="{ row }">
            <span class="time-cell">{{ formatTime(row.submitTm) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批时间">
          <template #default="{ row }">
            <span class="time-cell">{{ row.status === 'pending' ? '-' : formatTime(row.reviewTm) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="primary" link size="small" @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
            </template>
            <span v-else-if="row.status === 'rejected' && row.rejectReason" style="color: #f56c6c; font-size: 12px;">
              {{ row.rejectReason }}
            </span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && items.length === 0" description="暂无审批记录" />
      <div v-if="total > 0" class="quick-search-pagination tech-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </div>

    <!-- 驳回对话框 -->
    <el-dialog v-model="rejectDialog" title="驳回原因" width="420px" :close-on-click-modal="false">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入驳回原因，区域用户将看到此原因"
      />
      <template #footer>
        <el-button class="btn-dialog-cancel" @click="rejectDialog = false">取消</el-button>
        <el-button class="btn-dialog-reject" :loading="rejecting" @click="confirmReject">
          <span class="btn-dialog-reject-inner">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span style="margin-left:4px;">确定驳回</span>
          </span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as approvalService from '@/services/approval';

const emit = defineEmits<{ refresh: [] }>();

const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const activeSubTab = ref('pending');
const filterStatus = ref('');

const rejectDialog = ref(false);
const rejectReason = ref('');
const rejecting = ref(false);
const currentRejectId = ref<number | null>(null);

async function loadList() {
  loading.value = true;
  try {
    let status: string | undefined;
    if (activeSubTab.value === 'pending') {
      status = 'pending';
    } else if (activeSubTab.value === 'done') {
      status = filterStatus.value || 'approved,rejected';
    }
    const result = await approvalService.getApprovalList(
      pageNum.value,
      pageSize.value,
      status || undefined,
    );
    items.value = result.items;
    total.value = result.total;
  } catch {
    ElMessage.error('加载审批列表失败');
  } finally {
    loading.value = false;
  }
}

function resetFilter() {
  filterStatus.value = '';
  pageNum.value = 1;
  loadList();
}

function onTabChange() {
  filterStatus.value = '';
  pageNum.value = 1;
  loadList();
}

async function handleApprove(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要通过「${row.dataCode} ${row.dataName}」的审批吗？通过后将自动下发给所有区域。`,
      '确认通过',
      { confirmButtonText: '确定通过', cancelButtonText: '取消', type: 'info' },
    );
    await approvalService.approveApproval(row.approvalId);
    ElMessage.success('已审批通过，数据码已下发给所有区域');
    loadList();
    emit('refresh');
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.message || '审批操作失败');
    }
  }
}

function handleReject(row: any) {
  currentRejectId.value = row.approvalId;
  rejectReason.value = '';
  rejectDialog.value = true;
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因');
    return;
  }
  rejecting.value = true;
  try {
    await approvalService.rejectApproval(currentRejectId.value!, rejectReason.value.trim());
    ElMessage.success('已驳回');
    rejectDialog.value = false;
    loadList();
    emit('refresh');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '操作失败');
  } finally {
    rejecting.value = false;
  }
}

const REGION_MAP: Record<string, { label: string; color: string }> = {
  admin: { label: '集团', color: '#409eff' },
  yunnan: { label: '云南省', color: '#67c23a' },
  fujian: { label: '福建省', color: '#e6a23c' },
};

function regionLabel(tenant: string): string {
  return REGION_MAP[tenant]?.label || tenant || '-';
}

function regionColor(tenant: string): string {
  return REGION_MAP[tenant]?.color || '#909399';
}

function formatTime(tm: string): string {
  if (!tm) return '-';
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function typeLabel(code: string): string {
  if (!code) return '其他';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return '风电';
  if (first === 'G') return '光伏';
  if (first === 'S') return '水电';
  return '其他';
}

function typeTagType(code: string): 'primary' | 'success' | 'info' | 'warning' {
  if (!code) return 'info';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return 'primary';
  if (first === 'G') return 'success';
  if (first === 'S') return 'info';
  return 'warning';
}

onMounted(() => {
  loadList();
});
</script>

<style scoped>
.approval-mgmt-tab {
  padding: 16px 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.sub-tabs {
  margin-bottom: 8px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.section-label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
}

.filter-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.table-container {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.cell-name-tag { color: #909399; font-size: 12px; }
.time-cell { font-family: monospace; font-size: 12px; color: #909399; }

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

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table th.el-table__cell) {
  background: #f0f5ff !important;
  color: #1d40af !important;
  font-weight: 600 !important;
}

/* ==================== 搜索按钮 ==================== */
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

/* ==================== 对话框按钮 ==================== */
.btn-dialog-cancel {
  background: #fff !important;
  border: 1px solid #d0d5dd !important;
  color: #667085 !important;
  height: 36px !important;
  border-radius: 8px !important;
  padding: 0 20px !important;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn-dialog-cancel:hover {
  border-color: #98a2b3 !important;
  color: #344054 !important;
  background: #f9fafb !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.btn-dialog-reject {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 36px !important;
  position: relative;
  border-radius: 8px !important;
  overflow: hidden;
  color: #fff !important;
  font-size: 14px;
  font-weight: 600;
  padding: 0 20px !important;
}
.btn-dialog-reject::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #ef4444, #f97316, #ef4444);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-dialog-reject::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 7px;
  background: linear-gradient(135deg, #dc2626, #ea580c);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-dialog-reject:hover::after {
  background: linear-gradient(135deg, #ef4444, #f97316);
}
.btn-dialog-reject:hover {
  box-shadow: 0 6px 24px rgba(239,68,68,0.3) !important;
  transform: translateY(-1px);
}
.btn-dialog-reject:active {
  transform: translateY(0) !important;
}
.btn-dialog-reject-inner {
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
