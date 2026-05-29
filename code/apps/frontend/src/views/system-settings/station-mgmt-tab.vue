<template>
  <div class="station-mgmt-tab">
    <div class="tab-toolbar">
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon style="margin-right:4px"><Plus /></el-icon>新增场站
      </el-button>
      <el-button @click="loadList">刷新</el-button>
    </div>

    <el-table :data="list" stripe style="width:100%" class="styled-table" v-loading="loading" max-height="560"
      :header-cell-style="{ background: '#f5f7fa', color: '#303133', fontWeight: 600 }">
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column prop="station_code" label="场站编码" width="120" align="center" />
      <el-table-column prop="station_name" label="场站名称" min-width="200" />
      <el-table-column label="场站类型" width="140" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.station_type ? 'primary' : 'info'" effect="plain">
            {{ typeLabel(row.station_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="management_domain" label="管理域" width="140" align="center" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="list-pagination" v-if="total > 0">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadList"
        @size-change="loadList"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '编辑场站' : '新增场站'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
        <el-form-item label="场站编码" prop="stationCode">
          <el-input v-model="form.stationCode" :disabled="isEditing" placeholder="4位数字或字母" maxlength="4" />
        </el-form-item>
        <el-form-item label="场站名称" prop="stationName">
          <el-input v-model="form.stationName" placeholder="请输入场站名称" />
        </el-form-item>
        <el-form-item label="场站类型" prop="stationType">
          <el-select v-model="form.stationType" placeholder="请选择场站类型" filterable style="width:100%">
            <el-option v-for="t in typeOptions" :key="t.code" :label="t.name" :value="t.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="管理域">
          <el-input v-model="form.managementDomain" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import api from '@/services/api';
import * as dictService from '@/services/dict';

interface StationRow {
  station_id: number;
  station_code: string;
  station_name: string;
  station_type: string | null;
  management_domain: string | null;
}

interface TypeItem {
  code: string;
  name: string;
}

const list = ref<StationRow[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);
const typeOptions = ref<TypeItem[]>([]);

const form = reactive({
  stationCode: '',
  stationName: '',
  stationType: '',
  managementDomain: '',
});

const rules = {
  stationCode: [
    { required: true, message: '请输入场站编码', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9]{4}$/, message: '必须为4位数字或字母', trigger: 'blur' },
  ],
  stationName: [
    { required: true, message: '请输入场站名称', trigger: 'blur' },
  ],
};

const formRef = ref<any>(null);

function typeLabel(type: string | null): string {
  if (!type) return '未设置';
  const t = typeOptions.value.find(t => t.code === type);
  return t ? t.name : type;
}

async function loadTypeOptions() {
  try {
    const items = await dictService.getDictItems('type');
    typeOptions.value = items;
  } catch {
    typeOptions.value = [];
  }
}

async function loadList() {
  loading.value = true;
  try {
    const res = await api.get('/station/list', {
      params: { pageNum: pageNum.value, pageSize: pageSize.value },
    });
    list.value = res.data.list || [];
    total.value = res.data.total || 0;
  } catch {
    ElMessage.error('加载场站列表失败');
  } finally {
    loading.value = false;
  }
}

function handleEdit(row: StationRow) {
  isEditing.value = true;
  editId.value = row.station_id;
  form.stationCode = row.station_code;
  form.stationName = row.station_name;
  form.stationType = row.station_type || '';
  form.managementDomain = row.management_domain || '';
  dialogVisible.value = true;
}

async function handleDelete(row: StationRow) {
  try {
    await ElMessageBox.confirm(`确定要删除场站"${row.station_name}"吗？`, '确认删除', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
    });
    await api.delete(`/station/${row.station_id}`);
    ElMessage.success('已删除');
    loadList();
  } catch { /* cancelled */ }
}

function handleSave() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    saving.value = true;
    try {
      const payload = {
        stationCode: form.stationCode,
        stationName: form.stationName,
        stationType: form.stationType || undefined,
        managementDomain: form.managementDomain || undefined,
      };

      if (isEditing.value && editId.value) {
        await api.put(`/station/${editId.value}`, payload);
        ElMessage.success('已更新');
      } else {
        await api.post('/station', payload);
        ElMessage.success('已新增');
      }

      dialogVisible.value = false;
      loadList();
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || '操作失败');
    } finally {
      saving.value = false;
    }
  });
}

function resetForm() {
  form.stationCode = '';
  form.stationName = '';
  form.stationType = '';
  form.managementDomain = '';
  isEditing.value = false;
  editId.value = null;
}

onMounted(() => {
  loadTypeOptions();
  loadList();
});
</script>

<style scoped>
.station-mgmt-tab {
  padding: 4px 0;
}
.tab-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.styled-table { border-radius: 8px; overflow: hidden; }
</style>
