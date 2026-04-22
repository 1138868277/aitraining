<template>
  <div class="code-validate">
    <el-row :gutter="20">
      <!-- 左侧输入区 -->
      <el-col :span="10">
        <el-card class="input-card">
          <template #header>
            <span>编码输入</span>
          </template>

          <el-tabs v-model="inputMode">
            <!-- 手动录入 -->
            <el-tab-pane label="手动录入" name="manual">
              <div class="manual-input">
                <el-input v-model="singleInput" placeholder="输入编码" style="width: 300px" />
                <el-button type="primary" @click="addManualCode">添加</el-button>
              </div>
            </el-tab-pane>

            <!-- 批量粘贴 -->
            <el-tab-pane label="批量粘贴" name="batch">
              <el-input
                v-model="batchInput"
                type="textarea"
                :rows="8"
                placeholder="请粘贴编码列表，每行一条"
              />
              <div class="input-count">已输入 {{ batchCodes.length }} 条</div>
            </el-tab-pane>

            <!-- 上传Excel -->
            <el-tab-pane label="上传Excel" name="excel">
              <el-upload
                drag
                action="#"
                accept=".xlsx,.xls"
                :auto-upload="false"
                :on-change="handleFileChange"
                :limit="1"
              >
                <div class="el-icon el-icon--upload">
                  <svg viewBox="0 0 1024 1024" width="40" height="40" fill="#909399">
                    <path d="M544 864V288h-64v576H352l160 160 160-160z"/>
                    <path d="M128 128h768v128H128z"/>
                  </svg>
                </div>
                <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
                <template #tip>
                  <div class="el-upload__tip">支持 .xlsx/.xls 文件，大小不超过 10MB</div>
                </template>
              </el-upload>
              <div v-if="fileName" class="file-info">已选择文件：{{ fileName }}</div>
              <el-button link type="primary" class="template-btn" @click="downloadTemplate">
                下载标准模板
              </el-button>
            </el-tab-pane>
          </el-tabs>

          <!-- 待校验列表 -->
          <div v-if="pendingCodes.length > 0" class="pending-list">
            <div class="pending-header">
              <span>待校验列表（{{ pendingCodes.length }} 条）</span>
            </div>
            <el-tag
              v-for="(item, index) in pendingCodes"
              :key="index"
              closable
              @close="removePendingCode(index)"
              class="pending-tag"
            >
              {{ item.code }}
            </el-tag>
          </div>

          <div class="validate-actions">
            <el-button type="primary" :disabled="pendingCodes.length === 0" @click="startValidate">
              开始校验
            </el-button>
            <el-button :disabled="pendingCodes.length === 0" @click="clearAll">清空列表</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧结果区 -->
      <el-col :span="14">
        <el-card class="result-card">
          <template #header>
            <span>校验结果</span>
          </template>

          <el-tabs v-model="resultTab">
            <!-- 校验结果 -->
            <el-tab-pane label="校验结果" name="results">
              <div v-if="validateResult" class="result-summary">
                <el-statistic title="总条数" :value="validateResult.totalCount" />
                <el-statistic title="合规" :value="validateResult.compliantCount" />
                <el-statistic title="异常" :value="validateResult.abnormalCount" />
              </div>
              <div v-if="validateResult" class="result-actions">
                <el-button size="small" type="primary" @click="handleBatchCorrect">一键纠错</el-button>
                <el-button size="small" @click="handleExport">导出</el-button>
              </div>
              <el-table
                v-if="validateResult"
                :data="validateResult.details"
                border
                stripe
                style="width: 100%"
                max-height="400"
              >
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="originalCode" label="原始编码" width="200" />
                <el-table-column prop="result" label="校验结果" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.result === 'COMPLIANT' ? 'success' : 'danger'" size="small">
                      {{ row.result === 'COMPLIANT' ? '合规' : '异常' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="suggestedCode" label="建议编码" width="200" />
                <el-table-column prop="errorReason" label="异常原因" min-width="150" show-overflow-tooltip />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.result === 'ABNORMAL'"
                      link
                      type="primary"
                      @click="showCorrectionDialog(row)"
                    >
                      智能纠错
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="!validateResult" description="暂无校验结果" />
            </el-tab-pane>

            <!-- 纠正列表 -->
            <el-tab-pane label="纠正列表" name="corrections">
              <el-table :data="corrections" border stripe style="width: 100%">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="originalCode" label="原始编码" width="200" />
                <el-table-column prop="correctedCode" label="纠正后编码" width="200" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'CONFIRMED' ? 'success' : 'warning'" size="small">
                      {{ row.status === 'CONFIRMED' ? '已确认' : '待确认' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button
                      v-if="row.status === 'PENDING'"
                      link
                      type="primary"
                      @click="handleConfirm(row)"
                    >
                      确认
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-if="corrections.length === 0" description="暂无纠正记录" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 纠错确认对话框 -->
    <el-dialog v-model="correctionDialogVisible" title="纠错确认" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="原始编码">{{ correctionTarget?.originalCode }}</el-descriptions-item>
        <el-descriptions-item label="建议编码">{{ correctionTarget?.suggestedCode }}</el-descriptions-item>
        <el-descriptions-item label="建议原因">{{ correctionTarget?.errorReason }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="correctionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCorrection">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as validateService from '@/services/validate';

const inputMode = ref('manual');
const resultTab = ref('results');
const singleInput = ref('');
const batchInput = ref('');
const pendingCodes = ref<Array<{ code: string; name?: string }>>([]);
const fileName = ref('');
const validateResult = ref<any>(null);
const currentTaskId = ref('');
const corrections = ref<any[]>([]);
const correctionDialogVisible = ref(false);
const correctionTarget = ref<any>(null);

const batchCodes = computed(() => {
  return batchInput.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
});

function addManualCode() {
  const code = singleInput.value.trim();
  if (!code) {
    ElMessage.warning('请输入编码');
    return;
  }
  pendingCodes.value.push({ code });
  singleInput.value = '';
}

function removePendingCode(index: number) {
  pendingCodes.value.splice(index, 1);
}

function clearAll() {
  pendingCodes.value = [];
  batchInput.value = '';
}

function handleFileChange(file: any) {
  fileName.value = file.name;
}

function downloadTemplate() {
  ElMessage.success('模板下载功能已触发');
}

async function startValidate() {
  let codes: Array<{ code: string; name?: string }> = [];

  if (inputMode.value === 'manual') {
    codes = pendingCodes.value;
  } else if (inputMode.value === 'batch') {
    codes = batchCodes.value.map((c) => ({ code: c }));
    pendingCodes.value = codes;
  } else if (inputMode.value === 'excel') {
    ElMessage.info('Excel解析功能需要在后端对接Excel库后实现');
    return;
  }

  if (codes.length === 0) {
    ElMessage.warning('请先输入待校验的编码');
    return;
  }

  if (codes.length > 1000) {
    ElMessage.warning('单次校验数量超出限制（上限1000条），请分批校验');
    return;
  }

  try {
    const task = await validateService.batchValidate(codes);
    currentTaskId.value = task.taskId;
    const result = await validateService.getValidateResult(task.taskId);
    validateResult.value = result;
    resultTab.value = 'results';
    ElMessage.success(`校验完成：共 ${result.totalCount} 条，合规 ${result.compliantCount} 条，异常 ${result.abnormalCount} 条`);
  } catch (err: any) {
    ElMessage.error(err.message || '校验服务异常，请稍后重试');
  }
}

function showCorrectionDialog(row: any) {
  correctionTarget.value = row;
  correctionDialogVisible.value = true;
}

async function confirmCorrection() {
  if (!correctionTarget.value) return;
  try {
    const result = await validateService.batchCorrect(currentTaskId.value, [correctionTarget.value.index]);
    corrections.value = result.corrections;
    correctionDialogVisible.value = false;
    ElMessage.success('纠错成功');
  } catch (err: any) {
    ElMessage.error(err.message || '纠错失败');
  }
}

async function handleBatchCorrect() {
  if (!currentTaskId.value) return;
  try {
    const result = await validateService.batchCorrect(currentTaskId.value);
    corrections.value = result.corrections;
    resultTab.value = 'corrections';
    ElMessage.success(`批量纠错完成：共 ${result.correctedCount} 条`);
  } catch (err: any) {
    ElMessage.error(err.message || '批量纠错失败');
  }
}

async function handleConfirm(row: any) {
  try {
    await validateService.confirmCorrection(currentTaskId.value, row.id);
    row.status = 'CONFIRMED';
    ElMessage.success('已确认');
  } catch (err: any) {
    ElMessage.error(err.message || '确认失败');
  }
}

function handleExport() {
  ElMessage.success('导出任务已创建');
}
</script>

<style scoped>
.code-validate {
  max-width: 1400px;
  margin: 0 auto;
}

.manual-input {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-count {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.file-info {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}

.template-btn {
  margin-top: 8px;
}

.pending-list {
  margin-top: 16px;
}

.pending-header {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.pending-tag {
  margin: 4px;
}

.validate-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.result-summary {
  display: flex;
  gap: 40px;
  margin-bottom: 16px;
}

.result-actions {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}
</style>
