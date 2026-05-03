<template>
  <div class="code-validate">
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab 1: 字典查询 -->
        <el-tab-pane label="字典查询" name="dictTree">
          <DictOverviewCard />
          <div class="tree-container">
            <div class="tree-toolbar">
              <el-button size="default" @click="onCollapseAll">收起所有</el-button>
            </div>
            <el-tree
              ref="treeRef"
              :data="dictTreeData"
              lazy
              :load="loadTreeNode"
              :props="treeProps"
              v-loading="loadingTree"
              element-loading-text="字典数据加载中..."
              highlight-current
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span class="tree-node-label">
                    <el-tag
                      :type="typeTagType(data.type)"
                      size="small"
                      class="type-tag"
                    >{{ typeLabel(data.type) }}</el-tag>
                    <span :class="['tree-node-code', typeCodeClass(data.type)]">{{ data.code }}</span>
                    <span class="tree-node-name">{{ data.name }}</span>
                  </span>
                  <span class="tree-node-meta">
                    <el-tag
                      v-if="data.type === 'dataCode' && data.isManual === '1'"
                      size="small"
                      type="warning"
                      class="source-tag"
                    >手动添加</el-tag>
                    <el-tag
                      v-else-if="data.type === 'dataCode' && data.isManual === '0'"
                      size="small"
                      type="info"
                      class="source-tag"
                    >集团统一</el-tag>
                    <span
                      v-if="data.childCount !== undefined"
                      class="child-count"
                    >{{ data.childCount }} 项</span>
                  </span>
                </span>
              </template>
            </el-tree>
            <el-empty v-if="!loadingTree && dictTreeData.length === 0" description="暂无字典数据" />
          </div>
        </el-tab-pane>

        <!-- Tab 2: 编码解析 -->
        <el-tab-pane label="编码解析" name="parse">
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
                type="primary"
                :disabled="parseCodeInput.length !== 31 || parsingCode"
                @click="handleParseCode"
                class="parse-btn"
              >{{ parsingCode ? '解析中...' : '解析' }}</el-button>
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

                <!-- 编码分段展示 -->
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

                <!-- 编码可视化（分段标注） -->
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

                <!-- 错误信息 -->
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

        <!-- Tab 3: 编码校验 -->
        <el-tab-pane label="编码校验" name="validate">
          <!-- 输入区域 -->
          <el-card shadow="never" class="input-section">
            <el-tabs v-model="inputMode">
              <el-tab-pane label="批量粘贴" name="paste">
                <el-input
                  v-model="batchInput"
                  type="textarea"
                  :rows="6"
                  class="paste-textarea"
                  placeholder="请粘贴编码列表，每行一条：编码 名称（编码和名称之间用空格或Tab分隔）"
                />
                <div class="input-hint">已解析 {{ inputMode === 'paste' ? pasteCodes.length : parsedCodes.length }} 条编码</div>
              </el-tab-pane>


              <el-tab-pane label="上传Excel" name="excel">
                <el-upload
                  drag
                  action="#"
                  accept=".xlsx,.xls"
                  :auto-upload="false"
                  :on-change="handleFileUpload"
                  :on-exceed="handleUploadExceed"
                  :limit="1"
                  :file-list="uploadFileList"
                >
                  <template #default>
                    <template v-if="uploadFileList.length === 0">
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
                        <div class="excel-file-name">{{ uploadFileList[0]?.name }}</div>
                        <div class="excel-file-size">{{ formatFileSize(uploadFileList[0]?.size) }}</div>
                      </div>
                    </template>
                  </template>
                  <template #tip>
                    <div class="el-upload__tip">支持 .xlsx/.xls 文件，请确保包含"测点编码"和"测点描述"列</div>
                  </template>
                </el-upload>
              </el-tab-pane>

            </el-tabs>
            <div class="validate-actions">
              <el-button
                type="primary"
                :disabled="!hasCodes || resolvingCodes"
                @click="handleResolveCodes"
              >{{ resolvingCodes ? '解析中...' : '开始校验' }}</el-button>
              <el-button :disabled="!hasCodes" @click="clearCodes">清空</el-button>
            </div>
          </el-card>

          <!-- 校验结果 -->
          <div v-if="resolvedItems.length > 0" class="result-section">
            <div class="result-header">
              <span>校验结果（共 {{ resolvedItems.length }} 组去重编码）</span>
            </div>
            <el-table
              :data="resolvedItems"
              border
              stripe
              style="width: 100%"
              row-key="rowKey"
            >
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="expanded-codes">
                    <div class="expanded-title">测点编码列表：</div>
                    <el-table :data="row.matchedCodes" size="small" border>
                      <el-table-column type="index" label="序号" width="60" />
                      <el-table-column prop="code" label="测点编码" width="320" />
                      <el-table-column prop="name" label="编码名称" min-width="200" />
                    </el-table>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="210">
                <template #default="{ row }">
                  <span class="code-val">{{ row.typeCode }}</span>
                  <span :class="row.typeName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.typeName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="二级类码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.secondClassCode }}</span>
                  <span :class="row.secondClassName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.secondClassName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.dataCategoryCode }}</span>
                  <span :class="row.dataCategoryName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.dataCategoryName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码" width="180">
                <template #default="{ row }">
                  <span class="code-val">{{ row.dataCode }}</span>
                  <span :class="row.dataName === '未识别' ? 'name-error' : 'name-muted'"> {{ row.dataName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="160" fixed="right">
                <template #default="{ row }">
                  <template v-if="processedKeys.has((row as any).rowKey)">
                    <span class="processed-tag">已处理</span>
                  </template>
                  <template v-else-if="row.typeName !== '未识别' && row.secondClassName !== '未识别' && row.dataCategoryName !== '未识别' && row.dataName !== '未识别'">
                    <span class="processed-tag">已识别</span>
                  </template>
                  <template v-else-if="row.dataCategoryName === '未识别'">
                    <span class="processed-tag">无法新增</span>
                  </template>
                  <template v-else>
                    <el-button link type="primary" size="small" @click="handleAddItem(row)">新增</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <!-- Tab 4: 新增字典记录 -->
        <el-tab-pane label="字典新增" name="statistics">
          <div class="statistics-header">
            <span class="statistics-title">手动添加编码记录</span>
            <div class="header-actions">
              <el-button size="small" @click="loadManualStats">刷新</el-button>
              <el-button
                v-if="manualStats.length > 0"
                size="small"
                type="primary"
                @click="handleExportStats"
              >导出Excel</el-button>
            </div>
          </div>
          <div class="statistics-toolbar">
            <el-select
              v-model="statsTypeFilter"
              placeholder="类型筛选"
              clearable
              style="width: 200px"
              @change="onStatsTypeFilterChange"
            >
              <el-option
                v-for="item in typeOptions"
                :key="item.code"
                :label="item.code + ' ' + item.name"
                :value="item.code"
              />
            </el-select>
            <el-select
              v-model="statsSecondClassFilter"
              placeholder="二级类码筛选"
              clearable
              style="width: 200px"
              @change="onStatsFilterChange"
            >
              <el-option
                v-for="item in secondClassOptions"
                :key="item.code"
                :label="item.code + ' ' + item.name"
                :value="item.code"
              />
            </el-select>
          </div>
          <el-table
            :data="manualStats"
            border
            stripe
            style="width: 100%"
            class="stats-table"
            v-loading="loadingStats"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="类型">
              <template #default="{ row }">
                <span v-if="row.typeCode" class="code-type">{{ row.typeCode.charAt(0) }}</span>
                <span v-if="row.typeCode" class="name-muted">{{ row.typeCode.charAt(0) === 'F' ? '风电' : row.typeCode.charAt(0) === 'G' ? '光伏' : row.typeCode.charAt(0) === 'S' ? '水电' : '其他' }}</span>
                <span v-else class="name-error">未识别</span>
              </template>
            </el-table-column>
            <el-table-column label="二级类码">
              <template #default="{ row }">
                <span class="code-second-class">{{ row.secondClassCode }}</span> <span class="name-muted">{{ row.secondClassName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据类码">
              <template #default="{ row }">
                <span class="code-data-category">{{ row.dataCategoryCode }}</span> <span class="name-muted">{{ row.dataCategoryName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据码">
              <template #default="{ row }">
                <span class="code-data-code">{{ row.dataCode }}</span> <span class="name-muted">{{ row.dataName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="增加时间" width="248">
              <template #default="{ row }">
                {{ formatTime(row.createTm) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loadingStats && manualStats.length === 0" description="暂无手动添加记录" />
          <div v-if="statsTotal > 0" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="statsPageNum"
              v-model:page-size="statsPageSize"
              :total="statsTotal"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next"
              @current-change="loadManualStats"
              @size-change="loadManualStats"
            />
          </div>
        </el-tab-pane>
        <!-- Tab 5: 场站维护 -->
        <el-tab-pane label="场站维护" name="station">
          <StationTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增对话框 -->
    <el-dialog v-model="addDialogVisible" title="新增编码字典" width="500px" @close="resetAddForm">
      <el-form label-width="100px" label-position="top">
        <el-form-item label="二级类码">
          <el-input :model-value="addTarget?.secondClassCode + ' ' + addTarget?.secondClassName" disabled />
        </el-form-item>
        <el-form-item label="数据类码">
          <el-input v-model="addForm.dataCategoryCode" placeholder="2位数字" maxlength="2" style="width: 80px" disabled />
        </el-form-item>
        <el-form-item label="数据类码名称">
          <el-input v-model="addForm.dataCategoryName" placeholder="输入数据类码名称" disabled />
        </el-form-item>
        <el-form-item label="数据码">
          <el-input v-model="addForm.dataCode" placeholder="3位数字" maxlength="3" style="width: 80px" />
        </el-form-item>
        <el-form-item label="数据码名称">
          <el-input v-model="addForm.dataName" placeholder="输入数据码名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addingCode" @click="confirmAddItem">确认新增</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx';
import * as validateService from '@/services/validate';
import * as dictService from '@/services/dict';
import DictOverviewCard from './dict-overview-card.vue';
import StationTab from './station-tab.vue';
import type { DictTreeNode, ManualStatItem, ResolvedCodeItem } from '@cec/contracts';

// ========== Tab 2: 编码解析 ==========
const parseCodeInput = ref('');
const parsingCode = ref(false);
const parseResult = ref<{
  rawCode: string;
  segments: Array<{ label: string; code: string; name: string }>;
  isValid: boolean;
  errorMessage?: string;
} | null>(null);

function onParseInput() {
  // 只允许数字和字母
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

// ========== Tab Switching ==========
const route = useRoute();
const router = useRouter();
const activeTab = ref((route.query.tab as string) || 'dictTree');

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab } });
});

// ========== Tab 1: 字典查询 ==========
const dictTreeData = ref<DictTreeNode[]>([]);
const treeDataCache = ref<DictTreeNode[]>([]); // lazy load 查找缓存
const loadingTree = ref(false);
const treeRef = ref<any>(null);

const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (data: any) => data.type === 'dataCode',
};

const typeLabelMap: Record<string, string> = {
  typeDomain: '类型',
  secondClass: '二级类码',
  dataCategory: '数据类码',
  dataCode: '数据码',
};

function typeLabel(type: string): string {
  return typeLabelMap[type] || type;
}

const typeTagMap: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
  typeDomain: 'danger',
  secondClass: 'primary',
  dataCategory: 'success',
  dataCode: 'warning',
};

function typeTagType(type: string): 'primary' | 'success' | 'warning' | 'danger' | '' {
  return typeTagMap[type] || '';
}

function typeCodeClass(type: string): string {
  if (type === 'typeDomain') return 'code-type-domain';
  if (type === 'secondClass') return 'code-second-class';
  if (type === 'dataCategory') return 'code-data-category';
  if (type === 'dataCode') return 'code-data-code';
  return '';
}

function formatTime(tm: string): string {
  // ISO 字符串裁剪到秒: "2024-01-01T12:00:00.000Z" → "2024-01-01 12:00:00"
  const d = new Date(tm);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function loadDictTree() {
  loadingTree.value = true;
  try {
    treeDataCache.value = await validateService.getDictTree();
    dictTreeData.value = treeDataCache.value; // 保留引用供其他逻辑使用
  } catch (err: any) {
    ElMessage.error('字典树加载失败');
  } finally {
    loadingTree.value = false;
  }
}

/** lazy 模式加载子节点：前三级从缓存取，数据类码展开时从 API 懒加载 */
async function loadTreeNode(node: any, resolve: Function) {
  const data = node.data;
  if (data.type === 'typeDomain') {
    // 返回该类型域下的二级类码
    const td = treeDataCache.value.find((t: any) => t.code === data.code);
    resolve(td?.children || []);
  } else if (data.type === 'secondClass') {
    // 返回该二级类码下的数据类码
    for (const td of treeDataCache.value) {
      const sc = (td.children || []).find((c: any) => c.code === data.code);
      if (sc) { resolve(sc.children || []); return; }
    }
    resolve([]);
  } else if (data.type === 'dataCategory') {
    // 从 API 懒加载数据码
    try {
      const typeDomainCode = node.parent?.parent?.data?.code;
      const secondClassCode = node.parent?.data?.code;
      if (!typeDomainCode || !secondClassCode) { resolve([]); return; }
      const dataCodes = await validateService.getDictTreeDataCodes(
        typeDomainCode, secondClassCode, data.code,
      );
      resolve(dataCodes);
    } catch {
      resolve([]);
    }
  } else {
    resolve([]);
  }
}

function onCollapseAll() {
  // 只收起第一层（类型域节点）下的子节点，保留一级目录展开
  for (const node of treeRef.value?.store?.root?.childNodes || []) {
    if (!node.isLeaf) node.collapse();
  }
}

// ========== Tab 4: 新增字典记录 ==========
const manualStats = ref<ManualStatItem[]>([]);
const loadingStats = ref(false);
const statsTotal = ref(0);
const statsPageNum = ref(1);
const statsPageSize = ref(20);
const statsTypeFilter = ref('');
const statsSecondClassFilter = ref('');
const typeOptions = ref<Array<{ code: string; name: string }>>([]);
const secondClassOptions = ref<Array<{ code: string; name: string }>>([]);

async function loadManualStats() {
  loadingStats.value = true;
  try {
    const scFilter = statsSecondClassFilter.value || undefined;
    const tFilter = statsTypeFilter.value || undefined;
    console.log('DEBUG loadManualStats params:', { scFilter, tFilter });
    const result = await validateService.getManualStatistics(statsPageNum.value, statsPageSize.value, scFilter, tFilter);
    console.log('DEBUG loadManualStats result keys:', Object.keys(result));
    console.log('DEBUG secondClassOptions:', JSON.stringify(result.secondClassOptions));
    manualStats.value = result.items;
    statsTotal.value = result.total;
    secondClassOptions.value = result.secondClassOptions || [];
    typeOptions.value = result.typeOptions || [];
  } catch (err: any) {
    ElMessage.error('加载统计数据失败');
  } finally {
    loadingStats.value = false;
  }
}

/** 类型筛选变化：重置二级类码和分页 */
function onStatsTypeFilterChange() {
  statsSecondClassFilter.value = '';
  statsPageNum.value = 1;
  loadManualStats();
}

/** 二级类码筛选变化：重置分页 */
function onStatsFilterChange() {
  statsPageNum.value = 1;
  loadManualStats();
}

async function handleExportStats() {
  try {
    const scFilter = statsSecondClassFilter.value || undefined;
    const tFilter = statsTypeFilter.value || undefined;
    const items = await validateService.exportManualStatistics(scFilter, tFilter);
    const fmtType = (tc: string) => tc ? `${tc.charAt(0)} ${tc.charAt(0) === 'F' ? '风电' : tc.charAt(0) === 'G' ? '光伏' : '其他'}` : '未识别';
    const data = items.map((item, index) => ({
      '序号': index + 1,
      '类型': item.typeCode ? fmtType(item.typeCode) : '未识别',
      '二级类码': `${item.secondClassCode} ${item.secondClassName}`,
      '数据类码': `${item.dataCategoryCode} ${item.dataCategoryName}`,
      '数据码': `${item.dataCode} ${item.dataName}`,
      '增加时间': formatTime(item.createTm),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '手动添加编码');
    XLSX.writeFile(wb, `手动编码统计_${new Date().toISOString().slice(0, 10)}.xlsx`);
    ElMessage.success(`已导出 ${data.length} 条记录`);
  } catch (err: any) {
    ElMessage.error('导出失败');
  }
}

// ========== Tab 3: 编码校验 ==========
const inputMode = ref('paste');
const batchInput = ref('');
const uploadFileList = ref<Array<{ name: string; size: number }>>([]);
const parsedCodes = ref<Array<{ code: string; name: string }>>([]);
const resolvingCodes = ref(false);
const resolvedItems = ref<ResolvedCodeItem[]>([]);
const processedKeys = ref<Set<string>>(new Set());
const addDialogVisible = ref(false);
const addTarget = ref<ResolvedCodeItem | null>(null);
const addingCode = ref(false);
const addForm = reactive({
  dataCategoryCode: '',
  dataCategoryName: '',
  dataCode: '',
  dataName: '',
});


// 根据当前输入模式判断是否有编码可操作
const hasCodes = computed(() => {
  if (inputMode.value === 'paste') {
    return pasteCodes.value.length > 0;
  }
  return parsedCodes.value.length > 0;
});

// 解析批量粘贴的内容
const pasteCodes = computed(() => {
  return batchInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\t\s]+/);
      return {
        code: parts[0] || '',
        name: parts.slice(1).join(' ') || '',
      };
    })
    .filter(item => item.code.length > 0);
});

// 上传Excel
function handleFileUpload(file: any) {
  uploadFileList.value = [{ name: file.name, size: file.size }];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

      const codes: Array<{ code: string; name: string }> = [];
      for (const row of jsonData) {
        const code = row['测点编码'] || row['编码'] || row['code'] || '';
        const name = row['测点描述'] || row['编码名称'] || row['name'] || '';
        if (code) {
          codes.push({ code: String(code).trim(), name: String(name).trim() });
        }
      }

      if (codes.length === 0) {
        ElMessage.warning('文件中未识别到有效编码');
        return;
      }
      parsedCodes.value = codes;
      ElMessage.success(`已解析 ${codes.length} 条编码`);
    } catch {
      ElMessage.error('文件解析失败，请检查文件格式');
    }
  };
  reader.readAsArrayBuffer(file.raw);
  return false;
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

async function handleResolveCodes() {
  let codes: Array<{ code: string; name: string }> = [];

  if (inputMode.value === 'paste') {
    codes = pasteCodes.value;
    parsedCodes.value = codes;
  } else if (inputMode.value === 'excel') {
    codes = parsedCodes.value;
  }

  if (codes.length === 0) {
    ElMessage.warning('请先输入或上传编码');
    return;
  }

  if (codes.length > 10000) {
    ElMessage.warning('单次解析数量超出限制（上限10000条）');
    return;
  }

  resolvingCodes.value = true;
  try {
    resolvedItems.value = await validateService.resolveCodes(codes);
    // 为每行添加唯一 key（含类型）
    resolvedItems.value.forEach((item, idx) => {
      (item as any).rowKey = `${item.typeCode}|${item.secondClassCode}|${item.dataCategoryCode}|${item.dataCode}|${idx}`;
    });
    ElMessage.success(`解析完成，共 ${resolvedItems.value.length} 组去重编码`);
  } catch (err: any) {
    ElMessage.error(err.message || '编码解析失败');
  } finally {
    resolvingCodes.value = false;
  }
}

function clearCodes() {
  batchInput.value = '';
  parsedCodes.value = [];
  resolvedItems.value = [];
  processedKeys.value = new Set();
  uploadFileList.value = [];
}

// ---------- 新增操作 ----------
function handleAddItem(row: ResolvedCodeItem) {
  addTarget.value = row;
  addForm.dataCategoryCode = row.dataCategoryCode;
  addForm.dataCategoryName = row.dataCategoryName === '未识别' ? '' : row.dataCategoryName;
  addForm.dataCode = row.dataCode;
  addForm.dataName = row.dataName === '未识别' ? '' : row.dataName;
  addDialogVisible.value = true;
}

function resetAddForm() {
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addForm.dataCode = '';
  addForm.dataName = '';
}

async function confirmAddItem() {
  if (!addTarget.value) return;
  if (!addForm.dataCategoryCode || !addForm.dataCode || !addForm.dataName) {
    ElMessage.warning('请填写数据类码、数据码和数据名称');
    return;
  }
  addingCode.value = true;
  try {
    await dictService.createManualCode({
      typeCode: addTarget.value.typeCode,
      secondClassCode: addTarget.value.secondClassCode,
      secondClassName: addTarget.value.secondClassName,
      dataCategoryCode: addForm.dataCategoryCode,
      dataCategoryName: addForm.dataCategoryName || addForm.dataCategoryCode,
      dataCode: addForm.dataCode,
      dataName: addForm.dataName,
    });
    ElMessage.success('新增成功');
    // 标记本行为已处理
    if (addTarget.value) {
      const key = (addTarget.value as any).rowKey;
      const newSet = new Set(processedKeys.value);
      newSet.add(key);
      processedKeys.value = newSet;
    }
    addDialogVisible.value = false;
    addTarget.value = null;
    resetAddForm();
  } catch (err: any) {
    ElMessage.error(err.message || '新增失败');
  } finally {
    addingCode.value = false;
  }
}


// ========== 生命周期 ==========
onMounted(() => {
  loadDictTree();
  loadManualStats();
});
</script>

<style scoped>
.code-validate {
  width: 100%;
}

.main-card {
  min-height: 500px;
}

.main-tabs {
  margin-top: -16px;
}

/* Tab 1: 字典查询 */
.tree-container {
  padding: 8px 0;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}


.custom-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  padding-right: 16px;
  font-size: 14px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-tag {
  min-width: 60px;
  text-align: center;
}

.tree-node-code {
  font-weight: 600;
}

.code-type-domain {
  color: #f56c6c;
}

.code-second-class {
  color: #409eff;
}

.code-data-category {
  color: #67c23a;
}

.code-data-code {
  color: #e6a23c;
}

.tree-node-name {
  color: #606266;
}

.tree-node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-tag {
  font-size: 11px;
}

.child-count {
  font-size: 12px;
  color: #909399;
}

/* Tab 4: 新增字典记录 */
.statistics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions { display: flex; align-items: center; gap: 8px; }
.statistics-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.statistics-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: #409eff;
}

.statistics-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  padding: 16px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stats-table :deep(table) {
  table-layout: fixed;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* Tab 3: 编码校验 */
.input-section {
  margin-bottom: 16px;
  border: none;
  max-width: 1400px;
}

.paste-textarea {
  max-width: 700px;
}

.processed-tag {
  color: #909399;
  font-size: 13px;
}

.input-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.excel-file-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
}

.excel-file-name {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.excel-file-size {
  font-size: 13px;
  color: #909399;
}

.validate-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.result-section {
  margin-top: 12px;
}

.result-header {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
  margin-bottom: 12px;
}

.expanded-codes {
  padding: 12px 24px;
}

.expanded-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.code-val {
  font-weight: 600;
  color: #409eff;
}

.code-type {
  font-weight: 600;
  color: #9b59b6;
}

.name-muted {
  color: #606266;
  margin-left: 6px;
}

.name-error {
  color: #f56c6c;
  font-weight: 700;
  margin-left: 6px;
}

/* Tab 2: 编码解析 */
.parse-container {
  padding: 8px 0;
}

.parse-input-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 500px;
}

.parse-code-input {
  width: 100%;
}

.parse-code-length {
  font-size: 12px;
  color: #909399;
}

.parse-length-warning {
  color: #e6a23c;
  margin-left: 8px;
}

.parse-btn {
  margin-top: 4px;
}

.parse-result-section {
  margin-top: 20px;
}

.parse-result-card {
  max-width: 900px;
}

.parse-result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.parse-result-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

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

.segment-block.segment-unrecognized {
  background: #fef0f0;
  border-color: #f56c6c;
}

.segment-label {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

.segment-code {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  font-family: monospace;
  letter-spacing: 1px;
}

.segment-name {
  font-size: 13px;
  color: #606266;
  text-align: center;
}

.segment-name.name-error {
  color: #f56c6c;
  font-weight: 700;
}

.code-visualization {
  margin-bottom: 16px;
}

.viz-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.viz-code {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

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

.viz-labels {
  display: flex;
  gap: 2px;
}

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

.parse-error-alert {
  margin-top: 12px;
}

</style>
