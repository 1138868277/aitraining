<template>
  <div class="user-mgmt-tab">
    <div class="filter-bar">
      <div class="filter-left">
        <span class="section-label">用户列表</span>
      </div>
      <div class="filter-right">
        <el-button class="btn-add-user" @click="openAddDialog">
          <span class="btn-add-user-inner">
            <span class="btn-add-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </span>
            <span class="btn-add-text">新增用户</span>
          </span>
        </el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="users" stripe style="width:100%" v-loading="loading" class="user-table">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="displayName" label="用户名称" align="center">
          <template #default="{ row }">
            <span class="user-name-cell">{{ row.displayName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="区域" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" color="#e8f4fd" style="color:#1677ff;border:none;">{{ row.region }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" align="center">
          <template #default="{ row }">
            <span class="code-font">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="password" label="密码" align="center">
          <template #default="{ row }">
            <span class="password-mask">••••••</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最近登录时间" align="center">
          <template #default="{ row }">
            <span v-if="row.lastLoginTime" class="time-cell">{{ row.lastLoginTime }}</span>
            <span v-else class="never-login">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <span class="action-btn action-edit" @click="openEditDialog(row)">编辑</span>
            <span
              v-if="row.username !== currentUsername"
              class="action-btn action-delete"
              @click="handleDelete(row)"
            >删除</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && users.length === 0" description="暂无用户数据" />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      width="560px"
      :close-on-click-modal="false"
      class="user-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dh-icon"><el-icon><Plus /></el-icon></div>
          <div class="dh-text">
            <div class="dh-title">{{ isEditing ? '编辑用户' : '新增用户' }}</div>
            <div class="dh-sub">{{ isEditing ? '修改用户账号信息' : '添加新的系统用户账号' }}</div>
          </div>
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
        class="user-dialog-form"
      >
        <div class="form-section">
          <div class="section-label">
            <span class="sl-dot"></span>
            <span class="sl-text">账号信息</span>
            <span class="sl-line"></span>
          </div>
          <div class="form-grid">
            <div class="form-item" :class="{ active: form.displayName }">
              <div class="fi-label">
                <span class="fi-icon">👤</span>
                <span>用户名称</span>
                <span class="fi-req">*</span>
              </div>
              <el-input v-model="form.displayName" placeholder="请输入用户名称" />
            </div>
            <div class="form-item" :class="{ active: form.region }">
              <div class="fi-label">
                <span class="fi-icon">📍</span>
                <span>区域</span>
                <span class="fi-req">*</span>
              </div>
              <el-select v-model="form.region" placeholder="请选择区域" filterable>
                <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r" />
              </el-select>
            </div>
            <div class="form-item" :class="{ active: form.username }">
              <div class="fi-label">
                <span class="fi-icon">🔑</span>
                <span>账号</span>
                <span class="fi-req">*</span>
              </div>
              <el-input v-model="form.username" placeholder="请输入登录账号" :disabled="isEditing" />
            </div>
            <div class="form-item" :class="{ active: form.password }">
              <div class="fi-label">
                <span class="fi-icon">🔒</span>
                <span>密码</span>
                <span class="fi-req">*</span>
              </div>
              <el-input
                v-model="form.password"
                placeholder="请输入密码"
                :type="showPwd ? 'text' : 'password'"
              >
                <template #suffix>
                  <el-icon style="cursor:pointer" @click="showPwd = !showPwd">
                    <Hide v-if="!showPwd" />
                    <View v-else />
                  </el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="df-cancel" @click="dialogVisible = false">取消</el-button>
          <el-button class="df-confirm" type="primary" :loading="saving" @click="handleSave">
            <el-icon v-if="!saving" style="margin-right:4px;"><Plus /></el-icon>
            <span>{{ isEditing ? '确认更新' : '确认新增' }}</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Hide, View } from '@element-plus/icons-vue';
import { useAuthStore, type UserInfo } from '@/stores/auth';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const currentUsername = auth.user?.username || '';

const loading = ref(false);
const users = ref<UserInfo[]>([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const showPwd = ref(false);
const formRef = ref<FormInstance>();
const editingUsername = ref('');

const form = reactive({
  displayName: '',
  region: '集团',
  username: '',
  password: '',
});

/** 区域选项：集团 + 全国各省/自治区/直辖市/特别行政区 */
const regionOptions = [
  '集团',
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区',
];

const formRules: FormRules = {
  displayName: [{ required: true, message: '请输入用户名称', trigger: 'blur' }],
  region: [{ required: true, message: '请选择区域', trigger: 'change' }],
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '账号只能包含字母、数字和下划线', trigger: 'blur' },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function loadUsers() {
  users.value = await auth.getUsers();
}

function openAddDialog() {
  isEditing.value = false;
  showPwd.value = false;
  form.displayName = '';
  form.region = '集团';
  form.username = '';
  form.password = '';
  dialogVisible.value = true;
}

function openEditDialog(row: UserInfo) {
  isEditing.value = true;
  showPwd.value = false;
  editingUsername.value = row.username;
  form.displayName = row.displayName;
  form.region = row.region;
  form.username = row.username;
  form.password = row.password;
  dialogVisible.value = true;
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  try {
    if (isEditing.value) {
      const ok = await auth.updateUser(editingUsername.value, {
        displayName: form.displayName,
        region: form.region,
        username: form.username,
        password: form.password,
      });
      if (!ok) {
        ElMessage.warning('更新失败，可能用户名已存在');
        return;
      }
      ElMessage.success('用户已更新');
      dialogVisible.value = false;
      loadUsers();
      // 修改了当前登录用户的密码，需重新登录
      if (editingUsername.value === currentUsername && form.password !== auth.user?.password) {
        ElMessage.warning('密码已修改，请重新登录');
        auth.logout();
        router.replace('/login');
        return;
      }
    } else {
      const ok = await auth.addUser({
        username: form.username,
        displayName: form.displayName,
        region: form.region,
        password: form.password,
      });
      if (!ok) {
        ElMessage.warning('添加失败，该账号已存在');
        return;
      }
      ElMessage.success('用户已添加');
      dialogVisible.value = false;
    }
    loadUsers();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: UserInfo) {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${row.displayName}」吗？`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
    const ok = await auth.deleteUser(row.username);
    if (!ok) {
      ElMessage.warning('删除失败');
      return;
    }
    ElMessage.success('用户已删除');
    loadUsers();
  } catch { /* cancelled */ }
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-mgmt-tab {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 筛选栏 ===== */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 10px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.section-label {
  font-size: 14px;
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

/* ===== 表格容器 ===== */
.table-container {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow-x: auto;
}

.user-name-cell {
  font-weight: 500;
  color: #303133;
}

.code-font {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #606266;
}

.password-mask {
  color: #c0c4cc;
  letter-spacing: 2px;
}

.time-cell {
  font-family: monospace;
  font-size: 12px;
  color: #909399;
}

.never-login {
  color: #c0c4cc;
  font-size: 12px;
  font-style: italic;
}

/* ===== 用户表格 ===== */
.user-table {
  border: none !important;
}
.user-table :deep(table) {
  table-layout: fixed;
}
.user-table :deep(colgroup col:nth-child(1)) { width: 55px; }

.user-table :deep(.el-table__inner-wrapper) {
  border: none !important;
}

.user-table :deep(.el-table__body tr) {
  transition: background 0.2s ease;
}

.user-table :deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}

.user-table :deep(.el-table__cell) {
  padding: 8px 0 !important;
}
.user-table :deep(.cell) {
  text-align: center;
}

.user-table :deep(.el-table__header-wrapper tr) {
  border-top: none !important;
}

.user-table :deep(.el-table th.el-table__cell) {
  background: #f0f5ff !important;
  color: #1d40af !important;
  font-weight: 600 !important;
}

.user-table :deep(.el-table__body tr:last-child .el-table__cell) {
  border-bottom: none !important;
}

.user-table :deep(.cell .el-button--small) {
  font-size: 12px;
}

/* ===== 炫酷新增按钮 ===== */
.btn-add-user {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-add-user::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6, #3b82f6);
  background-size: 300% 300%;
  animation: btnGradient 4s ease infinite;
  z-index: 0;
}
.btn-add-user::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e40af, #7c3aed);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-add-user:hover::after {
  background: linear-gradient(135deg, #2563eb, #9333ea);
  inset: 1px;
}
.btn-add-user:hover {
  box-shadow: 0 8px 32px rgba(59,130,246,0.35) !important;
  transform: translateY(-1px);
}
.btn-add-user:active {
  transform: translateY(0) !important;
}
.btn-add-user-inner {
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
.btn-add-user:hover .btn-add-icon {
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

/* ===== 科技风操作按钮 ===== */
.action-btn {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  position: relative;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
}
.action-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  pointer-events: none;
}
.action-edit {
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
  margin-right: 6px;
}
.action-edit:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
}
.action-edit:active {
  transform: translateY(0);
}
.action-delete {
  color: #fff;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 2px 8px rgba(239,68,68,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.action-delete:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
}
.action-delete:active {
  transform: translateY(0);
}

/* ===== 对话框科技风 ===== */
.user-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03);
  background: linear-gradient(145deg, #ffffff, #fafbfc);
}
.user-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin: 0;
  border: none;
}
.user-dialog :deep(.el-dialog__body) {
  padding: 0 28px 8px;
}
.user-dialog :deep(.el-dialog__footer) {
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

.user-dialog-form { padding: 6px 0; }
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
</style>
