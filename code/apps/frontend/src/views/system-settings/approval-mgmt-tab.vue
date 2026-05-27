<template>
  <div class="approval-mgmt-tab">
    <div class="tab-description">
      管理各区域提交的数据码审批申请，审核通过后将自动下发给所有区域使用。
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <span class="section-label">审批列表</span>
      </div>
      <div class="filter-right">
        <el-select v-model="filterStatus" placeholder="审批状态" style="width:140px" clearable @change="loadList">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select v-model="filterSource" placeholder="来源区域" style="width:140px" clearable @change="loadList">
          <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r" />
        </el-select>
        <el-button @click="loadList">搜索</el-button>
        <el-button @click="resetFilter">重置</el-button>
      </div>
    </div>

    <!-- 审批表格 -->
    <div class="table-container">
      <el-table :data="items" stripe style="width:100%" v-loading="loading" empty-text="暂无审批记录">
        <el-table-column type="index" label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ ($index + 1) + (pageNum - 1) * pageSize }}
          </template>
        </el-table-column>
        <el-table-column label="来源区域" width="110" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" color="#e8f4fd" style="color:#1677ff;border:none;">{{ row.sourceTenant }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二级类码" width="150">
          <template #default="{ row }">
            <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none;">{{ row.secondClassCode }}</el-tag>
            <span class="cell-name-tag">{{ row.secondClassName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据类码" width="140">
          <template #default="{ row }">
            <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none;">{{ row.dataCategoryCode }}</el-tag>
            <span class="cell-name-tag">{{ row.dataCategoryName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据码" width="140">
          <template #default="{ row }">
            <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none;">{{ row.dataCode }}</el-tag>
            <span class="cell-name-tag">{{ row.dataName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提交人" width="100" align="center">
          <template #default="{ row }">
            {{ row.submitter }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning" size="small">待审批</el-tag>
            <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已拒绝</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            <span class="time-cell">{{ formatTime(row.submitTm) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="primary" link size="small" @click="handleApprove(row)">通过</el-button>
              <el-button type="danger" link size="small" @click="handleReject(row)">拒绝</el-button>
            </template>
            <span v-else-if="row.status === 'rejected' && row.rejectReason" style="color: #909399; font-size: 12px;">
              {{ row.rejectReason }}
            </span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && items.length === 0" description="暂无审批记录" />
      <div v-if="total > 0" class="pagination-wrap">
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

    <!-- 拒绝对话框 -->
    <el-dialog v-model="rejectDialog" title="拒绝原因" width="420px" :close-on-click-modal="false">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因，区域用户将看到此原因"
      />
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="rejecting" @click="confirmReject">确定拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as approvalService from '@/services/approval';

const loading = ref(false);
const items = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const filterStatus = ref('');
const filterSource = ref('');

const regionOptions = ['yunnan', 'fujian'];

const rejectDialog = ref(false);
const rejectReason = ref('');
const rejecting = ref(false);
const currentRejectId = ref<number | null>(null);

async function loadList() {
  loading.value = true;
  try {
    const result = await approvalService.getApprovalList(
      pageNum.value,
      pageSize.value,
      filterStatus.value || undefined,
      filterSource.value || undefined,
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
  filterSource.value = '';
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
    ElMessage.warning('请填写拒绝原因');
    return;
  }
  rejecting.value = true;
  try {
    await approvalService.rejectApproval(currentRejectId.value!, rejectReason.value.trim());
    ElMessage.success('已拒绝');
    rejectDialog.value = false;
    loadList();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '操作失败');
  } finally {
    rejecting.value = false;
  }
}

function formatTime(tm: string): string {
  if (!tm) return '-';
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

.tab-description {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #fafbff;
  border: 1px solid #eef0f6;
  border-radius: 8px;
  line-height: 1.6;
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

.pagination-wrap {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table th.el-table__cell) {
  background: #f0f5ff !important;
  color: #1d40af !important;
  font-weight: 600 !important;
}
</style>
