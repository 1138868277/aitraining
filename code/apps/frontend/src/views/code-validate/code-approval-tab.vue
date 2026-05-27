<template>
  <div class="approval-tab">
    <!-- 功能介绍卡片 -->
    <div class="subpage-hero">
      <div class="hero-icon">📋</div>
      <div class="hero-text">
        <div class="hero-title">数据码审批</div>
        <div class="hero-subtitle">提交新增的数据码到集团审批，审批通过后将下发给所有区域使用</div>
      </div>
    </div>

    <!-- 第一部分：提交新数据码 -->
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">提交新数据码</span>
      </div>
      <el-form :model="form" label-width="120px" class="submit-form">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="类型" required>
              <el-select v-model="form.typeCode" placeholder="请选择类型" style="width:100%" @change="onTypeChange">
                <el-option
                  v-for="t in typeOptions"
                  :key="t.code"
                  :label="`${t.code} ${t.name}`"
                  :value="t.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="二级类码" required>
              <el-select v-model="form.secondClassCode" placeholder="请先选择类型" style="width:100%" @change="onSecondClassChange" :disabled="!form.typeCode">
                <el-option
                  v-for="s in secondClassOptions"
                  :key="s.code"
                  :label="`${s.code} ${s.name}`"
                  :value="s.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="二级类名称" required>
              <el-input v-model="form.secondClassName" placeholder="自动填充" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item label="数据类码" required>
              <el-input v-model="form.dataCategoryCode" placeholder="2位数字" maxlength="2" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="数据类名称" required>
              <el-input v-model="form.dataCategoryName" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="数据码" required>
              <el-input v-model="form.dataCode" placeholder="3位数字" maxlength="3" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="数据码名称" required>
              <el-input v-model="form.dataName" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24" style="text-align: right;">
            <el-button type="primary" :loading="submitting" @click="handleSubmit">提交审批</el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 第二部分：我的提交记录 -->
    <div class="section-card" style="margin-top: 16px;">
      <div class="section-header">
        <span class="section-title">我的提交记录</span>
      </div>
      <el-table :data="submissions" stripe style="width:100%" v-loading="loadingSubmissions" empty-text="暂无提交记录">
        <el-table-column type="index" label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ ($index + 1) + (pageNum - 1) * pageSize }}
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
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'submitted'" type="warning" size="small">待审批</el-tag>
            <el-tag v-else-if="row.status === 'approved'" type="success" size="small">已通过</el-tag>
            <el-tag v-else-if="row.status === 'rejected'" type="danger" size="small">已拒绝</el-tag>
            <el-tag v-else type="info" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审批意见" min-width="160">
          <template #default="{ row }">
            <span v-if="row.rejectReason" style="color: #f56c6c; font-size: 12px;">{{ row.rejectReason }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">
            <span class="time-cell">{{ formatTime(row.submitTm || row.createTm) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="total > 0" class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadSubmissions"
          @size-change="loadSubmissions"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as dictService from '@/services/dict';
import * as approvalService from '@/services/approval';

const submitting = ref(false);
const loadingSubmissions = ref(false);
const typeOptions = ref<Array<{ code: string; name: string }>>([]);
const secondClassOptions = ref<Array<{ code: string; name: string }>>([]);
const submissions = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);

const form = reactive({
  typeCode: '',
  secondClassCode: '',
  secondClassName: '',
  dataCategoryCode: '',
  dataCategoryName: '',
  dataCode: '',
  dataName: '',
});

async function loadTypes() {
  try {
    const items = await dictService.getDictItems('type');
    typeOptions.value = items;
  } catch {
    ElMessage.error('加载类型列表失败');
  }
}

async function onTypeChange() {
  form.secondClassCode = '';
  form.secondClassName = '';
  if (!form.typeCode) {
    secondClassOptions.value = [];
    return;
  }
  try {
    const items = await dictService.getSecondClassByType(form.typeCode);
    secondClassOptions.value = items;
  } catch {
    ElMessage.error('加载二级类码失败');
  }
}

function onSecondClassChange() {
  const found = secondClassOptions.value.find(s => s.code === form.secondClassCode);
  form.secondClassName = found?.name || '';
}

async function handleSubmit() {
  if (!form.typeCode) { ElMessage.warning('请选择类型'); return; }
  if (!form.secondClassCode) { ElMessage.warning('请选择二级类码'); return; }
  if (!form.dataCategoryCode || !/^\d{2}$/.test(form.dataCategoryCode)) { ElMessage.warning('数据类码必须为2位数字'); return; }
  if (!form.dataCategoryName) { ElMessage.warning('请输入数据类名称'); return; }
  if (!form.dataCode || !/^\d{3}$/.test(form.dataCode)) { ElMessage.warning('数据码必须为3位数字'); return; }
  if (!form.dataName) { ElMessage.warning('请输入数据码名称'); return; }

  submitting.value = true;
  try {
    await approvalService.submitApproval({
      typeCode: form.typeCode,
      secondClassCode: form.secondClassCode,
      secondClassName: form.secondClassName,
      dataCategoryCode: form.dataCategoryCode,
      dataCategoryName: form.dataCategoryName,
      dataCode: form.dataCode,
      dataName: form.dataName,
    });
    ElMessage.success('已提交审批，请等待集团审核');

    // 重置表单
    form.typeCode = '';
    form.secondClassCode = '';
    form.secondClassName = '';
    form.dataCategoryCode = '';
    form.dataCategoryName = '';
    form.dataCode = '';
    form.dataName = '';
    secondClassOptions.value = [];

    // 刷新提交记录
    pageNum.value = 1;
    loadSubmissions();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '提交失败，请重试');
  } finally {
    submitting.value = false;
  }
}

async function loadSubmissions() {
  loadingSubmissions.value = true;
  try {
    const result = await approvalService.getMySubmissions(pageNum.value, pageSize.value);
    submissions.value = result.items;
    total.value = result.total;
  } catch {
    ElMessage.error('加载提交记录失败');
  } finally {
    loadingSubmissions.value = false;
  }
}

function formatTime(tm: string): string {
  if (!tm) return '-';
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

onMounted(() => {
  loadTypes();
  loadSubmissions();
});
</script>

<style scoped>
.approval-tab {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

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
.hero-icon { font-size: 36px; line-height: 1; position: relative; z-index: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
.hero-text { flex: 1; position: relative; z-index: 1; }
.hero-title { font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.hero-subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.75); margin-top: 4px; }

.section-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.section-title {
  font-size: 15px;
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

.submit-form {
  padding: 16px 20px;
}

.cell-name-tag { color: #909399; font-size: 12px; }
.time-cell { font-family: monospace; font-size: 12px; color: #909399; }

.pagination-wrap {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}
</style>
