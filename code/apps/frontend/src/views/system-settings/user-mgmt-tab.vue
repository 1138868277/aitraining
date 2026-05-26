<template>
  <div class="user-mgmt-tab">
    <div class="tab-description">
      管理系统用户账号，支持添加、编辑、删除操作。修改后即时生效。
    </div>

    <div class="toolbar-card">
      <div class="toolbar-left">
        <span class="section-label">用户列表</span>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="openAddDialog">
          <el-icon style="margin-right:4px"><Plus /></el-icon>新增用户
        </el-button>
      </div>
    </div>

    <div class="table-container-card">
      <el-table :data="users" stripe style="width:100%" v-loading="loading" empty-text="暂无用户数据">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="displayName" label="用户名称" min-width="140">
          <template #default="{ row }">
            <span class="user-name-cell">{{ row.displayName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="region" label="区域" min-width="140">
          <template #default="{ row }">
            <el-tag effect="plain" color="#e8f4fd" style="color:#1677ff;border:none;">{{ row.region }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" width="160">
          <template #default="{ row }">
            <span class="code-font">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="password" label="密码" width="140">
          <template #default="{ row }">
            <span class="password-mask">••••••</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最近登录时间" width="190">
          <template #default="{ row }">
            <span v-if="row.lastLoginTime" class="time-cell">{{ row.lastLoginTime }}</span>
            <span v-else class="never-login">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              size="small"
              :disabled="row.username === currentUsername"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑用户' : '新增用户'"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名称" prop="displayName">
              <el-input v-model="form.displayName" placeholder="请输入用户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域" prop="region">
              <el-select v-model="form.region" placeholder="请选择区域" style="width:100%" filterable>
                <el-option
                  v-for="r in regionOptions"
                  :key="r"
                  :label="r"
                  :value="r"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号" prop="username">
              <el-input v-model="form.username" placeholder="请输入登录账号" :disabled="isEditing" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
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
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
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
  margin-bottom: 24px;
  padding: 14px 16px;
  background: #fafbff;
  border: 1px solid #eef0f6;
  border-radius: 8px;
  line-height: 1.6;
}

.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
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

.table-container-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
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
  color: #666;
}

.never-login {
  color: #c0c4cc;
  font-size: 12px;
  font-style: italic;
}

:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table th.el-table__cell) {
  background: #f0f5ff !important;
  color: #1d40af !important;
  font-weight: 600 !important;
}
:deep(.el-dialog) { border-radius: 12px; overflow: hidden; }
:deep(.el-dialog__header) { padding: 20px 24px 0; font-weight: 700; font-size: 17px; }
:deep(.el-dialog__body) { padding: 20px 24px; }
:deep(.el-dialog__footer) { padding: 0 24px 20px; }
</style>
