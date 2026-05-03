<template>
  <div class="station-tab">
    <div class="tab-header">
      <div class="header-actions">
        <el-button type="primary" size="small" @click="addDialogVisible = true">新增场站</el-button>
        <el-button size="small" @click="showBatchDialog = true">批量新增</el-button>
        <el-button size="small" :disabled="stationList.length === 0" @click="handleExport">导出Excel</el-button>
        <el-popconfirm
          title="确认删除所有场站数据？此操作不可恢复"
          confirm-button-text="确认删除"
          cancel-button-text="取消"
          @confirm="handleDeleteAll"
        >
          <template #reference>
            <el-button size="small" type="danger" :disabled="stationList.length === 0">一键删除</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索场站编码或名称"
        clearable
        style="width: 260px"
        size="small"
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
      <el-button size="small" type="primary" @click="handleSearch">查询</el-button>
      <el-button size="small" @click="resetSearch">重置</el-button>
    </div>

    <!-- 场站表格 -->
    <el-table
      :data="stationList"
      border
      stripe
      style="width: 100%"
      size="small"
      v-loading="loading"
    >
      <el-table-column type="index" label="序号" width="55" />
      <el-table-column prop="station_code" label="场站编码" width="100" />
      <el-table-column prop="station_name" label="场站名称" min-width="160" />
      <el-table-column prop="management_domain" label="所属区域" min-width="140" />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.create_tm) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && stationList.length === 0" description="暂无场站数据" />

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        size="small"
        @current-change="loadStationList"
        @size-change="loadStationList"
      />
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
import { ElMessage, ElMessageBox } from 'element-plus';
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
    await ElMessageBox.confirm(
      `确认删除场站「${row.station_code} ${row.station_name}」？`,
      '删除确认',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' },
    );
    await stationService.deleteStation(row.station_id);
    ElMessage.success('删除成功');
    loadStationList();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败');
    }
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
.station-tab {
  padding: 8px 0;
}

.tab-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.pagination-wrapper {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.batch-hint {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.8;
}

.batch-hint code {
  background: #f5f7fa;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #409eff;
}

.batch-preview {
  margin-top: 12px;
}

.batch-preview-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.batch-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
