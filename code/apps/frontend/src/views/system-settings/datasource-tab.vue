<template>
  <div class="datasource-tab">
    <div class="tab-description">
      配置 PG 数据库连接信息，修改后会自动测试连接并切换。切换即时生效，无需重启服务。
    </div>

    <div class="lock-bar">
      <el-alert v-if="locked" type="info" :closable="false" show-icon>
        <template #title>
          数据源已锁定，点击<el-button size="small" type="primary" link @click="unlock">修改</el-button>以编辑配置
        </template>
      </el-alert>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      label-width="120px"
      class="datasource-form"
    >
      <el-form-item
        label="主机地址"
        prop="host"
        :rules="[{ required: true, message: '请输入主机地址', trigger: 'blur' }]"
      >
        <el-input v-model="form.host" placeholder="例如：10.1.1.113" style="width: 300px" :disabled="locked" />
      </el-form-item>

      <el-form-item
        label="端口"
        prop="port"
        :rules="[{ required: true, message: '请输入端口', trigger: 'blur' }]"
      >
        <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 200px" :disabled="locked" />
      </el-form-item>

      <el-form-item
        label="数据库名"
        prop="database"
        :rules="[{ required: true, message: '请输入数据库名', trigger: 'blur' }]"
      >
        <el-input v-model="form.database" placeholder="例如：training_exercises" style="width: 300px" :disabled="locked" />
      </el-form-item>

      <el-form-item
        label="Schema"
        prop="schema"
        :rules="[{ required: true, message: '请输入 Schema', trigger: 'blur' }]"
      >
        <el-input v-model="form.schema" placeholder="例如：liuhaojun" style="width: 200px" :disabled="locked" />
      </el-form-item>

      <el-form-item
        label="用户名"
        prop="user"
        :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]"
      >
        <el-input v-model="form.user" placeholder="数据库用户名" style="width: 300px" :disabled="locked" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          placeholder="输入密码"
          style="width: 300px"
          :disabled="locked"
        />
      </el-form-item>

      <el-form-item label="SSL 连接">
        <el-switch v-model="form.ssl" :disabled="locked" />
      </el-form-item>

      <el-form-item>
        <div class="form-actions">
          <template v-if="locked">
            <el-button type="primary" @click="unlock">修改</el-button>
          </template>
          <template v-else>
            <el-button type="primary" :loading="testing" @click="handleTestConnection">测试连接</el-button>
            <el-button type="success" :loading="saving" @click="handleSave">保存并切换</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </template>
        </div>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="testResult !== null"
      :title="testResult.ok ? '连接成功' : '连接失败'"
      :description="testResult.message"
      :type="testResult.ok ? 'success' : 'error'"
      show-icon
      :closable="true"
      @close="testResult = null"
      class="result-alert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as datasourceService from '@/services/datasource';
import type { DatasourceConfig } from '@/services/datasource';

const formRef = ref<any>(null);
const testing = ref(false);
const saving = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);
const locked = ref(true);

const form = reactive<DatasourceConfig>({
  host: '',
  port: 5432,
  database: '',
  schema: '',
  user: '',
  password: '',
  ssl: false,
});

async function loadCurrentConfig() {
  try {
    const config = await datasourceService.getDatasourceConfig();
    form.host = config.host;
    form.port = config.port;
    form.database = config.database;
    form.schema = config.schema;
    form.user = config.user;
    form.password = config.password;
    form.ssl = config.ssl;
  } catch (err: any) {
    ElMessage.error(err.message || '加载数据源配置失败');
  }
}

async function handleTestConnection() {
  testing.value = true;
  testResult.value = null;
  try {
    const result = await datasourceService.testConnection({
      host: form.host,
      port: form.port,
      database: form.database,
      schema: form.schema,
      user: form.user,
      password: form.password,
      ssl: form.ssl,
    });
    testResult.value = result;
  } catch (err: any) {
    testResult.value = { ok: false, message: err.message || '连接测试失败' };
  } finally {
    testing.value = false;
  }
}

async function handleSave() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  saving.value = true;
  testResult.value = null;
  try {
    const result = await datasourceService.saveConfig({
      host: form.host,
      port: form.port,
      database: form.database,
      schema: form.schema,
      user: form.user,
      password: form.password,
      ssl: form.ssl,
    });
    testResult.value = result;
    if (result.ok) {
      ElMessage.success('数据源已切换');
      locked.value = true;
    }
  } catch (err: any) {
    testResult.value = { ok: false, message: err.message || '保存失败' };
  } finally {
    saving.value = false;
  }
}

function unlock() {
  locked.value = false;
}

function cancelEdit() {
  locked.value = true;
  testResult.value = null;
  loadCurrentConfig();
}

onMounted(() => {
  loadCurrentConfig();
});
</script>

<style scoped>
.datasource-tab {
  padding: 16px 0;
}

.lock-bar {
  margin-bottom: 16px;
}

.lock-bar .el-alert .el-button {
  margin: 0 4px;
  vertical-align: baseline;
}

.tab-description {
  font-size: 13px;
  color: #909399;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  line-height: 1.6;
}

.datasource-form {
  max-width: 600px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.result-alert {
  margin-top: 16px;
  max-width: 600px;
}
</style>
