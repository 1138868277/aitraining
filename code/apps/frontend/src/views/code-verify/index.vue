<template>
  <div class="code-verify">
<div class="page-body">
      <div class="page-layout">
        <!-- 左侧标签导航 -->
        <div class="cyber-tabs">
          <div
            v-for="tab in tabDefs"
            :key="tab.name"
            class="cyber-tab"
            :class="{ active: activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <div class="cyber-tab-icon" v-html="tab.icon"></div>
            <span class="cyber-tab-label">{{ tab.label }}</span>
            <div class="cyber-tab-indicator"></div>
          </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="tab-content">
        <div v-show="activeTab === 'parse'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">编码解析</div>
                <div class="tech-hero-desc">逐段解析编码结构，快速识别各段位业务含义，支持批量导入</div>
              </div>
            </div>
          </div>
          <el-tabs v-model="parseMode" class="parse-mode-tabs">
            <!-- 单个解析 -->
            <el-tab-pane label="单条解析" name="single">
              <div class="parse-container">
                <div class="parse-input-section">
                  <el-input
                    v-model="parseCodeInput"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入31位编码"
                    clearable
                    class="parse-code-input"
                    maxlength="31"
                    @input="onParseInput"
                  />
                  <div class="parse-code-length">
                    已输入 {{ parseCodeInput.length }} / 31 位
                    <span v-if="parseCodeInput.length > 0 && parseCodeInput.length !== 31" class="parse-length-warning">编码必须为31位</span>
                  </div>
                  <el-button
                    :disabled="parseCodeInput.length !== 31 || parsingCode"
                    @click="handleParseCode"
                    class="parse-btn"
                  >
                    <span class="parse-btn-inner">
                      <span class="parse-btn-icon">
                        <svg v-if="!parsingCode" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                        <span v-else class="parse-btn-spinner"></span>
                      </span>
                      <span class="parse-btn-text">{{ parsingCode ? '解析中' : '解 析' }}</span>
                    </span>
                  </el-button>
                </div>

                <div v-if="parseResult" class="parse-result-section">
                  <el-card shadow="never" class="parse-result-card">
                    <template #header>
                      <div class="parse-result-header">
                        <span class="parse-result-title">解析结果</span>
                        <el-tag v-if="parseResult.isValid" type="success" effect="dark">全部识别</el-tag>
                        <el-tag v-else type="danger" effect="dark">部分未识别</el-tag>
                      </div>
                    </template>

                    <div class="code-segments-display">
                      <div
                        v-for="(seg, index) in parseResult.segments"
                        :key="index"
                        class="segment-block"
                        :class="{ 'segment-unrecognized': seg.name === '未识别' }"
                      >
                        <div class="segment-label">{{ seg.label }}</div>
                        <div class="segment-code">{{ seg.code }}</div>
                        <div class="segment-name" :class="{ 'name-error': seg.name === '未识别' }">{{ seg.name }}</div>
                      </div>
                    </div>

                    <div class="code-visualization">
                      <div class="viz-title">编码结构</div>
                      <div class="viz-code">
                        <span
                          v-for="(seg, index) in parseResult.segments"
                          :key="index"
                          class="viz-segment"
                          :class="'viz-color-' + (index % 5)"
                          :title="seg.label + ': ' + seg.code"
                        >{{ seg.code }}</span>
                      </div>
                      <div class="viz-labels">
                        <span
                          v-for="(seg, index) in parseResult.segments"
                          :key="index"
                          class="viz-label"
                          :class="'viz-color-' + (index % 5)"
                        >{{ seg.label }}</span>
                      </div>
                    </div>

                    <el-alert
                      v-if="!parseResult.isValid && parseResult.errorMessage"
                      :title="parseResult.errorMessage"
                      type="warning"
                      show-icon
                      :closable="false"
                      class="parse-error-alert"
                    />
                  </el-card>
                </div>
              </div>
            </el-tab-pane>

            <!-- 批量解析 -->
            <el-tab-pane label="批量解析" name="batch">
              <div class="parse-batch-container">
                <div class="parse-batch-input-section">
                  <el-input
                    v-model="batchParseInput"
                    type="textarea"
                    :rows="8"
                    placeholder="请输入编码列表，每行一条31位编码"
                    clearable
                    class="parse-batch-textarea"
                  />
                  <div class="parse-batch-hint">已解析 {{ batchParseCodeList.length }} 条编码（单次最多支持1000条）</div>
                  <div class="parse-batch-actions">
                    <el-button
                      type="primary"
                      :disabled="batchParseCodeList.length === 0 || batchParsing"
                      @click="handleBatchParse"
                    >{{ batchParsing ? '解析中...' : '开始解析' }}</el-button>
                    <el-button :disabled="batchParseCodeList.length === 0" @click="clearBatchParse">清空</el-button>
                  </div>
                </div>

                <div v-if="batchParseResults.length > 0" class="parse-batch-result-section">
                  <div class="parse-batch-result-header">
                    <span>解析结果（共 {{ batchParseResults.length }} 条）</span>
                    <el-tag type="success" effect="plain">{{ recognizedCount }} 条已识别</el-tag>
                    <el-tag type="danger" effect="plain">{{ unrecognizedCount }} 条未识别</el-tag>
                    <el-button
                      v-if="!allExpanded"
                      link
                      type="primary"
                      size="small"
                      @click="toggleAllRows"
                    >一键展开</el-button>
                    <el-button
                      v-else
                      link
                      type="primary"
                      size="small"
                      @click="toggleAllRows"
                    >一键收起</el-button>
                    <el-button size="small" @click="exportBatchParseResult" class="btn-export btn-export-sm"><span class="btn-export-inner">导出 Excel</span></el-button>
                  </div>
                  <el-table
                    ref="batchParseTableRef"
                    :data="batchParseResults"
                    :expand-row-keys="expandedRowKeys"
                    row-key="rawCode"
                    border
                    stripe
                    style="width: 100%"
                    max-height="600"
                  >
                    <el-table-column type="expand">
                      <template #default="{ row }">
                        <div class="batch-expand-detail">
                          <div class="code-segments-display">
                            <div
                              v-for="(seg, index) in row.segments"
                              :key="index"
                              class="segment-block"
                              :class="{ 'segment-unrecognized': seg.name === '未识别' }"
                            >
                              <div class="segment-label">{{ seg.label }}</div>
                              <div class="segment-code">{{ seg.code }}</div>
                              <div class="segment-name" :class="{ 'name-error': seg.name === '未识别' }">{{ seg.name }}</div>
                            </div>
                          </div>
                          <el-alert
                            v-if="!row.isValid && row.errorMessage"
                            :title="row.errorMessage"
                            type="warning"
                            show-icon
                            :closable="false"
                            class="parse-error-alert"
                          />
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column prop="rawCode" label="编码" min-width="320">
                      <template #default="{ row }">
                        <span class="code-font">{{ row.rawCode }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="状态" width="140">
                      <template #default="{ row }">
                        <el-tag v-if="row.isValid" type="success" size="small">全部识别</el-tag>
                        <el-tag v-else type="danger" size="small">部分未识别</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="错误信息" min-width="200">
                      <template #default="{ row }">
                        <span v-if="row.errorMessage" class="parse-error-text">{{ row.errorMessage }}</span>
                        <span v-else class="parse-ok-text">—</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div v-show="activeTab === 'audit'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">重复编码校验</div>
                <div class="tech-hero-desc">批量检测编码是否与数据库或导入列表中已有编码重复</div>
              </div>
            </div>
          </div>
          <div class="audit-container">
            <div class="audit-input-section">
              <el-input
                v-model="auditInput"
                type="textarea"
                :rows="8"
                placeholder="请粘贴编码列表，每行一条编码"
                clearable
                class="audit-textarea"
              />
              <div class="audit-hint">已解析 {{ auditCodes.length }} 条编码</div>
              <div class="audit-actions">
                <el-button
                  :disabled="auditCodes.length === 0 || auditing"
                  @click="handleAudit"
                  class="btn-audit"
                >
                  <span class="btn-audit-inner">
                    <span class="btn-audit-icon">
                      <svg v-if="!auditing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span v-else class="btn-spinner"></span>
                    </span>
                    <span class="btn-audit-text">{{ auditing ? '稽核中' : '开始稽核' }}</span>
                  </span>
                </el-button>
                <el-button :disabled="auditCodes.length === 0" @click="clearAudit" class="btn-clear">清空</el-button>
              </div>
            </div>

            <div v-if="auditResults.length > 0" class="audit-result-section">
              <div class="audit-result-header">
                <span>稽核结果（共 {{ auditResults.length }} 条编码）</span>
                <el-tag v-if="uniqueCount === auditResults.length" type="success" effect="plain">全部不重复</el-tag>
                <el-tag v-else type="danger" effect="plain">{{ duplicateCount }} 条重复</el-tag>
              </div>
              <el-table :data="auditResults" border stripe style="width: 100%" max-height="600">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="code" label="编码" width="320" />
                <el-table-column label="状态" width="120">
                  <template #default="{ row }">
                    <span v-if="!row.exists" class="audit-pass">✓ 不重复</span>
                    <span v-else class="audit-fail">✗ 重复</span>
                  </template>
                </el-table-column>
                <el-table-column label="说明" min-width="300">
                  <template #default="{ row }">
                    <span v-if="!row.exists" class="audit-pass-desc">该编码不重复，可以使用</span>
                    <span v-else class="audit-fail-desc">该编码重复（与数据库中已有编码重复或输入中存在重复）</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'correct'" class="tab-panel">
          <div class="tech-hero">
            <div class="tech-hero-bg">
              <div class="tech-grid"></div>
              <div class="tech-glow tech-glow-1"></div>
              <div class="tech-glow tech-glow-2"></div>
            </div>
            <div class="tech-hero-content">
              <div class="tech-hero-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </div>
              <div class="tech-hero-text">
                <div class="tech-hero-title">编码修正</div>
                <div class="tech-hero-desc">批量修改测点编码段位，支持重复校验与修正结果导出</div>
              </div>
            </div>
          </div>
          <div class="correct-container">
            <el-card shadow="never" class="correct-upload-section">
              <div class="correct-upload-title">导入修正数据</div>
              <el-upload
                drag
                action="#"
                accept=".xlsx,.xls"
                :auto-upload="false"
                :on-change="handleCorrectFileUpload"
                :on-exceed="handleUploadExceed"
                :limit="1"
                :file-list="correctFileList"
              >
                <template #default>
                  <template v-if="correctFileList.length === 0">
                    <el-icon class="el-icon--upload">
                      <svg viewBox="0 0 1024 1024" width="40" height="40" fill="#909399">
                        <path d="M544 864V288h-64v576H352l160 160 160-160z"/>
                        <path d="M128 128h768v128H128z"/>
                      </svg>
                    </el-icon>
                    <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
                  </template>
                  <template v-else>
                    <div class="excel-file-display">
                      <svg viewBox="0 0 1024 1024" width="64" height="64" fill="#67c23a">
                        <path d="M854.6 288.7L639.4 73.4c-6-6-14.2-9.4-22.7-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.6-9.4-22.6zM790.2 326H602V137.8L790.2 326zM840 896H184V96h368v232c0 17.7 14.3 32 32 32h232v536h24zM421.1 476.4l-42.4 86.1-42.4-86.1h-39.9l60.9 124.3-67.6 132.3h40.6l45.5-93.8 45.5 93.8h41.5l-67.2-131.6 59.1-124.9zM544 599.8h72.3v-39.9H544v-45.6h82.4v-40.4H503.6V733h41.4l0.3-133.2h-0.6z"/>
                      </svg>
                      <div class="excel-file-name">{{ correctFileList[0]?.name }}</div>
                      <div class="excel-file-size">{{ formatFileSize(correctFileList[0]?.size) }}</div>
                    </div>
                  </template>
                </template>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .xlsx/.xls 文件，请确保包含"测点编码"、"测点描述"和"修改内容"三列<br/>
                    修改内容格式示例：<code>二级类码修改为003，数据类码修改为11，数据码修改为005</code>
                  </div>
                </template>
              </el-upload>
              <div class="correct-hint" v-if="correctItems.length > 0">
                已解析 {{ correctItems.length }} 条待修正编码
              </div>
              <div class="correct-actions">
                <el-button
                  :disabled="correctItems.length === 0 || correcting"
                  @click="handleCorrectCodes"
                  class="btn-correct"
                >
                  <span class="btn-correct-inner">
                    <span class="btn-correct-icon">
                      <svg v-if="!correcting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      <span v-else class="btn-spinner"></span>
                    </span>
                    <span class="btn-correct-text">{{ correcting ? '修正中 ' + correctProgress + '%' : '开始修正' }}</span>
                  </span>
                </el-button>
                <el-button :disabled="correctItems.length === 0" @click="clearCorrect" class="btn-clear">清空</el-button>
              </div>
              <div v-if="correcting" class="correct-progress-wrapper">
                <el-progress
                  :percentage="correctProgress"
                  :stroke-width="16"
                  :format="progressFormat"
                  class="correct-progress"
                />
                <span class="correct-progress-text">正在修正第 {{ correctedCount }}/{{ correctItems.length }} 条</span>
              </div>
            </el-card>

            <div v-if="correctResults.length > 0" class="correct-result-section">
              <div class="correct-result-header">
                <span>修正结果（共 {{ correctResults.length }} 条）</span>
                <el-tag type="info" effect="plain" v-if="correctResults.length > DISPLAY_LIMIT">
                  表格仅显示前 {{ DISPLAY_LIMIT }} 条，导出 Excel 包含全量数据
                </el-tag>
                <el-tag type="warning" effect="plain" v-if="correctDuplicateCount > 0">
                  {{ correctDuplicateCount }} 条重复
                </el-tag>
                <el-button @click="exportCorrectResults" class="btn-export"><span class="btn-export-inner">导出 Excel</span></el-button>
              </div>
              <el-table :data="displayCorrectResults" border stripe style="width: 100%" max-height="600">
                <el-table-column type="index" label="序号" width="60" fixed />
                <el-table-column label="测点编码（旧）" min-width="300">
                  <template #default="{ row }">
                    <div class="code-segment-compare">
                      <span
                        v-for="(seg, idx) in row.oldSegments"
                        :key="idx"
                        class="seg-code"
                        :class="getChangedClass(row, seg.label, 'old')"
                      >{{ seg.code }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="测点编码（新）" min-width="300">
                  <template #default="{ row }">
                    <div class="code-segment-compare">
                      <span
                        v-for="(seg, idx) in row.newSegments"
                        :key="idx"
                        class="seg-code"
                        :class="getChangedClass(row, seg.label, 'new')"
                      >{{ seg.code }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="测点描述" min-width="180" />
                <el-table-column prop="modification" label="修改内容" min-width="260" />
                <el-table-column label="重复校验结果" width="130">
                  <template #default="{ row }">
                    <span v-if="!row.duplicate" class="audit-pass">✓ 不重复</span>
                    <span v-else class="audit-fail">✗ 重复</span>
                  </template>
                </el-table-column>
                <el-table-column prop="correctionTime" label="修正时间" width="180" />
              </el-table>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import * as validateService from '@/services/validate';
import * as dictService from '@/services/dict';
import * as statisticsService from '@/services/statistics';

// ========== Tab 切换 ==========
const route = useRoute();
const router = useRouter();
const activeTab = ref((route.query.tab as string) || 'parse');

const tabDefs = [
  { name: 'parse', label: '编码解析', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>' },
  { name: 'audit', label: '重复编码校验', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>' },
  { name: 'correct', label: '编码修正', adminOnly: false,
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' },
];

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

// ========== 编码解析 ==========
const parseCodeInput = ref('');
const parsingCode = ref(false);
const parseResult = ref<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
} | null>(null);

function onParseInput() {
  parseCodeInput.value = parseCodeInput.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 31);
}

async function handleParseCode() {
  if (parseCodeInput.value.length !== 31) return;
  parsingCode.value = true;
  try {
    parseResult.value = await dictService.parseCode(parseCodeInput.value);
  } catch (err: any) {
    ElMessage.error(err.message || '编码解析失败');
  } finally {
    parsingCode.value = false;
  }
}

// ========== 编码解析 - 批量 ==========
const parseMode = ref('single');
const batchParseTableRef = ref<any>(null);
const allExpanded = ref(false);
const expandedRowKeys = ref<string[]>([]);
const batchParseInput = ref('');
const batchParsing = ref(false);
const batchParseResults = ref<Array<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
}>>([]);

const batchParseCodeList = computed(() => {
  return batchParseInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(item => item.length > 0);
});

const recognizedCount = computed(() => batchParseResults.value.filter(r => r.isValid).length);
const unrecognizedCount = computed(() => batchParseResults.value.filter(r => !r.isValid).length);

async function handleBatchParse() {
  if (batchParseCodeList.value.length === 0) return;
  if (batchParseCodeList.value.length > 1000) {
    ElMessage.warning('单次解析数量超出限制（上限1000条）');
    return;
  }
  batchParsing.value = true;
  try {
    batchParseResults.value = await dictService.batchParseCodes(batchParseCodeList.value);
    allExpanded.value = false;
    expandedRowKeys.value = [];
  } catch (err: any) {
    ElMessage.error(err.message || '批量解析失败');
  } finally {
    batchParsing.value = false;
  }
}

function toggleAllRows() {
  allExpanded.value = !allExpanded.value;
  if (allExpanded.value) {
    expandedRowKeys.value = batchParseResults.value.map(r => r.rawCode);
  } else {
    expandedRowKeys.value = [];
  }
}

function clearBatchParse() {
  batchParseInput.value = '';
  batchParseResults.value = [];
  allExpanded.value = false;
  expandedRowKeys.value = [];
}

function exportBatchParseResult() {
  const data: Record<string, any>[] = batchParseResults.value.map((r, i) => ({
    '序号': i + 1,
    '编码': r.rawCode,
    '状态': r.isValid ? '全部识别' : '部分未识别',
    '错误信息': r.errorMessage || '',
  }));
  const segments = batchParseResults.value[0]?.segments || [];
  if (segments.length > 0) {
    batchParseResults.value.forEach((r, i) => {
      r.segments.forEach((seg) => {
        data[i][seg.label] = `${seg.code} ${seg.name}`;
      });
    });
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '编码解析结果');
  XLSX.writeFile(wb, `编码解析结果_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function handleUploadExceed() {
  ElMessage.warning('只支持上传一个文件');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ========== 重复编码校验 ==========
const auditInput = ref('');
const auditing = ref(false);
const auditResults = ref<Array<{ code: string; exists: boolean }>>([]);

const auditCodes = computed(() => {
  return auditInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(item => item.length > 0);
});

const uniqueCount = computed(() => auditResults.value.filter(r => !r.exists).length);
const duplicateCount = computed(() => auditResults.value.filter(r => r.exists).length);

async function handleAudit() {
  if (auditCodes.value.length === 0) return;
  if (auditCodes.value.length > 10000) {
    ElMessage.warning('单次稽核数量超出限制（上限10000条）');
    return;
  }
  auditing.value = true;
  try {
    auditResults.value = await statisticsService.checkMeasurementCodesExist(auditCodes.value);
  } catch (err: any) {
    ElMessage.error(err.message || '稽核失败');
  } finally {
    auditing.value = false;
  }
}

function clearAudit() {
  auditInput.value = '';
  auditResults.value = [];
}

// ========== 编码修正 ==========
const correctFileList = ref<Array<{ name: string; size: number }>>([]);
const correctItems = ref<Array<{ code: string; description: string; modification: string }>>([]);
const correcting = ref(false);
const correctProgress = ref(0);
const correctedCount = ref(0);
const correctResults = ref<Array<any>>([]);
const DISPLAY_LIMIT = 100; // 表格最多显示条数
const CHUNK_SIZE = 50; // 每批处理条数

/** 编码段位定义（与后端一致） */
const CODE_SEGMENTS = [
  { label: '场站编码', start: 0, length: 4 },
  { label: '类型编码', start: 4, length: 2 },
  { label: '项目期号', start: 6, length: 3 },
  { label: '前缀号', start: 9, length: 1 },
  { label: '一级类码', start: 10, length: 2 },
  { label: '二级类码', start: 12, length: 3 },
  { label: '二级类扩展码', start: 15, length: 4 },
  { label: '三级类码', start: 19, length: 3 },
  { label: '三级类扩展码', start: 22, length: 4 },
  { label: '数据类码', start: 26, length: 2 },
  { label: '数据码', start: 28, length: 3 },
];

/** 将31位编码按段位拆分 */
function splitCodeIntoSegments(code: string): Array<{ label: string; code: string }> {
  return CODE_SEGMENTS.map(seg => ({
    label: seg.label,
    code: code.substring(seg.start, seg.start + seg.length),
  }));
}

/** 表格仅显示前 DISPLAY_LIMIT 条，避免大数据量卡顿 */
const displayCorrectResults = computed(() => {
  return correctResults.value.slice(0, DISPLAY_LIMIT);
});

const correctDuplicateCount = computed(() => {
  return correctResults.value.filter(r => r.duplicate).length;
});

function handleCorrectFileUpload(file: any) {
  correctFileList.value = [{ name: file.name, size: file.size }];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

      const items: Array<{ code: string; description: string; modification: string }> = [];
      for (const row of jsonData) {
        const code = row['测点编码'] || '';
        const description = row['测点描述'] || '';
        const modification = row['修改内容'] || '';
        if (code && modification) {
          items.push({
            code: String(code).trim(),
            description: String(description).trim(),
            modification: String(modification).trim(),
          });
        }
      }

      if (items.length === 0) {
        ElMessage.warning('文件中未识别到有效数据，请确保包含"测点编码"和"修改内容"列');
        return;
      }
      correctItems.value = items;
      ElMessage.success(`已解析 ${items.length} 条待修正编码`);
    } catch {
      ElMessage.error('文件解析失败，请检查文件格式');
    }
  };
  reader.readAsArrayBuffer(file.raw);
  return false;
}

function progressFormat(percentage: number) {
  return percentage + '%';
}

async function handleCorrectCodes() {
  if (correctItems.value.length === 0) return;
  if (correctItems.value.length > 100000) {
    ElMessage.warning('单次修正数量超出限制（上限100000条）');
    return;
  }

  correcting.value = true;
  correctProgress.value = 0;
  correctedCount.value = 0;
  correctResults.value = [];
  const allResults: any[] = [];
  const total = correctItems.value.length;

  try {
    // 分批处理
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = correctItems.value.slice(i, i + CHUNK_SIZE);
      const result = await validateService.batchCorrectCodes(chunk);
      allResults.push(...result.items);

      correctedCount.value = allResults.length;
      correctProgress.value = Math.round((allResults.length / total) * 100);
    }

    // 为每条结果补充 oldSegments 和 newSegments
    const enhanced = allResults.map((item: any) => ({
      ...item,
      oldSegments: splitCodeIntoSegments(item.oldCode),
      newSegments: splitCodeIntoSegments(item.newCode),
    }));
    correctResults.value = enhanced;
    ElMessage.success(`修正完成，共 ${allResults.length} 条`);
  } catch (err: any) {
    ElMessage.error(err.message || '编码修正失败');
  } finally {
    correcting.value = false;
  }
}

function clearCorrect() {
  correctFileList.value = [];
  correctItems.value = [];
  correctResults.value = [];
  correctProgress.value = 0;
  correctedCount.value = 0;
}

function getChangedClass(row: any, segmentLabel: string, type: 'old' | 'new') {
  const changed = row.changes?.find((c: any) => c.segmentLabel === segmentLabel);
  if (!changed) return 'seg-unchanged';
  return type === 'old' ? 'seg-changed-old' : 'seg-changed-new';
}

function exportCorrectResults() {
  if (correctResults.value.length === 0) {
    ElMessage.warning('没有可导出的数据');
    return;
  }

  const exportData = correctResults.value.map((row: any) => ({
    '测点编码': row.oldCode,
    '测点编码（新）': row.newCode,
    '测点描述': row.description,
    '修改内容': row.modification,
    '重复校验结果': row.duplicate ? '重复' : '不重复',
    '修正时间': row.correctionTime,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '编码修正');
  XLSX.writeFile(wb, `编码修正结果_${new Date().toISOString().slice(0, 10)}.xlsx`);
  ElMessage.success('导出成功');
}
</script>

<style scoped>
.code-verify { width: 100%; animation: fadeIn 0.3s ease; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 科技风英雄卡片 ==================== */
.tech-hero {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 14px;
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
  width: 250px;
  height: 250px;
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
  padding: 14px 20px;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
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
  width: 18px;
  height: 18px;
}
.tech-hero-text {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}
.tech-hero-title {
  font-size: 22px;
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

.page-body {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  padding: 8px 0 16px 0;
  overflow: hidden;
}

/* ==================== 左侧标签导航 ==================== */
.page-layout {
  display: flex;
  gap: 0;
  align-items: stretch;
}
.cyber-tabs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  width: 130px;
  flex-shrink: 0;
  border-right: 1px solid #f0f2f5;
}
.cyber-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}
.cyber-tab:hover {
  background: rgba(59,130,246,0.05);
}
.cyber-tab:hover .cyber-tab-icon {
  color: #3b82f6;
}
.cyber-tab.active {
  background: #eff6ff;
}
.cyber-tab.active .cyber-tab-label {
  color: #3b82f6;
  font-weight: 600;
}
.cyber-tab.active .cyber-tab-icon {
  color: #3b82f6;
}
.cyber-tab.active .cyber-tab-indicator {
  opacity: 1;
}
.cyber-tab-indicator {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.cyber-tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #94a3b8;
  transition: color 0.25s ease;
}
.cyber-tab-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  transition: color 0.25s ease;
}
.tab-content {
  flex: 1;
  min-width: 0;
  padding: 12px 16px 12px 16px;
}
.tab-panel {
  animation: panelIn 0.25s ease;
}
@keyframes panelIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 编码解析 */
.parse-container { padding: 8px 0; }
.parse-input-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 500px;
}
.parse-code-input { width: 100%; }
.parse-code-length { font-size: 12px; color: #909399; }
.parse-length-warning { color: #e6a23c; margin-left: 8px; }
.parse-btn {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  min-width: 110px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
  margin-top: 4px;
}
.parse-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6);
  background-size: 300% 300%;
  animation: btnGrad 4s ease infinite;
  z-index: 0;
}
.parse-btn::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  z-index: 0;
  transition: all 0.3s ease;
}
.parse-btn:hover:not(.is-disabled)::after {
  background: linear-gradient(135deg, #9333ea, #2563eb);
  inset: 1px;
}
.parse-btn:hover:not(.is-disabled) {
  box-shadow: 0 8px 32px rgba(139,92,246,0.35) !important;
  transform: translateY(-1px);
}
.parse-btn:active {
  transform: translateY(0) !important;
}
.parse-btn.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.parse-btn.is-disabled::before {
  animation: none;
}
.parse-btn-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 24px;
  height: 100%;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 3px;
}
.parse-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}
.parse-btn:hover:not(.is-disabled) .parse-btn-icon {
  transform: scale(1.15);
}
.parse-btn-text {
  text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.parse-btn-spinner {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: parseSpin 0.6s linear infinite;
}

@keyframes parseSpin {
  to { transform: rotate(360deg); }
}
.parse-result-section { margin-top: 20px; }
.parse-result-card { max-width: 900px; }
.parse-result-header { display: flex; align-items: center; gap: 12px; }
.parse-result-title { font-size: 15px; font-weight: 600; color: #303133; }
.code-segments-display {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.segment-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  min-width: 80px;
}
.segment-block.segment-unrecognized { background: #fef0f0; border-color: #f56c6c; }
.segment-label { font-size: 11px; color: #909399; white-space: nowrap; }
.segment-code {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  font-family: monospace;
  letter-spacing: 1px;
}
.segment-name { font-size: 13px; color: #606266; text-align: center; }
.segment-name.name-error { color: #f56c6c; font-weight: 700; }
.code-visualization { margin-bottom: 16px; }
.viz-title { font-size: 13px; font-weight: 600; color: #606266; margin-bottom: 8px; }
.viz-code { display: flex; gap: 2px; margin-bottom: 4px; }
.viz-segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
  font-family: monospace;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border-radius: 4px;
  cursor: default;
}
.viz-labels { display: flex; gap: 2px; }
.viz-label {
  font-size: 10px;
  text-align: center;
  padding: 2px 4px;
  color: #fff;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.viz-color-0 { background: #409eff; }
.viz-color-1 { background: #67c23a; }
.viz-color-2 { background: #e6a23c; }
.viz-color-3 { background: #9b59b6; }
.viz-color-4 { background: #f56c6c; }
.parse-error-alert { margin-top: 12px; }

/* 批量解析 */
.parse-mode-tabs { margin-top: -8px; }
.parse-batch-container { padding: 8px 0; }
.parse-batch-input-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 700px;
}
.parse-batch-textarea { width: 100%; }
.parse-batch-hint { font-size: 13px; color: #909399; }
.parse-batch-actions { display: flex; gap: 12px; margin-top: 4px; }
.parse-batch-result-section { margin-top: 20px; }
.parse-batch-result-header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.batch-expand-detail { padding: 16px 24px; }
.code-font { font-family: monospace; font-size: 14px; letter-spacing: 0.5px; }
.parse-error-text { color: #f56c6c; font-size: 13px; }
.parse-ok-text { color: #909399; }

/* 重复编码校验 */
.audit-container { padding: 8px 0; }
.audit-input-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 700px;
}
.audit-textarea { width: 100%; }
.audit-hint { font-size: 13px; color: #909399; }
.audit-actions { display: flex; gap: 12px; margin-top: 4px; }
.audit-result-section { margin-top: 20px; }
.audit-result-header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.audit-pass { color: #67c23a; font-weight: 700; font-size: 15px; }
.audit-fail { color: #f56c6c; font-weight: 700; font-size: 15px; }
.audit-pass-desc { color: #67c23a; }
.audit-fail-desc { color: #f56c6c; }

.excel-file-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}
.excel-file-name { font-size: 15px; color: #303133; font-weight: 600; }
.excel-file-size { font-size: 13px; color: #909399; }

/* 编码修正 */
.correct-container { padding: 8px 0; }
.correct-upload-section { margin-bottom: 16px; border: none; max-width: 700px; }
.correct-upload-title { font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.correct-hint { margin-top: 8px; font-size: 13px; color: #909399; }
.correct-actions { margin-top: 12px; display: flex; gap: 12px; }
.correct-result-section { margin-top: 20px; }
.correct-result-header {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.code-segment-compare {
  display: flex;
  flex-wrap: nowrap;
}
.seg-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.seg-unchanged { background: transparent; color: #303133; }
.seg-changed-old { background: #fef0f0; color: #f56c6c; text-decoration: line-through; }
.seg-changed-new { background: #f0f9eb; color: #67c23a; font-weight: 700; }
.correct-progress-wrapper {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.correct-progress { width: 60%; }
.correct-progress-text { font-size: 13px; color: #606266; white-space: nowrap; }

/* ==================== 开始稽核按钮 ==================== */
.btn-audit {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  min-width: 120px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-audit::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6);
  background-size: 300% 300%;
  animation: btnGrad 4s ease infinite;
  z-index: 0;
}
.btn-audit::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-audit:hover:not(.is-disabled)::after {
  background: linear-gradient(135deg, #9333ea, #2563eb);
  inset: 1px;
}
.btn-audit:hover:not(.is-disabled) {
  box-shadow: 0 8px 32px rgba(139,92,246,0.35) !important;
  transform: translateY(-1px);
}
.btn-audit:active { transform: translateY(0) !important; }
.btn-audit.is-disabled { opacity: 0.45; cursor: not-allowed; }
.btn-audit.is-disabled::before { animation: none; }
.btn-audit-inner {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 0 24px; height: 100%; color: #fff; font-size: 15px; font-weight: 600; letter-spacing: 2px;
}
.btn-audit-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; transition: transform 0.3s ease; }
.btn-audit:hover:not(.is-disabled) .btn-audit-icon { transform: scale(1.15); }
.btn-audit-text { text-shadow: 0 1px 3px rgba(0,0,0,0.2); }

/* ==================== 开始修正按钮 ==================== */
.btn-correct {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: 40px !important;
  min-width: 130px !important;
  position: relative;
  border-radius: 10px !important;
  overflow: hidden;
}
.btn-correct::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6);
  background-size: 300% 300%;
  animation: btnGrad 4s ease infinite;
  z-index: 0;
}
.btn-correct::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-correct:hover:not(.is-disabled)::after {
  background: linear-gradient(135deg, #9333ea, #2563eb);
  inset: 1px;
}
.btn-correct:hover:not(.is-disabled) {
  box-shadow: 0 8px 32px rgba(139,92,246,0.35) !important;
  transform: translateY(-1px);
}
.btn-correct:active { transform: translateY(0) !important; }
.btn-correct.is-disabled { opacity: 0.45; cursor: not-allowed; }
.btn-correct.is-disabled::before { animation: none; }
.btn-correct-inner {
  position: relative; z-index: 1; display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 0 24px; height: 100%; color: #fff; font-size: 15px; font-weight: 600; letter-spacing: 2px;
}
.btn-correct-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; transition: transform 0.3s ease; }
.btn-correct:hover:not(.is-disabled) .btn-correct-icon { transform: scale(1.15); }
.btn-correct-text { text-shadow: 0 1px 3px rgba(0,0,0,0.2); }

/* ==================== 导出 Excel 按钮 ==================== */
.btn-export {
  border: none !important;
  background: transparent !important;
  padding: 0 20px !important;
  height: 36px !important;
  position: relative;
  border-radius: 8px !important;
  overflow: hidden;
  color: #fff !important;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}
.btn-export-sm { height: 30px !important; font-size: 12px; padding: 0 14px !important; }
.btn-export::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #06b6d4, #10b981);
  background-size: 200% 100%;
  animation: btnGrad 3s ease infinite;
  z-index: 0;
}
.btn-export::after {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: 7px;
  background: linear-gradient(135deg, #059669, #0891b2);
  z-index: 0;
  transition: all 0.3s ease;
}
.btn-export:hover::after { background: linear-gradient(135deg, #10b981, #06b6d4); }
.btn-export:hover { box-shadow: 0 6px 24px rgba(16,185,129,0.3) !important; transform: translateY(-1px); }
.btn-export:active { transform: translateY(0) !important; }
.btn-export .btn-export-inner { position: relative; z-index: 1; }

/* ==================== 清空按钮 ==================== */
.btn-clear {
  background: transparent !important;
  border: 1px solid #d0d5dd !important;
  color: #667085 !important;
  height: 40px !important;
  border-radius: 10px !important;
  padding: 0 20px !important;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn-clear:hover:not(.is-disabled) {
  border-color: #98a2b3 !important;
  color: #344054 !important;
  background: #f9fafb !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}

/* ==================== 通用按钮渐变动画 ==================== */
@keyframes btnGrad {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes btnSpin {
  to { transform: rotate(360deg); }
}

/* ==================== 加载圈 ==================== */
.btn-spinner {
  display: block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: btnSpin 0.6s linear infinite;
}

/* ==================== 表格行动画 ==================== */
:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}

</style>
