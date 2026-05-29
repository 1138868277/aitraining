<template>
  <div class="code-generate">
    <!-- 顶部横幅 -->
    <div class="tech-hero">
      <div class="tech-hero-bg">
        <div class="tech-grid"></div>
        <div class="tech-glow tech-glow-1"></div>
        <div class="tech-glow tech-glow-2"></div>
      </div>
      <div class="tech-hero-content">
        <h2 class="tech-hero-title"><span class="hero-title-icon">⚙️</span> 编码创建</h2>
        <p class="tech-hero-desc">根据规则批量生成测点编码，支持导出和修正</p>
      </div>
    </div>

    <!-- 检索工具栏卡片 -->
    <div class="toolbar-card">
      <div class="toolbar-left">
        <span class="card-title">快速检索</span>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon style="margin-right: 4px;"><Plus /></el-icon>新增数据码
        </el-button>
      </div>
    </div>
    <div class="toolbar-body">
        <div class="quick-search-row">
          <el-input
            v-model="quickSearchText"
            placeholder="数据码模糊搜索 或 编码后5位"
            clearable
            class="search-input"
            @input="onQuickSearchInput"
            @clear="onQuickSearchClear"
          >
            <template #prefix>
              <span class="search-prefix">搜索</span>
            </template>
          </el-input>
          <div v-if="recentSearchTags.length > 0" class="recent-search-tags">
            <el-tag
              v-for="tag in recentSearchTags"
              :key="tag"
              size="small"
              class="recent-tag"
              closable
              @click="onRecentTagClick(tag)"
              @close="removeRecentTag(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div v-if="quickSearchText.trim()" class="card-default mb-16" style="border-top: none;">
          <div class="card-header quick-filter-header">
            <div style="display:flex;align-items:center;gap:8px;">
              <el-radio-group v-model="quickSearchTypeFilter" size="small" class="type-radio-group" @change="onQuickSearchFilterChange" :disabled="quickSearchLocked">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="F">风电 F</el-radio-button>
                <el-radio-button value="G">光伏 G</el-radio-button>
                <el-radio-button value="S">水电 S</el-radio-button>
              </el-radio-group>
              <button
                class="quick-search-lock-btn"
                :class="{ 'is-locked': quickSearchLocked }"
                @click="toggleQuickSearchLock"
              >
                <span class="lock-icon">
                  <svg v-if="quickSearchLocked" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/></svg>
                  <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><circle cx="12" cy="16" r="1.2" fill="currentColor"/></svg>
                </span>
                {{ quickSearchLocked ? '已锁定' : '锁定' }}
              </button>
            </div>
          </div>
          <template v-if="quickSearchResults.length > 0">
            <el-table
              :data="quickSearchResults"
              stripe
              style="width: 100%"
              class="styled-table quick-search-table"
              max-height="480"
              size="default"
              v-loading="quickSearchLoading"
              element-loading-text="搜索中..."
              :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }"
              @filter-change="onQuickSearchHeaderFilterChange"
              ref="quickSearchTableRef"
            >
              <el-table-column label="类型域" align="center" width="200">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.typeCode }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="二级类码" column-key="quickSecondClassCode" :filters="quickSearchSecondClassFilterOptions" filter-placement="bottom" width="300">
                <template #default="{ row }">
                  <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; margin-right: 4px;">{{ row.secondClassCode }}</el-tag>
                  <span class="cell-name">{{ row.secondClassName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码" width="270">
                <template #default="{ row }">
                  <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCategoryCode }}</el-tag>
                  <span class="cell-name">{{ row.dataCategoryName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码">
                <template #default="{ row }">
                  <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none; font-family: monospace; margin-right: 4px;">{{ row.dataCode }}</el-tag>
                  <span class="cell-name">{{ row.dataName }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" fixed="right" width="140">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="onQuickSearchRowClick(row)">快速编码</el-button>
                  <el-button link type="success" size="small" @click="copyQuickCodes(row)">复制</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="list-pagination">
              <span style="font-size:13px;color:#909399;">共 {{ quickSearchResults.length }} 条结果</span>
            </div>
            <div class="quick-search-pagination">
              <el-pagination
                v-if="quickSearchTotal > 0"
                v-model:current-page="quickSearchPageNum"
                v-model:page-size="quickSearchPageSize"
                :total="quickSearchTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                small
                @current-change="onQuickSearchPageChange"
                @size-change="onQuickSearchPageChange"
              />
            </div>
          </template>
          <el-empty
            v-if="quickSearchSearched && quickSearchResults.length === 0 && !quickSearchLoading && quickSearchText.trim()"
            description="未找到匹配的数据码"
          />
        </div>
    </div>

    <!-- 手动新增编码字典对话框 -->
    <AddCodeDialog v-model="showAddDialog" @success="onAddCodeSuccess" />

    <!-- 编码生成条件面板 -->
    <div class="section-card">
      <div class="section-header">
        <span class="card-title">编码生成</span>
      </div>
      <div class="section-body">
      <el-form :model="conditions" label-width="140px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in conditionFields" :key="field.key" class="filter-item">
            <el-form-item :label="field.label" :required="field.required">
              <!-- 下拉选择框（带快捷选择） -->
              <div v-if="field.type === 'select'" class="input-with-quick-options">
                <div class="select-with-lock" :class="{ 'is-locked': lockedFields[field.key] }">
                  <el-select
                    v-model="conditions[field.key]"
                    :placeholder="'请选择' + field.label"
                    filterable
                    :disabled="field.disabled(conditions) || lockedFields[field.key]"
                    :multiple="field.multiple"
                    collapse-tags
                    collapse-tags-tooltip
                    :clearable="!lockedFields[field.key]"
                    @change="onConditionChange(field.key)"
                    style="width: 100%"
                  >
                  <el-option
                    v-for="item in dictOptions[field.key] || []"
                    :key="item.code"
                    :label="item.code + ' ' + item.name"
                    :value="item.code"
                  />
                </el-select>
                <el-button
                  v-if="LOCKABLE_FIELDS.includes(field.key)"
                  size="small"
                  :type="lockedFields[field.key] ? 'warning' : 'default'"
                  :plain="!lockedFields[field.key]"
                  class="lock-btn"
                  @click="toggleLock(field.key)"
                >
                  {{ lockedFields[field.key] ? '已锁定' : '锁定' }}
                </el-button>
                </div>
                <div v-if="field.quickOptions && field.quickOptions.length > 0" class="quick-options">
                  <el-tag
                    v-for="option in field.quickOptions"
                    :key="option"
                    size="small"
                    class="quick-option-tag"
                    :class="{ 'is-disabled': lockedFields[field.key] }"
                    @click="lockedFields[field.key] || (conditions[field.key] = option, onConditionChange(field.key))"
                  >
                    {{ option }}
                  </el-tag>
                </div>
              </div>

              <!-- 输入框（带快捷选择） -->
              <div v-else-if="field.type === 'input'" class="input-with-quick-options">
                <div class="select-with-lock">
                  <el-input
                    v-model="conditions[field.key]"
                    :placeholder="'请输入' + field.label"
                    :disabled="field.disabled(conditions) || lockedFields[field.key]"
                    :clearable="!lockedFields[field.key]"
                    @change="onConditionChange(field.key)"
                    style="width: 100%"
                  />
                  <el-button
                    v-if="LOCKABLE_FIELDS.includes(field.key)"
                    size="small"
                    :type="lockedFields[field.key] ? 'warning' : 'default'"
                    :plain="!lockedFields[field.key]"
                    class="lock-btn"
                    @click="toggleLock(field.key)"
                  >
                    {{ lockedFields[field.key] ? '已锁定' : '锁定' }}
                  </el-button>
                </div>
                <div v-if="field.quickOptions && field.quickOptions.length > 0" class="quick-options">
                  <el-tag
                    v-for="option in field.quickOptions"
                    :key="option"
                    size="small"
                    class="quick-option-tag"
                    :class="{ 'is-disabled': lockedFields[field.key] }"
                    @click="lockedFields[field.key] || (conditions[field.key] = option)"
                  >
                    {{ option }}
                  </el-tag>
                </div>
              </div>

              <!-- 扩展数字输入框（两个独立输入框） -->
              <div v-else-if="field.type === 'extend-number'" class="extend-number-input">
                <div class="extend-number-row">
                  <el-input
                    v-model="conditions[field.key + 'Start']"
                    :placeholder="field.key === 'secondExtCode' ? '默认1' : '默认0'"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    :min="field.key === 'secondExtCode' ? 1 : 0"
                    max="9999"
                    @change="onExtendNumberChange(field.key)"
                    @input="limitStartInput($event, field.key)"
                  >
                    <template #prefix><span class="extend-prefix">起始</span></template>
                  </el-input>
                  <el-input
                    v-model="conditions[field.key + 'Count']"
                    placeholder="默认1"
                    :disabled="field.disabled(conditions)"
                    type="number"
                    min="1"
                    max="99"
                    @change="onExtendNumberChange(field.key)"
                    @input="limitCountInput($event, field.key)"
                  >
                    <template #prefix><span class="extend-prefix">延伸</span></template>
                  </el-input>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="condition-actions">
        <el-button type="primary" :disabled="!canGenerate" @click="handleGenerate">
          生成编码
        </el-button>
        <el-button @click="handleClear">清空条件</el-button>
        <span v-if="canGenerate && expectedCodeCount > 1" class="expected-count">
          预计生成 {{ expectedCodeCount }} 个编码
        </span>
      </div>
      </div>
    </div>

    <!-- 编码结果展示区 -->
    <div class="section-card">
      <div class="section-header">
        <span class="card-title">编码结果</span>
      </div>
      <div class="section-body">

      <el-tabs v-model="activeTab" @tab-click="onTabClick">
        <!-- 编码预览标签页 -->
        <el-tab-pane label="编码预览" name="preview">
          <div v-if="generatedCodes.length > 0" class="card-default" style="border-top: none;">
            <div class="card-header">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="card-header-title" style="margin-right:4px;">共 {{ generatedCodes.length }} 条</span>
                <span class="filter-divider" />
                <el-button size="default" @click="copyAllPreview">复制全部</el-button>
                <el-button size="default" type="primary" :loading="savedSaving" @click="handleSaveCodes">保存</el-button>
              </div>
            </div>
            <el-table :data="paginatedPreviewCodes" stripe v-loading="savedSaving" style="width:100%" class="styled-table" max-height="520" :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }">
              <el-table-column type="index" label="序号" width="200" align="center" :index="previewPageIndex" />
              <el-table-column prop="code" label="编码" min-width="200" />
              <el-table-column label="编码名称" min-width="200">
                <template #default="{ row }">
                  <div v-if="editingIndex === findPreviewIndex(row)" class="name-editor">
                    <el-input
                      v-model="editingName"
                      size="small"
                      class="name-editor-input"
                      @keyup.enter="confirmEditName"
                      @blur="confirmEditName"
                    />
                  </div>
                  <span v-else class="name-display" @click="startEditName(row)">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="generateTime" label="生成时间" min-width="160" align="center" />
              <el-table-column label="操作" width="80" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="copyCode(row.code)">复制</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="list-pagination">
              <el-pagination
                v-model:current-page="previewPageNum"
                v-model:page-size="previewPageSize"
                :total="generatedCodes.length"
                :page-sizes="[10, 20, 50, 100, 200, 500]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="onPreviewPageChange"
                @size-change="onPreviewSizeChange"
              />
            </div>
          </div>
          <el-empty v-if="generatedCodes.length === 0" description="暂无生成记录" />
        </el-tab-pane>

        <!-- 已生成编码列表 -->
        <el-tab-pane label="编码列表" name="saved">
          <div class="card-default" style="border-top: none;">
            <div class="card-header" style="justify-content: flex-end; border-bottom: none; padding: 8px 16px;">
              <div class="filter-actions">
                <el-button @click="onResetListFilter" size="small">重置</el-button>
                <span class="filter-divider" />
                <el-button :disabled="selectedRows.length === 0" @click="handleExport" size="small">
                  <template #icon><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></template>
                  导出选中
                </el-button>
                <el-button :disabled="selectedRows.length === 0" @click="handleDeleteSelected" size="small">
                  <template #icon><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></template>
                  删除选中
                </el-button>
              </div>
            </div>

            <el-table
              ref="mainTableRef"
              :data="codeList"
              row-key="rowKey"
              :expand-row-keys="expandedRowKeys"
              stripe
              v-loading="listLoading"
              style="width:100%"
              class="styled-table"
              max-height="520"
              @expand-change="onGroupExpand"
              :row-class-name="getExpandRowClass"
              @selection-change="onSelectionChange"
              @filter-change="onHeaderFilterChange"
              :header-cell-style="{ background: '#f0f5ff', color: '#1d40af', fontWeight: 600 }"
            >
              <el-table-column type="selection" width="45" fixed />
              <el-table-column type="index" label="序号" width="60" align="center" fixed />
              <el-table-column label="类型" width="100" align="center" column-key="typeCode" :filters="headerFilterOptions.typeCode" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag :type="typeTagType(row.type_code)" size="small" effect="plain">{{ typeLabel(row.type_code) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="场站" align="center" column-key="stationCode" :filters="headerFilterOptions.stationCode" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; margin-right: 4px;">{{ row.station_code }}</el-tag>
                  <span class="cell-name"> {{ row.station_name || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="二级类码" column-key="secondClassCode" :filters="headerFilterOptions.secondClassCode" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag size="small" color="#e8f4fd" style="color: #1677ff; border: none; font-family: monospace; margin-right: 4px;">{{ row.second_class_code }}</el-tag>
                  <span v-if="row.second_class_name" class="cell-name"> {{ row.second_class_name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="三级类码" column-key="thirdClassCode" :filters="headerFilterOptions.thirdClassCode" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag size="small" color="#f3e8ff" style="color: #8b5cf6; border: none; font-family: monospace; margin-right: 4px;">{{ row.third_class_code }}</el-tag>
                  <span v-if="row.third_class_name" class="cell-name"> {{ row.third_class_name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据类码" column-key="dataTypeCode" :filters="headerFilterOptions.dataTypeCode" filter-placement="bottom">
                <template #default="{ row }">
                  <el-tag size="small" color="#f0f9eb" style="color: #67c23a; border: none; font-family: monospace; margin-right: 4px;">{{ row.data_type_code }}</el-tag>
                  <span v-if="row.data_type_name" class="cell-name"> {{ row.data_type_name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="数据码">
                <template #default="{ row }">
                  <el-tag size="small" color="#fdf6ec" style="color: #e6a23c; border: none; font-family: monospace; margin-right: 4px;">{{ row.data_code }}</el-tag>
                  <span v-if="row.data_name" class="cell-name"> {{ row.data_name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center">
                <template #default="{ row }">
                  <el-tag size="small" round type="primary" class="code-count-tag">{{ row.code_count }}</el-tag>
                  <el-button link type="primary" size="small" @click="toggleRowExpand(row)">
                    <template #icon><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline :points="isRowExpanded(row) ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/></svg></template>
                    {{ isRowExpanded(row) ? '收起' : '明细' }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div v-if="row._detailLoading" class="expand-loading">加载中...</div>
                  <div v-else class="detail-wrapper">
                    <el-table :data="row._detailList" size="small" class="detail-table">
                      <el-table-column type="index" label="序号" align="center" />
                      <el-table-column label="测点编码" prop="code" />
                      <el-table-column label="测点名称" prop="name" />
                      <el-table-column label="生成时间" prop="create_date" align="center" />
                    </el-table>
                  </div>
                </template>
              </el-table-column>
            </el-table>

            <div class="list-pagination">
              <el-pagination
                v-model:current-page="listPageNum"
                v-model:page-size="listPageSize"
                :total="listTotal"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next"
                background
                @current-change="loadCodeList"
                @size-change="loadCodeList"
              />
            </div>
          </div>
        </el-tab-pane>

      </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import * as dictService from '@/services/dict';
import * as codeService from '@/services/code-generation';
import * as statsService from '@/services/statistics';
import { generateCodeRequestSchema } from '@cec/contracts';
import AddCodeDialog from '@/components/add-code-dialog.vue';

const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
const currentTenant = authUser?.tenant || authUser?.username || '';

interface ConditionField {
  key: string;
  label: string;
  required: boolean;
  disabled: (conds: Record<string, string>) => boolean;
  type?: 'select' | 'input' | 'extend-input' | 'extend-number'; // 字段类型：下拉选择、输入框、扩展输入框、扩展数字输入框
  quickOptions?: string[]; // 快捷选择项
  multiple?: boolean; // 是否支持多选
}

const conditionFields: ConditionField[] = [
  { key: 'stationCode', label: '场站', required: true, disabled: () => false, type: 'select' },
  { key: 'typeCode', label: '类型', required: true, disabled: () => false, type: 'select', quickOptions: ['F1', 'F2', 'F3', 'F4', 'G1', 'G2', 'S1', 'Y0'] },
  { key: 'projectLineCode', label: '项目期号&并网线路', required: true, disabled: () => false, type: 'input', quickOptions: ['111', '112', '121', '122'] },
  { key: 'prefixNo', label: '前缀号', required: true, disabled: () => false, type: 'select' },
  { key: 'firstClassCode', label: '一级类码', required: true, disabled: () => false, type: 'select' },
  { key: 'secondClassCode', label: '二级类码', required: true, disabled: (c) => !c.firstClassCode, type: 'select' },
  { key: 'secondExtCode', label: '二级类扩展码', required: true, disabled: (c) => !c.secondClassCode, type: 'extend-number' },
  { key: 'thirdClassCode', label: '三级类码', required: true, disabled: (c) => !c.secondClassCode, type: 'select' },
  { key: 'thirdExtCode', label: '三级类扩展码', required: true, disabled: (c) => !c.thirdClassCode, type: 'extend-number' },
  { key: 'dataTypeCode', label: '数据类码', required: true, disabled: (c) => !c.secondClassCode, type: 'select' },
  { key: 'dataCode', label: '数据码', required: true, disabled: (c) => !c.dataTypeCode, type: 'select', multiple: true },
];

const conditions = reactive<Record<string, any>>({});
const dictOptions = reactive<Record<string, Array<{ code: string; name: string }>>>({});

/** 记录上一次的类型编码，用于判断是否跨类型家族切换 */
const previousTypeCode = ref('');

/** 从类型编码中提取家族前缀，如 F1->F, G1->G, S1->S, Y0->Y */
function getTypeFamily(typeCode: string): string {
  return typeCode ? typeCode.charAt(0) : '';
}
const generatedCodes = ref<Array<{ code: string; name: string; generateTime: string }>>([]);

/** 预览分页数据 */
const previewPageNum = ref(1);
const previewPageSize = ref(50);

const paginatedPreviewCodes = computed(() => {
  const start = (previewPageNum.value - 1) * previewPageSize.value;
  return generatedCodes.value.slice(start, start + previewPageSize.value);
});

function previewPageIndex(index: number) {
  return (previewPageNum.value - 1) * previewPageSize.value + index + 1;
}

function findPreviewIndex(row: { code: string; generateTime: string }) {
  return generatedCodes.value.findIndex(r => r.code === row.code && r.generateTime === row.generateTime);
}

function onPreviewPageChange(page: number) {
  previewPageNum.value = page;
}

function onPreviewSizeChange(size: number) {
  previewPageSize.value = size;
  previewPageNum.value = 1;
}

/** 锁定编码生成（本地存储持久化） */
const LOCKED_FIELDS_KEY = 'locked_filter_fields';
const LOCKED_VALUES_KEY = 'locked_filter_values';
const LOCKABLE_FIELDS = ['stationCode', 'typeCode', 'projectLineCode', 'prefixNo', 'firstClassCode', 'secondClassCode'];
const lockedFields = reactive<Record<string, boolean>>({
  stationCode: false,
  typeCode: false,
  projectLineCode: false,
  prefixNo: false,
  firstClassCode: false,
  secondClassCode: false,
});

function loadLockedState() {
  try {
    const saved = localStorage.getItem(LOCKED_FIELDS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      LOCKABLE_FIELDS.forEach(key => {
        if (parsed[key]) lockedFields[key] = true;
      });
    }
  } catch {}
}

function saveLockedState() {
  localStorage.setItem(LOCKED_FIELDS_KEY, JSON.stringify({ ...lockedFields }));
  const values: Record<string, any> = {};
  LOCKABLE_FIELDS.forEach(key => {
    if (lockedFields[key]) values[key] = conditions[key];
  });
  localStorage.setItem(LOCKED_VALUES_KEY, JSON.stringify(values));
}

function loadLockedValues(): Record<string, any> {
  try {
    const saved = localStorage.getItem(LOCKED_VALUES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function toggleLock(key: string) {
  lockedFields[key] = !lockedFields[key];
  saveLockedState();
}

const activeTab = ref('preview');
const editingIndex = ref<number | null>(null);
const editingName = ref('');
const nameInputRef = ref<any>(null);

/** 已保存编码 */
const savedCodes = ref<Array<{
  id: number;
  code: string;
  name: string;
  type_code?: string;
  second_class_code?: string;
  data_type_code?: string;
  station_code?: string;
  third_class_code?: string;
  generate_time: string;
}>>([]);
const savedTotal = ref(0);
const savedPageNum = ref(1);
const savedPageSize = ref(50);
const savedDateRange = ref<[string, string] | null>(null);
const savedLoading = ref(false);
const savedSaving = ref(false);
const savedTableRef = ref<any>(null);
const selectedSavedIds = ref<number[]>([]);
const savedRangeStart = ref(1);
const savedRangeEnd = ref(1);

function onSavedSelectionChange(rows: any[]) {
  selectedSavedIds.value = rows.map((r: any) => r.id);
}

/** 选中行范围 */
function selectSavedRange() {
  const len = savedCodes.value.length;
  const start = Math.max(1, Math.min(savedRangeStart.value, savedRangeEnd.value));
  const end = Math.min(len, Math.max(savedRangeStart.value, savedRangeEnd.value));
  savedTableRef.value?.clearSelection();
  for (let i = start - 1; i < end; i++) {
    savedTableRef.value?.toggleRowSelection(savedCodes.value[i], true);
  }
}

/** 取消选中 */
function clearSavedSelection() {
  savedTableRef.value?.clearSelection();
}

/** 复制选中编码 */
function copySelectedSaved() {
  const rows = savedTableRef.value?.getSelectionRows();
  if (!rows || rows.length === 0) {
    ElMessage.warning('请先选择要复制的编码');
    return;
  }
  const text = rows.map((r: any) => `${r.code} ${r.name}`).join('\n');
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败，请手动选择复制'),
  );
}

/** 导出选中为 Excel */
function exportSelectedSaved() {
  const rows = savedTableRef.value?.getSelectionRows();
  if (!rows || rows.length === 0) {
    ElMessage.warning('请先选择要导出的编码');
    return;
  }
  const data = rows.map((r: any, i: number) => ({
    '序号': i + 1,
    '编码': r.code,
    '编码名称': r.name,
    '生成时间': r.generate_time,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '编码记录');
  XLSX.writeFile(wb, `编码记录_${new Date().toISOString().slice(0, 10)}.xlsx`);
  ElMessage.success(`已导出 ${data.length} 条记录`);
}

/** 删除选中记录 */
async function deleteSelectedSaved() {
  const rows = savedTableRef.value?.getSelectionRows();
  if (!rows || rows.length === 0) {
    ElMessage.warning('请先选择要删除的编码');
    return;
  }
  const ids = rows.map((r: any) => r.id);
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${ids.length} 条编码吗？删除后数据将置为失效状态。`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
    const result = await codeService.batchDeleteCodeRecords(ids);
    ElMessage.success(`已删除 ${result.deletedCount} 条`);
    savedCodes.value = savedCodes.value.filter((c: any) => !ids.includes(c.id));
    savedTotal.value -= result.deletedCount;
    selectedSavedIds.value = [];
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败');
    }
  }
}

// ===== 编码生成列表（从统计分析复制）=====
const mainTableRef = ref<any>(null);
const codeList = ref<any[]>([]);
const listTotal = ref(0);
const listPageNum = ref(1);
const listPageSize = ref(20);
const listLoading = ref(false);
const expandedRowKeys = ref<string[]>([]);

function getRowKey(row: any): string {
  return `${row.type_code}|${row.station_code}|${row.second_class_code}|${row.third_class_code}|${row.data_type_code}|${row.data_code}`;
}

function isRowExpanded(row: any): boolean {
  return expandedRowKeys.value.includes(getRowKey(row));
}

async function toggleRowExpand(row: any) {
  const key = getRowKey(row);
  const idx = expandedRowKeys.value.indexOf(key);
  if (idx >= 0) {
    expandedRowKeys.value.splice(idx, 1);
  } else {
    if (row._detailList.length === 0) {
      row._detailLoading = true;
      try {
        row._detailList = await statsService.getCodeGenGroupDetail({
          typeCode: row.type_code,
          stationCode: row.station_code,
          secondClassCode: row.second_class_code,
          thirdClassCode: row.third_class_code,
          dataTypeCode: row.data_type_code,
          dataCode: row.data_code,
        });
      } catch {
        row._detailList = [];
      } finally {
        row._detailLoading = false;
      }
    }
    expandedRowKeys.value.push(key);
  }
}

function enrichListData(list: any[]) {
  return list.map(item => ({ ...item, rowKey: getRowKey(item), _detailList: [], _detailLoading: false }));
}

/** 表头筛选选项（Code + Name 去重） */
const headerFilterOptions = computed(() => {
  const map = filterOptionMap.value;
  const toFilter = (items: Array<{ code: string; name: string }>) => {
    const seen = new Set<string>();
    return items.filter(i => {
      if (!i.code) return false;
      const key = `${i.code}|${i.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(i => ({ text: `${i.code} ${i.name}`, value: `${i.code}|${i.name}` }));
  };
  return {
    typeCode: toFilter(map.typeCodes),
    stationCode: toFilter(map.stationCodes),
    secondClassCode: toFilter(map.secondClassCodes),
    thirdClassCode: toFilter(map.thirdClassCodes),
    dataTypeCode: toFilter(map.dataTypeCodes),
  };
});

/** 从列头筛选值中提取编码（值格式为 "code|name"） */
function extractCode(val: string | undefined): string | undefined {
  return val ? val.split('|')[0] : undefined;
}

/** 列头筛选变化 → 更新对应筛选条件 → 触发查询 */
function onHeaderFilterChange(filters: Record<string, any[]>) {
  if ('typeCode' in filters) {
    const val = filters.typeCode || [];
    listFilters.typeCode = extractCode(val.length > 0 ? val[0] : undefined);
  }
  if ('stationCode' in filters) {
    const val = filters.stationCode || [];
    listFilters.stationCode = extractCode(val.length > 0 ? val[0] : undefined);
  }
  if ('secondClassCode' in filters) {
    const val = filters.secondClassCode || [];
    listFilters.secondClassCode = extractCode(val.length > 0 ? val[0] : undefined);
  }
  if ('thirdClassCode' in filters) {
    const val = filters.thirdClassCode || [];
    listFilters.thirdClassCode = extractCode(val.length > 0 ? val[0] : undefined);
  }
  if ('dataTypeCode' in filters) {
    const val = filters.dataTypeCode || [];
    listFilters.dataTypeCode = extractCode(val.length > 0 ? val[0] : undefined);
  }
  listPageNum.value = 1;
  loadCodeList();
}

function typeTagType(code: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' {
  if (!code) return 'info';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return 'primary';
  if (first === 'G') return 'success';
  if (first === 'S') return 'info';
  return 'warning';
}

function typeLabel(code: string): string {
  if (!code) return '其他';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return '风电';
  if (first === 'G') return '光伏';
  if (first === 'S') return '水电';
  return '其他';
}

const filterOptionMap = ref<{
  typeCodes: Array<{ code: string; name: string }>;
  stationCodes: Array<{ code: string; name: string }>;
  secondClassCodes: Array<{ code: string; name: string }>;
  thirdClassCodes: Array<{ code: string; name: string }>;
  dataTypeCodes: Array<{ code: string; name: string }>;
}>({ typeCodes: [], stationCodes: [], secondClassCodes: [], thirdClassCodes: [], dataTypeCodes: [] });
const listFilters = reactive({
  typeCode: undefined as string | undefined,
  stationCode: undefined as string | undefined,
  secondClassCode: undefined as string | undefined,
  thirdClassCode: undefined as string | undefined,
  dataTypeCode: undefined as string | undefined,
});

async function loadCodeList() {
  listLoading.value = true;
  try {
    const result = await statsService.getCodeGenList(listPageNum.value, listPageSize.value, listFilters);
    codeList.value = enrichListData(result.list || []);
    listTotal.value = result.total || 0;
    filterOptionMap.value = result.filterOptions;
  } catch {
    codeList.value = [];
    listTotal.value = 0;
  } finally {
    listLoading.value = false;
  }
}

async function onGroupExpand(row: any, expandedRows: any[]) {
  if (!expandedRows.includes(row)) return;
  if (row._detailList.length > 0) return;
  row._detailLoading = true;
  try {
    row._detailList = await statsService.getCodeGenGroupDetail({
      typeCode: row.type_code,
      stationCode: row.station_code,
      secondClassCode: row.second_class_code,
      thirdClassCode: row.third_class_code,
      dataTypeCode: row.data_type_code,
      dataCode: row.data_code,
    });
  } catch {
    row._detailList = [];
  } finally {
    row._detailLoading = false;
  }
}

function onTypeChange() {
  listFilters.secondClassCode = undefined;
  listFilters.dataTypeCode = undefined;
  listPageNum.value = 1;
  loadCodeList();
}

function onSecondClassChange() {
  listFilters.dataTypeCode = undefined;
  listPageNum.value = 1;
  loadCodeList();
}

function onListFilter() {
  listPageNum.value = 1;
  loadCodeList();
}

function onResetListFilter() {
  listFilters.typeCode = undefined;
  listFilters.stationCode = undefined;
  listFilters.secondClassCode = undefined;
  listFilters.thirdClassCode = undefined;
  listFilters.dataTypeCode = undefined;
  listPageNum.value = 1;
  mainTableRef.value?.clearFilter();
  loadCodeList();
}

const selectedRows = ref<any[]>([]);

function onSelectionChange(rows: any[]) {
  selectedRows.value = rows;
}

async function handleExport() {
  const rows: Array<Record<string, string>> = [];
  for (const row of selectedRows.value) {
    let details = row._detailList;
    if (!details || details.length === 0) {
      try {
        details = await statsService.getCodeGenGroupDetail({
          typeCode: row.type_code,
          stationCode: row.station_code,
          secondClassCode: row.second_class_code,
          thirdClassCode: row.third_class_code,
          dataTypeCode: row.data_type_code,
          dataCode: row.data_code,
        });
      } catch { continue; }
    }
    for (const d of details) {
      rows.push({
        类型: row.type_code,
        场站: `${row.station_code} ${row.station_name}`.trim(),
        二级类码: `${row.second_class_code} ${row.second_class_name}`.trim(),
        三级类码: `${row.third_class_code} ${row.third_class_name}`.trim(),
        数据类码: `${row.data_type_code} ${row.data_type_name}`.trim(),
        数据码: `${row.data_code} ${row.data_name}`.trim(),
        测点编码: d.code,
        测点名称: d.name,
        生成时间: d.create_date,
      });
    }
  }
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '明细');
  ws['!cols'] = [
    { wch: 8 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 12 }
  ];
  XLSX.writeFile(wb, `编码明细_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function getExpandRowClass({ row }: { row: any }) {
  return isRowExpanded(row) ? 'row-expanded-active' : '';
}

async function handleDeleteSelected() {
  if (selectedRows.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 组编码吗？删除后数据将置为失效状态。`,
      '确认删除',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    );
    const groups = selectedRows.value.map((row: any) => ({
      typeCode: row.type_code,
      stationCode: row.station_code,
      secondClassCode: row.second_class_code,
      thirdClassCode: row.third_class_code,
      dataTypeCode: row.data_type_code,
      dataCode: row.data_code,
    }));
    const result = await statsService.deleteCodeGenGroups(groups);
    ElMessage.success(`已删除 ${result.deletedCount} 条编码记录`);
    selectedRows.value = [];
    loadCodeList();
    loadCodeTotalCount();
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败');
    }
  }
}

/** 快捷筛选 */
const quickSearchText = ref('');
const quickSearchResults = ref<Array<{
  typeCode: string;
  secondClassCode: string; secondClassName: string;
  dataCategoryCode: string; dataCategoryName: string;
  dataCode: string; dataName: string;
  isManual?: string;
}>>([]);
const quickSearchLoading = ref(false);
const quickSearchSearched = ref(false);
const quickSearchTotal = ref(0);
const quickSearchTableRef = ref<any>(null);
const quickSearchPageNum = ref(1);
const quickSearchPageSize = ref(20);
const quickSearchTypeFilter = ref('');
const quickSearchSecondClassFilter = ref<string[]>([]);
const quickSearchTypeOptions = ref<string[]>([]);
const quickSearchLocked = ref(false);
let quickSearchTimer: ReturnType<typeof setTimeout> | null = null;

function toggleQuickSearchLock() {
  quickSearchLocked.value = !quickSearchLocked.value;
}

const quickSearchSecondClassOptions = ref<Array<{ code: string; name: string; typeCode: string }>>([]);

/** 列头筛选选项：二级类码 */
const quickSearchSecondClassFilterOptions = computed(() => {
  // 使用后端返回的全量去重结果，而非当前页数据
  return quickSearchSecondClassOptions.value.map(s => ({
    text: `${s.code} ${s.name}`,
    value: `${s.code}|${s.name}`,
  }));
});

/** 二级类码表头选中的编码列表 */
const quickSearchSecondClassFilterCodes = computed(() => {
  const f = quickSearchSecondClassFilter.value;
  if (!f) return [];
  return f.map((v: string) => v.split('|')[0]);
});

/** 表头筛选变化 → 重新搜索（传给后端过滤） */
function onQuickSearchHeaderFilterChange(filters: Record<string, any[]>) {
  if ('quickSecondClassCode' in filters) {
    // 锁定状态下忽略二级类码筛选变更
    if (quickSearchLocked.value) {
      // 恢复为锁定的筛选值
      quickSearchTableRef.value?.clearFilter('quickSecondClassCode');
      return;
    }
    quickSearchSecondClassFilter.value = filters.quickSecondClassCode || [];
    // 如果是用户主动点击筛选（非 clearFilter 触发的），重新搜索
    if (quickSearchSearched.value) {
      doQuickSearch();
    }
  }
}

function onQuickSearchFilterChange() {
  if (quickSearchLocked.value) return;
  // 类型切换后清除二级类码筛选并重新搜索
  quickSearchSecondClassFilter.value = [];
  quickSearchTableRef.value?.clearFilter('quickSecondClassCode');
  doQuickSearch();
}

/** 执行带当前编码生成的服务端搜索 */
async function doQuickSearch(resetPage: boolean = true) {
  const text = quickSearchText.value.trim();
  if (!text) return;
  quickSearchLoading.value = true;
  if (resetPage) quickSearchPageNum.value = 1;
  try {
    const typeFilter = quickSearchTypeFilter.value || undefined;
    const secondClassFilter = quickSearchSecondClassFilterCodes.value.length > 0 ? quickSearchSecondClassFilterCodes.value.join(',') : undefined;
    const result = await dictService.quickSearchDict(text, quickSearchPageNum.value, quickSearchPageSize.value, typeFilter, secondClassFilter);
    quickSearchResults.value = result.items;
    quickSearchTotal.value = result.total;
    quickSearchTypeOptions.value = result.typeOptions || [];
    quickSearchSecondClassOptions.value = (result.secondClassOptions || []).map(s => ({
      code: s.secondClassCode,
      name: s.secondClassName,
      typeCode: s.typeCode,
    }));
  } catch {
    quickSearchResults.value = [];
    quickSearchTotal.value = 0;
  } finally {
    quickSearchLoading.value = false;
  }
}

async function onQuickSearchPageChange() {
  doQuickSearch(false);
}

/** 手动新增编码字典对话框 */
const showAddDialog = ref(false);

function onAddCodeSuccess() {
  if (quickSearchText.value.trim()) {
    onQuickSearchInput();
  }
}

/** 最近搜索标签 */
const RECENT_SEARCH_KEY = 'quick_recent_searches';
const recentSearchTags = ref<string[]>(loadRecentSearchTags());

function loadRecentSearchTags(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_SEARCH_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentSearchTag(text: string) {
  const tags = recentSearchTags.value.filter(t => t !== text);
  tags.unshift(text);
  if (tags.length > 5) tags.length = 5;
  recentSearchTags.value = tags;
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(tags));
}

function removeRecentTag(tag: string) {
  recentSearchTags.value = recentSearchTags.value.filter(t => t !== tag);
  localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(recentSearchTags.value));
}

function onRecentTagClick(tag: string) {
  quickSearchText.value = tag;
  onQuickSearchInput();
}

function onQuickSearchInput() {
  if (quickSearchTimer) clearTimeout(quickSearchTimer);
  const text = quickSearchText.value.trim();
  if (!text) {
    quickSearchResults.value = [];
    quickSearchSearched.value = false;
    quickSearchTotal.value = 0;
    quickSearchPageNum.value = 1;
    if (!quickSearchLocked.value) {
      quickSearchTypeFilter.value = '';
      quickSearchSecondClassFilter.value = [];
      quickSearchSecondClassOptions.value = [];
      quickSearchTypeOptions.value = [];
    }
    return;
  }
  quickSearchTimer = setTimeout(async () => {
    quickSearchSearched.value = true;
    if (!quickSearchLocked.value) {
      quickSearchTypeFilter.value = '';
      quickSearchSecondClassFilter.value = [];
      quickSearchTableRef.value?.clearFilter();
    }
    await doQuickSearch();
    if (quickSearchResults.value.length > 0) {
      saveRecentSearchTag(text);
    }
  }, 300);
}

function onQuickSearchClear() {
  quickSearchResults.value = [];
  quickSearchSearched.value = false;
  quickSearchTotal.value = 0;
  quickSearchPageNum.value = 1;
  quickSearchLocked.value = false;
  quickSearchTypeFilter.value = '';
  quickSearchSecondClassFilter.value = [];
  quickSearchSecondClassOptions.value = [];
  quickSearchTypeOptions.value = [];
}

/** 复制单行名称（二级类 + 数据类 + 数据码名称，tab 分隔便于贴到Excel） */
function copyQuickCodes(row: { secondClassName: string; dataCategoryName: string; dataName: string }) {
  const text = `${row.secondClassName}\t${row.dataCategoryName}\t${row.dataName}`;
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败'),
  );
}

/** 点击快速检索结果行，自动填入编码生成 */
async function onQuickSearchRowClick(row: {
  typeCode: string;
  secondClassCode: string; secondClassName: string;
  dataCategoryCode: string; dataCategoryName: string;
  dataCode: string; dataName: string;
}) {
  ElMessage.success('筛选成功');

  // 类型域 -> 具体类型码映射（type_domain_code 如 'F' 需转为 'F1'）
  const typeCodeMap: Record<string, string> = {
    F: 'F1',
  S: 'S1',
    G: 'G1',
  };
  // 如果类型已锁定，使用当前值；否则使用快速检索的映射值
  const resolvedTypeCode = lockedFields.typeCode
    ? conditions.typeCode
    : (typeCodeMap[row.typeCode] || row.typeCode);
  conditions.typeCode = resolvedTypeCode;
  // 2. 触发类型级联，加载二级类码列表
  await onConditionChange('typeCode');

  // 3. 设置二级类码（即使锁定也自动填充）
  conditions.secondClassCode = row.secondClassCode;
  // 4. 触发二级类级联，加载三级类码/数据类码列表
  await onConditionChange('secondClassCode');

  // 5. 设置数据类码
  conditions.dataTypeCode = row.dataCategoryCode;
  // 6. 触发数据类码级联，加载数据码列表
  await onConditionChange('dataTypeCode');

  // 7. 设置数据码
  conditions.dataCode = [row.dataCode];
}

const canGenerate = computed(() => {
  return conditionFields.every((field) => {
    if (!field.required) return true;

    if (field.type === 'extend-number') {
      // 对于扩展数字字段，检查起始值是否已填写
      return !!conditions[field.key + 'Start'];
    } else {
      // 对于其他字段，检查字段值是否存在
      const val = conditions[field.key];
      if (field.multiple) {
        return Array.isArray(val) && val.length > 0;
      }
      return !!val;
    }
  });
});

/** 解析扩展格式，如"5,3"返回数量，如"0005"返回1 */
function parseExtendFormatCount(extendStr: string): number {
  if (!extendStr) return 0;

  // 如果是标准的4位编码，直接返回1
  if (/^\d{4}$/.test(extendStr)) {
    return 1;
  }

  // 尝试解析"从X开始拓展X条"格式，如"5,3"
  const match = extendStr.match(/^(\d+)\s*,\s*(\d+)$/);
  if (match) {
    const count = parseInt(match[2], 10);
    return Math.max(1, count);
  }

  // 默认返回1
  return 1;
}

/** 预计生成的编码数量 */
const expectedCodeCount = computed(() => {
  // 获取二级类扩展码字符串
  let secondExtStr = '';
  if (conditions.secondExtCodeStart && conditions.secondExtCodeCount) {
    secondExtStr = `${conditions.secondExtCodeStart},${conditions.secondExtCodeCount}`;
  } else if (conditions.secondExtCodeStart) {
    secondExtStr = conditions.secondExtCodeStart.toString().padStart(4, '0');
  }

  // 获取三级类扩展码字符串
  let thirdExtStr = '';
  if (conditions.thirdExtCodeStart && conditions.thirdExtCodeCount) {
    thirdExtStr = `${conditions.thirdExtCodeStart},${conditions.thirdExtCodeCount}`;
  } else if (conditions.thirdExtCodeStart) {
    thirdExtStr = conditions.thirdExtCodeStart.toString().padStart(4, '0');
  }

  const secondCount = parseExtendFormatCount(secondExtStr);
  const thirdCount = parseExtendFormatCount(thirdExtStr);
  const dataCodeCount = Array.isArray(conditions.dataCode) ? conditions.dataCode.length : 1;

  return secondCount * thirdCount * dataCodeCount;
});

// 初始化加载顶级字典
onMounted(async () => {
  try {
    // 加载锁定的编码生成状态
    loadLockedState();

    const [stations, types, prefixes, firstClass] = await Promise.all([
      dictService.getDictItems('station'),
      dictService.getDictItems('type'),
      dictService.getDictItems('prefix'),
      dictService.getCascadedDictItems(''),
    ]);
    dictOptions['stationCode'] = stations;
    dictOptions['typeCode'] = types;
    dictOptions['prefixNo'] = prefixes;
    dictOptions['firstClassCode'] = firstClass;
    dictOptions['dataTypeCode'] = []; // 数据类码需要根据类型和二级类码加载，初始化为空

    // 设置默认值
    // 前缀号默认"内部数据"（编码为0）
    const internalDataPrefix = prefixes.find(p => p.name === '内部数据');
    if (internalDataPrefix) {
      conditions.prefixNo = internalDataPrefix.code;
    }

    // 一级类码默认"生产运行"（编码为B1）
    const productionOperation = firstClass.find(f => f.name === '生产运行');
    if (productionOperation) {
      conditions.firstClassCode = productionOperation.code;
    }

    // 如果字段已锁定，从localStorage恢复锁定的值；否则使用默认值
    const lockedValues = loadLockedValues();
    conditions.stationCode = lockedFields.stationCode ? (lockedValues.stationCode || '') : '';
    conditions.typeCode = lockedFields.typeCode ? (lockedValues.typeCode || '') : 'F1';
    conditions.prefixNo = lockedFields.prefixNo ? (lockedValues.prefixNo || '') : (internalDataPrefix ? internalDataPrefix.code : '');
    conditions.firstClassCode = lockedFields.firstClassCode ? (lockedValues.firstClassCode || '') : (productionOperation ? productionOperation.code : '');
    conditions.projectLineCode = lockedFields.projectLineCode ? (lockedValues.projectLineCode || '') : '111';
    conditions.secondClassCode = lockedFields.secondClassCode ? (lockedValues.secondClassCode || '') : '';

    // 项目期号&并网线路默认"111"
    conditions.projectLineCode = '111';

    // 设置扩展码默认值
    // 二级类扩展码：起始默认1，数量默认1
    conditions.secondExtCodeStart = '1';
    conditions.secondExtCodeCount = '1';

    // 三级类扩展码：起始默认0，数量默认1
    conditions.thirdExtCodeStart = '0';
    conditions.thirdExtCodeCount = '1';

    // 触发类型级联加载二级类码
    await onConditionChange('typeCode');

    // 加载编码生成列表
    loadCodeList();
    // 加载编码总数
    loadCodeTotalCount();
  } catch (err: any) {
    ElMessage.error('编码生成加载失败，请刷新重试');
  }
});

// 条件变更联动
async function onConditionChange(key: string) {
  const cascadeMap: Record<string, string> = {
    firstClassCode: 'secondClassCode',
    secondClassCode: 'thirdClassCode', // 二级类码变更时清空三级类码
    dataTypeCode: 'dataCode',
  };

  const nextKey = cascadeMap[key];
  if (nextKey) {
    const field = conditionFields.find(f => f.key === nextKey);
    conditions[nextKey] = field?.multiple ? [] : '';
    dictOptions[nextKey] = [];
  }

  // 类型代码变更时，重新加载二级类码列表
  if (key === 'typeCode') {
    const newFamily = getTypeFamily(conditions[key]);
    const oldFamily = getTypeFamily(previousTypeCode.value);

    if (newFamily !== oldFamily) {
      // 跨类型家族切换（如 F->G），清空二级类码及其后续级联字段
      // 但如果字段已锁定，保留锁定的值
      if (!lockedFields.secondClassCode) {
        conditions.secondClassCode = '';
      }
      conditions.secondExtCodeStart = '1';
      conditions.secondExtCodeCount = '1';
      conditions.thirdClassCode = '';
      conditions.thirdExtCodeStart = '0';
      conditions.thirdExtCodeCount = '1';
      conditions.dataTypeCode = '';
      conditions.dataCode = [];
      dictOptions['secondClassCode'] = [];
      dictOptions['thirdClassCode'] = [];
      dictOptions['dataTypeCode'] = [];
      dictOptions['dataCode'] = [];
    }

    // 加载新类型下的二级类码选项
    try {
      const secondClassItems = await dictService.getSecondClassByType(conditions[key]);
      dictOptions['secondClassCode'] = secondClassItems;
    } catch {}

    if (newFamily !== oldFamily && generatedCodes.value.length > 0) {
      generatedCodes.value = [];
    }

    previousTypeCode.value = conditions[key];
    return;
  }

  if (key === 'secondClassCode') {
    // 清空二级类码后续的字段并恢复扩展码默认值
    conditions.secondExtCodeStart = '1';
    conditions.secondExtCodeCount = '1';
    conditions.thirdClassCode = '';
    conditions.thirdExtCodeStart = '0';
    conditions.thirdExtCodeCount = '1';
    conditions.dataTypeCode = '';
    conditions.dataCode = [];
    dictOptions['thirdClassCode'] = [];
    dictOptions['dataTypeCode'] = [];
    dictOptions['dataCode'] = [];

    if (conditions[key]) {
      try {
        // 根据类型和二级类码获取数据类码
        if (conditions.typeCode && conditions[key]) {
          const dataTypes = await dictService.getDataTypeBySecondClass(conditions.typeCode, conditions[key]);
          dictOptions['dataTypeCode'] = dataTypes;
        } else {
          dictOptions['dataTypeCode'] = [];
        }
      } catch {}
    }
  }

  if (key === 'dataTypeCode' && conditions[key]) {
    try {
      const dataCodes = await dictService.getDataCodes(conditions[key], conditions.secondClassCode, conditions.typeCode);
      dictOptions['dataCode'] = dataCodes;
    } catch {}
  }

  // 联动加载子级字典
  if (['firstClassCode', 'secondClassCode', 'thirdClassCode'].includes(key) && conditions[key]) {
    try {
      if (key === 'firstClassCode') {
        // 根据类型获取二级类码
        if (conditions.typeCode) {
          const secondClassItems = await dictService.getSecondClassByType(conditions.typeCode);
          dictOptions['secondClassCode'] = secondClassItems;
          // 如果当前选择的二级类码不在新列表中，清空它（虽然cascadeMap已清空，但为了安全）
          const currentSecondClass = conditions.secondClassCode;
          if (currentSecondClass && !secondClassItems.find(item => item.code === currentSecondClass)) {
            conditions.secondClassCode = '';
            conditions.secondExtCode = '';
            conditions.thirdClassCode = '';
            conditions.thirdExtCode = '';
            dictOptions['thirdClassCode'] = [];
          }
        } else {
          // 类型未选择，清空二级类码列表
          dictOptions['secondClassCode'] = [];
          conditions.secondClassCode = '';
          conditions.secondExtCode = '';
          conditions.thirdClassCode = '';
          conditions.thirdExtCode = '';
          dictOptions['thirdClassCode'] = [];
        }
      } else if (key === 'secondClassCode') {
        // 查询三级类码，使用二级类码作为parentCode，类型代码作为typeCode参数
        const items = await dictService.getCascadedDictItems(conditions[key], conditions.typeCode);
        dictOptions['thirdClassCode'] = items;
      } else if (key === 'thirdClassCode') {
        // 三级类码切换时，三级类扩展码重置为默认值
        conditions.thirdExtCodeStart = '0';
        conditions.thirdExtCodeCount = '1';
      }
    } catch {}
  }

  // 清空已生成的编码
  if (generatedCodes.value.length > 0) {
    generatedCodes.value = [];
  }
}

/** 限制起始输入：最多4位数字，按类型限制最小值 */
function limitStartInput(value: string, key: string) {
  // 去除非数字字符
  const cleaned = value.replace(/\D/g, '');
  // 最多4位
  const truncated = cleaned.slice(0, 4);
  conditions[key + 'Start'] = truncated;
}

/** 限制数量输入：最多2位数字，最大值99 */
function limitCountInput(value: string, key: string) {
  // 去除非数字字符
  const cleaned = value.replace(/\D/g, '');
  // 最多2位
  const truncated = cleaned.slice(0, 2);
  // 超过99则截断为99
  const num = parseInt(truncated, 10);
  if (!isNaN(num) && num > 99) {
    conditions[key + 'Count'] = '99';
  } else {
    conditions[key + 'Count'] = truncated;
  }
}

// 扩展数字输入框变化处理
function onExtendNumberChange(key: string) {
  // 扩展码不与其他编码生成联动，只清空已生成的编码
  if (generatedCodes.value.length > 0) {
    generatedCodes.value = [];
  }
}

async function handleGenerate() {
  try {
    // 组合扩展码：将起始值和数量组合成"5,3"格式
    const baseConditions = { ...conditions };

    // 处理二级类扩展码
    if (conditions.secondExtCodeStart && conditions.secondExtCodeCount) {
      baseConditions.secondExtCode = `${conditions.secondExtCodeStart},${conditions.secondExtCodeCount}`;
    } else if (conditions.secondExtCodeStart) {
      baseConditions.secondExtCode = conditions.secondExtCodeStart.toString().padStart(4, '0');
    }

    // 处理三级类扩展码
    if (conditions.thirdExtCodeStart && conditions.thirdExtCodeCount) {
      baseConditions.thirdExtCode = `${conditions.thirdExtCodeStart},${conditions.thirdExtCodeCount}`;
    } else if (conditions.thirdExtCodeStart) {
      baseConditions.thirdExtCode = conditions.thirdExtCodeStart.toString().padStart(4, '0');
    }

    // 删除扩展数字字段的原始Start/Count属性，避免schema验证问题
    delete baseConditions.secondExtCodeStart;
    delete baseConditions.secondExtCodeCount;
    delete baseConditions.thirdExtCodeStart;
    delete baseConditions.thirdExtCodeCount;

    // 获取所有待生成的数据码（支持多选笛卡尔积）
    const dataCodes = Array.isArray(conditions.dataCode) && conditions.dataCode.length > 0
      ? conditions.dataCode
      : [conditions.dataCode || '000'];

    const allResults: Array<{ code: string; name: string; generateTime: string }> = [];

    for (const dc of dataCodes) {
      const payload = { ...baseConditions, dataCode: dc };
      const parsed = generateCodeRequestSchema.parse(payload);
      const result = await codeService.generateCode(parsed as any);

      if (Array.isArray(result)) {
        allResults.push(...result);
      } else if (result && typeof result === 'object') {
        allResults.push(result);
      }
    }

    generatedCodes.value = allResults;
    previewPageNum.value = 1;

    // 显示生成数量提示
    if (allResults.length > 1) {
      ElMessage.success(`成功生成 ${allResults.length} 个编码`);
    }

    activeTab.value = 'preview';
  } catch (err: any) {
    ElMessage.error(err.message || '生成编码失败');
  }
}

function handleClear() {
  // 清空所有条件（多选字段置为空数组），跳过锁定的字段
  conditionFields.forEach((field) => {
    if (lockedFields[field.key]) return;
    conditions[field.key] = field.multiple ? [] : '';
  });
  // 清空可能残留的扩展字段，跳过锁定字段相关
  Object.keys(conditions).forEach((k) => {
    if (!conditionFields.find(f => f.key === k)) {
      conditions[k] = '';
    }
  });

  // 重置前缀号为默认值（内部数据）（跳过锁定字段）
  if (!lockedFields.prefixNo) {
    const internalDataPrefix = dictOptions['prefixNo']?.find(p => p.name === '内部数据');
    if (internalDataPrefix) {
      conditions.prefixNo = internalDataPrefix.code;
    }
  }

  // 重置一级类码为默认值（生产运行）（跳过锁定字段）
  if (!lockedFields.firstClassCode) {
    const productionOperation = dictOptions['firstClassCode']?.find(f => f.name === '生产运行');
    if (productionOperation) {
      conditions.firstClassCode = productionOperation.code;
    }
  }

  // 重置扩展码默认值
  conditions.secondExtCodeStart = '1';
  conditions.secondExtCodeCount = '1';
  conditions.thirdExtCodeStart = '0';
  conditions.thirdExtCodeCount = '1';

  generatedCodes.value = [];
}

/** 编码预览：一键复制全部（编码 + 名称） */
function copyAllPreview() {
  const text = generatedCodes.value.map(c => `${c.code} ${c.name}`).join('\n');
  navigator.clipboard.writeText(text).then(
    () => ElMessage.success('已复制全部编码'),
    () => ElMessage.warning('复制失败，请手动选择复制'),
  );
}

/** 查找字典项名称 */
function findDictName(key: string, code: string): string | undefined {
  return dictOptions[key]?.find(item => item.code === code)?.name;
}

/** 格式化上下文值：编码 + 名称（如 "F1 风电"） */
function formatContextValue(key: string, code: string): string {
  const name = findDictName(key, code);
  return name ? `${code} ${name}` : code;
}

/** 保存当前生成的编码到数据库 */
async function handleSaveCodes() {
  if (generatedCodes.value.length === 0) {
    ElMessage.warning('请先生成编码');
    return;
  }
  savedSaving.value = true;
  try {
    const context = {
      typeCode: conditions.typeCode ? formatContextValue('typeCode', conditions.typeCode) : undefined,
      secondClassCode: conditions.secondClassCode ? formatContextValue('secondClassCode', conditions.secondClassCode) : undefined,
      dataTypeCode: conditions.dataTypeCode ? formatContextValue('dataTypeCode', conditions.dataTypeCode) : undefined,
      stationCode: conditions.stationCode ? formatContextValue('stationCode', conditions.stationCode) : undefined,
      thirdClassCode: conditions.thirdClassCode ? formatContextValue('thirdClassCode', conditions.thirdClassCode) : undefined,
    };
    const result = await codeService.saveCodeRecords(generatedCodes.value, context);
    ElMessage.success(`已保存 ${result.savedCount} 条`);
    listPageNum.value = 1;
    loadCodeList();
    loadCodeTotalCount();
    activeTab.value = 'saved';
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败');
  } finally {
    savedSaving.value = false;
  }
}

/** 加载编码总数（仅获取 total 计数，不加载列表） */
async function loadCodeTotalCount() {
  try {
    const result = await codeService.getCodeHistory(1, 1);
    savedTotal.value = result.total || 0;
  } catch {
    savedTotal.value = 0;
  }
}

/** 加载已保存编码列表 */
async function loadSavedCodes() {
  savedLoading.value = true;
  try {
    const startTime = savedDateRange.value?.[0] || undefined;
    const endTime = savedDateRange.value?.[1] || undefined;
    const result = await codeService.getCodeHistory(1, 99999, startTime, endTime);
    savedCodes.value = result.list || [];
    savedTotal.value = result.total || 0;
  } catch {
    savedCodes.value = [];
    savedTotal.value = 0;
  } finally {
    savedLoading.value = false;
  }
}

function onSavedTimeFilter() {
  savedPageNum.value = 1;
  loadSavedCodes();
}

function onSavedTimeReset() {
  savedDateRange.value = null;
  savedPageNum.value = 1;
  loadSavedCodes();
}

/** 切换标签页时保持滚动位置，并在切换到已保存标签页时加载数据 */
function onTabClick(tab: any) {
  const scrollY = window.scrollY;
  if (tab.props?.name === 'saved' && codeList.value.length === 0) {
    loadCodeList();
  }
  // 等 DOM 更新 + 浏览器绘制完成后恢复滚动位置，避免标签切换导致页面跳动
  nextTick(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  });
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code).then(
    () => ElMessage.success('已复制'),
    () => ElMessage.warning('复制失败，请手动选择复制'),
  );
}

/** 开始编辑编码名称 */
function startEditName(row: any) {
  const idx = generatedCodes.value.findIndex(r => r.code === row.code && r.generateTime === row.generateTime);
  if (idx < 0) return;
  editingIndex.value = idx;
  editingName.value = generatedCodes.value[idx].name;
  nextTick(() => {
    const input = document.querySelector('.name-editor-input') as HTMLInputElement;
    input?.focus();
    input?.select();
  });
}

/** 确认编辑编码名称 */
function confirmEditName() {
  if (editingIndex.value !== null) {
    generatedCodes.value[editingIndex.value].name = editingName.value;
    editingIndex.value = null;
    editingName.value = '';
  }
}

/** 取消编辑编码名称 */
function cancelEditName() {
  editingIndex.value = null;
  editingName.value = '';
}

/** 复制选中编码 */

</script>

<style scoped>
.code-generate {
  max-width: 1400px;
  margin: 0 auto;
  overflow-anchor: none;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ==================== 科技风英雄卡片 ==================== */
.tech-hero {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #1d4ed8 100%);
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
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
.tech-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
}
.tech-glow-1 { top: -100px; right: -50px; background: #7dd3fc; }
.tech-glow-2 { bottom: -120px; left: -80px; background: #1e40af; }
.tech-hero-content {
  position: relative;
  padding: 14px 28px;
  z-index: 1;
}
.tech-hero-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  letter-spacing: 1px;
}
.tech-hero-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 0;
  line-height: 1.6;
}
.hero-title-icon {
  font-size: 28px;
  margin-right: 4px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* ==================== 工具栏卡片 ==================== */
.toolbar-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 20px;
  margin-bottom: 0;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 10px 10px 0 0;
  border: 1px solid #e4e9f2;
  border-bottom: 1px solid #eef2f8;
  position: relative;
}
.toolbar-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
  border-radius: 10px 10px 0 0;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
  border: 1px solid #e4e9f2;
  border-top: none;
}

.card-title {
  font-weight: 700;
  font-size: 15px;
  padding-left: 12px;
  line-height: 1.4;
  color: #1a2a4a;
  position: relative;
}
.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1px;
  bottom: 1px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #22d3ee);
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.25s ease;
}
.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6 inset;
}

.quick-search-filter-bar .el-select :deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* ==================== 内容区块卡片 ==================== */
.section-card {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
  border: 1px solid #e4e9f2;
  margin-bottom: 16px;
  overflow: hidden;
  position: relative;
  transition: box-shadow 0.3s ease;
}
.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}

.section-card:hover {
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #eef2f8;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
}

.section-body {
  padding: 20px 20px 16px;
}

.section-body .el-form {
  margin: -4px;
}

.section-body .el-row {
  margin: 0 !important;
}

.section-body .el-row .el-col {
  padding: 4px !important;
}

.section-card + .section-card {
  margin-top: 0;
}

/* ==================== 快速检索 ==================== */
.quick-search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-search-row .el-input {
  width: 300px;
  flex-shrink: 0;
}

.recent-search-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.recent-tags-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.recent-tag {
  cursor: pointer;
  font-size: 13px;
}

.recent-tag:hover {
  opacity: 0.8;
}

.search-prefix {
  color: #909399;
  font-size: 13px;
}

.quick-search-results {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-search-count {
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.quick-search-pagination {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
}

.quick-search-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.quick-search-filter-label {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
  white-space: nowrap;
}

/* 快速检索筛选栏固定 */
.quick-filter-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%) !important;
}

/* ===== 科技风类型切换 ===== */
:deep(.type-radio-group) {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(30, 58, 95, 0.06), rgba(59, 130, 246, 0.08));
  border: 1px solid rgba(59, 130, 246, 0.12);
  border-radius: 8px;
  height: 34px;
  padding: 2px;
  position: relative;
  box-shadow: 0 1px 4px rgba(59, 130, 246, 0.06), inset 0 1px 1px rgba(255,255,255,0.6);
}
:deep(.type-radio-group::before) {
  content: '';
  position: absolute;
  top: -1px;
  left: 12px;
  right: 12px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
  pointer-events: none;
}
:deep(.type-radio-group .el-radio-button) {
  padding: 0 !important;
}
:deep(.type-radio-group .el-radio-button__inner) {
  background: transparent !important;
  border: none !important;
  border-radius: 6px !important;
  color: rgba(30, 58, 95, 0.5) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  padding: 0 14px !important;
  height: 28px !important;
  line-height: 28px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: none !important;
  letter-spacing: 0.5px !important;
  margin: 1px;
  position: relative;
  cursor: pointer;
}
:deep(.type-radio-group .el-radio-button__inner:hover) {
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.06) !important;
}
:deep(.type-radio-group .el-radio-button.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: #fff !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
  letter-spacing: 0.8px !important;
}
/* 为每个类型按钮赋予不同的高亮色 */
:deep(.type-radio-group .el-radio-button:first-child.is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
}
:deep(.type-radio-group .el-radio-button:nth-child(2).is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
}
:deep(.type-radio-group .el-radio-button:nth-child(3).is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #f59e0b, #d97706) !important;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3) !important;
}
:deep(.type-radio-group .el-radio-button:nth-child(4).is-active .el-radio-button__inner) {
  background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3) !important;
}
/* 禁用状态 */
:deep(.type-radio-group.is-disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
:deep(.type-radio-group.is-disabled .el-radio-button__inner) {
  cursor: not-allowed !important;
}

/* ===== 科技风锁定按钮 ===== */
.quick-search-lock-btn {
  flex-shrink: 0;
  min-width: 64px;
  height: 30px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 7px;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  background: linear-gradient(135deg, #f0f5ff, #e8f0fe);
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.quick-search-lock-btn:hover {
  background: linear-gradient(135deg, #e8f0fe, #dce8fa);
  border-color: rgba(59, 130, 246, 0.35);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
}
.quick-search-lock-btn:active {
  transform: translateY(0);
}
/* 锁定状态 */
.quick-search-lock-btn.is-locked {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-color: rgba(245, 158, 11, 0.35);
  color: #b45309;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
}
.quick-search-lock-btn.is-locked:hover {
  background: linear-gradient(135deg, #fde68a, #fcd34d);
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 3px 12px rgba(245, 158, 11, 0.2);
  transform: translateY(-1px);
}
/* 锁图标 */
.quick-search-lock-btn .lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: transform 0.3s ease;
}
.quick-search-lock-btn.is-locked .lock-icon {
  transform: scale(1.1);
}
/* 统一与下拉框同高度 */
:deep(.tech-select) {
  height: 50px;
  vertical-align: middle;
}
:deep(.tech-select .el-input__wrapper) {
  background: rgba(20, 28, 52, 0.08) !important;
  border: none !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  transition: all 0.25s ease !important;
  padding: 0 10px !important;
  height: 50px !important;
}
:deep(.tech-select .el-input__wrapper:hover) {
  background: rgba(64, 158, 255, 0.1) !important;
}
:deep(.tech-select .el-input__wrapper.is-focus) {
  background: rgba(64, 158, 255, 0.12) !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.12) !important;
}
:deep(.tech-select .el-input__inner) {
  color: #1a3a6a !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  height: 48px !important;
}
:deep(.tech-select .el-input__inner::placeholder) {
  color: rgba(100, 120, 180, 0.6) !important;
}
:deep(.tech-select .el-input__suffix) {
  color: #7c9cf5 !important;
  height: 48px !important;
  transition: color 0.25s ease !important;
}
:deep(.tech-select:hover .el-input__suffix) {
  color: #409eff !important;
}


.quick-search-filter-count {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.code-highlight {
  font-weight: 600;
  color: #409eff;
}

.name-muted {
  color: #606266;
}

.condition-actions {
  margin-top: 20px;
  padding: 16px 0 4px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #f0f2f5;
  position: relative;
}
.condition-actions::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #79bbff);
  border-radius: 0 2px 2px 0;
}
.condition-actions .el-button--primary {
  padding: 10px 28px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
  transition: all 0.25s ease;
}

.condition-actions .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
  transform: translateY(-1px);
}

.condition-actions .el-button--primary:active {
  transform: translateY(0);
}


.saved-filter-bar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.saved-selection-bar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.range-separator {
  color: #909399;
  font-size: 14px;
}

.input-with-quick-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.select-with-lock {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.select-with-lock .el-select {
  flex: 1;
}

.select-with-lock .el-select :deep(.el-input__wrapper) {
  border-radius: 6px;
  transition: all 0.25s ease;
}

.select-with-lock .el-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #79bbff inset;
}

.select-with-lock .el-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #409eff inset;
}

.section-body :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  padding-bottom: 4px;
}

.section-body :deep(.el-form-item__label::before) {
  color: #e74c3c;
  margin-right: 4px;
}

.section-body :deep(.el-form-item) {
  margin-bottom: 18px;
}

.el-row .filter-item .input-with-quick-options {
  gap: 4px;
}

.el-row .filter-item .quick-options {
  margin-top: 4px;
  gap: 3px;
}

.el-row .filter-item .quick-option-tag {
  font-size: 11px;
  height: 20px;
  line-height: 18px;
  padding: 0 6px;
}

.section-body :deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* ==================== 筛选条件卡片单元 ==================== */
.filter-item {
  transition: all 0.25s ease;
}

.filter-item > :deep(.el-form-item) {
  background: #f8fafc;
  border: 1px solid #eef1f4;
  border-radius: 10px;
  padding: 14px 14px 8px;
  margin-bottom: 0;
  transition: all 0.25s ease;
  display: block;
}

.filter-item > :deep(.el-form-item:hover) {
  border-color: #d0d9e8;
  background: #fafcff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-item > :deep(.el-form-item.is-error) {
  border-color: #f56c6c;
  background: #fef0f0;
}

.filter-item > :deep(.el-form-item__label) {
  padding: 0 0 6px;
  line-height: 1.4;
  font-size: 12px;
  color: #606266;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.filter-item > :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.filter-item > :deep(.el-form-item__error) {
  position: static;
  padding-top: 2px;
}

/* 场站字段占两列 */
.filter-item.station-field > :deep(.el-form-item) {
  background: linear-gradient(135deg, #f0f7ff 0%, #f8faff 100%);
  border-color: #dce8f5;
}

/* 有锁定的字段视觉提示 */
.filter-item > :deep(.el-form-item) .select-with-lock.is-locked + .quick-options .quick-option-tag {
  opacity: 0.4;
}

.lock-btn {
  flex-shrink: 0;
  min-width: 62px;
  font-size: 12px;
  padding: 7px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.lock-btn.el-button--warning {
  background: #fef3e8;
  border-color: #f9d9b3;
  color: #d8822a;
}

.lock-btn.el-button--warning:hover {
  background: #fde8d0;
  border-color: #f5c58c;
}

.select-with-lock.is-locked .el-select :deep(.el-input__wrapper) {
  background: #fef9f0;
  border-color: #f9d9b3;
}

.quick-option-tag.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.quick-option-tag {
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  padding: 0 8px;
  height: 24px;
  line-height: 22px;
  border: 1px solid #e4e7ed;
  background: #fafafa;
  color: #606266;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.quick-option-tag:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
  color: #409eff;
}

.extend-number-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.extend-number-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.extend-number-row .el-input {
  flex: 1;
}

.extend-number-row .el-input :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.el-row .filter-item .extend-number-row {
  gap: 4px;
}

.el-row .filter-item .extend-number-row .el-input :deep(.el-input__inner) {
  font-size: 12px;
}

.el-row .filter-item .extend-prefix {
  font-size: 11px;
}

.extend-prefix {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.expected-count {
  margin-left: 12px;
  font-size: 13px;
  color: #67c23a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0f9eb;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
}

.expected-count::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #67c23a;
  border-radius: 50%;
  margin-right: 2px;
}

.name-display {
  cursor: text;
  display: block;
  min-height: 22px;
  padding: 0 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.name-display:hover {
  background-color: #f5f7fa;
}

.name-editor {
  width: 100%;
}

/* ==================== 表格通用样式 ==================== */
:deep(.el-table) {
  border: none !important;
}
:deep(.el-table__inner-wrapper) {
  border: none !important;
}
:deep(.el-table__body tr) {
  transition: background 0.2s ease;
}
:deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}
:deep(.el-table th.el-table__cell) {
  background: #f0f5ff !important;
  color: #1d40af !important;
  font-weight: 600 !important;
}
:deep(.el-table th.el-table__cell .cell) {
  color: #1d40af;
  font-weight: 600;
  font-size: 13px;
}
:deep(.el-table__body tr.el-table__row--striped) {
  background: #fafbfc;
}
:deep(.el-table__body tr.el-table__row--striped:hover) {
  background: #f0f7ff !important;
}

/* ==================== 分页容器 ==================== */
.pagination-wrapper {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
  margin-top: 16px;
}

/* ==================== 对话框美化 ==================== */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}
:deep(.el-dialog__header) {
  padding: 20px 24px 0;
  font-weight: 700;
  font-size: 17px;
}
:deep(.el-dialog__body) {
  padding: 20px 24px;
}
:deep(.el-dialog__footer) {
  padding: 0 24px 20px;
  border: none;
}

/* ===== 编码列表（与编码看板同步） ===== */
.card-default {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e4e9f2;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(59,130,246,0.04);
  position: relative;
  transition: box-shadow 0.3s ease;
}
.card-default::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}
.card-default:hover {
  box-shadow: 0 4px 20px rgba(59,130,246,0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f8;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
}
.card-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a2a4a;
  position: relative;
  padding-left: 12px;
}
.card-header-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #3b82f6, #22d3ee);
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-divider {
  display: inline-block;
  width: 1px;
  height: 20px;
  background: #dcdfe6;
  margin: 0 4px;
}
.list-pagination {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}
.cell-name {
  color: #303133;
  font-size: 14px;
  margin-left: 6px;
}

/* 快速检索结果表格字体加大 */
.quick-search-table :deep(.el-table__cell) {
  padding: 8px 6px !important;
}
.quick-search-table :deep(.el-table__cell .cell) {
  font-size: 14px;
  color: #303133;
}
.quick-search-table :deep(.el-tag) {
  font-size: 13px !important;
  height: 26px !important;
  line-height: 24px !important;
  padding: 0 8px !important;
}
.code-count-tag {
  margin-right: 6px;
}
.expand-loading {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 13px;
}
:deep(.el-table__expand-column) { display: none; }
:deep(.row-expanded-active) { background-color: #f0f9ff !important; }
:deep(.row-expanded-active > td.el-table__cell) { border-bottom-color: #d0e3ff !important; }
:deep(.el-table__expanded-cell) { padding: 8px 16px 8px 50px !important; background: #f8faff !important; }
.detail-wrapper {
  width: 90%;
  margin: 0 auto;
}
.detail-wrapper :deep(.el-table) {
  width: 100%;
}
:deep(.detail-table .el-table__inner-wrapper::before) { display: none; }
:deep(.detail-table th) { background: #eef3ff !important; color: #303133; font-weight: 600; padding: 6px 0 !important; }
:deep(.detail-table td) { background: #f8faff !important; padding: 6px 0 !important; }

/* ==================== 表格行动画 ==================== */
:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}

</style>

<style>
/* ==================== 表头筛选：科技风格（全局样式穿透弹窗） ==================== */
.styled-table .el-table__column-filter-trigger {
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  transition: all 0.3s ease;
  background: rgba(64, 158, 255, 0.06);
  border: 1px solid rgba(64, 158, 255, 0.15);
  position: relative;
  top: -1px;
}
.styled-table .el-table__column-filter-trigger:hover {
  background: rgba(64, 158, 255, 0.12);
  border-color: rgba(64, 158, 255, 0.3);
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.15);
}
.styled-table .el-table__column-filter-trigger .el-icon {
  font-size: 14px;
  color: #7c9cf5;
  transition: all 0.3s ease;
  line-height: 1;
}
.styled-table .el-table__column-filter-trigger:hover .el-icon {
  color: #409eff;
  transform: scale(1.15);
  filter: drop-shadow(0 0 4px rgba(64, 158, 255, 0.5));
}
.styled-table .el-table__column-filter-trigger.is-active {
  background: rgba(64, 158, 255, 0.25);
  border-color: #409eff;
  box-shadow: 0 0 12px rgba(64, 158, 255, 0.35);
}
.styled-table .el-table__column-filter-trigger.is-active .el-icon {
  color: #409eff;
  filter: drop-shadow(0 0 6px rgba(64, 158, 255, 0.7));
}
.styled-table th.is-filter-active,
.styled-table .el-table__cell.is-filter-active {
  background: #d6e8ff !important;
  box-shadow: inset 0 -2px 0 0 #409eff;
}
.styled-table th.is-filter-active .cell {
  color: #1a5ec7 !important;
}
.styled-table .el-table__header-wrapper .cell {
  display: inline-flex;
  align-items: center;
}
.el-table-filter {
  background: rgba(20, 28, 52, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  border-radius: 12px !important;
  box-shadow:
    0 0 20px rgba(64, 158, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(64, 158, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  padding: 8px !important;
  overflow: hidden;
}
.el-table-filter__list {
  padding: 4px !important;
}
.el-table-filter__list-item {
  padding: 0 !important;
  margin: 2px 0 !important;
}
.el-table-filter__list-item .el-checkbox {
  display: flex !important;
  align-items: center;
  padding: 8px 14px !important;
  border-radius: 8px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__list-item .el-checkbox:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.12), rgba(64, 158, 255, 0.05)) !important;
}
.el-table-filter__list-item.is-checked .el-checkbox {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.08)) !important;
}
.el-table-filter__list-item .el-checkbox__label {
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
}
.el-table-filter__list-item.is-checked .el-checkbox__label {
  color: #66b1ff !important;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}
.el-table-filter__list-item .el-checkbox__inner {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(64, 158, 255, 0.4) !important;
  border-radius: 4px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__list-item .el-checkbox__inner::after {
  border-color: #409eff !important;
}
.el-table-filter__list-item .el-checkbox.is-checked .el-checkbox__inner {
  background: rgba(64, 158, 255, 0.3) !important;
  border-color: #409eff !important;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.4) !important;
}
.el-table-filter__bottom {
  border-top: 1px solid rgba(64, 158, 255, 0.15) !important;
  padding: 8px 14px !important;
  margin-top: 4px !important;
}
.el-table-filter__bottom button {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 12px !important;
  transition: all 0.25s ease !important;
}
.el-table-filter__bottom button:hover {
  color: #66b1ff !important;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
}

/* 科技感下拉框弹出面板 */
.tech-select-popper {
  background: rgba(20, 28, 52, 0.95) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  border-radius: 10px !important;
  box-shadow:
    0 0 20px rgba(64, 158, 255, 0.15),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(64, 158, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  padding: 4px !important;
}
.tech-select-popper .el-select-dropdown__item {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  border-radius: 6px !important;
  padding: 6px 12px !important;
  margin: 2px 0 !important;
  transition: all 0.2s ease !important;
}
.tech-select-popper .el-select-dropdown__item:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05)) !important;
  color: #fff !important;
}
.tech-select-popper .el-select-dropdown__item.selected {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.25), rgba(64, 158, 255, 0.1)) !important;
  color: #66b1ff !important;
  box-shadow: inset 0 0 0 1px rgba(64, 158, 255, 0.3);
}
.tech-select-popper .el-popper__arrow::before {
  background: rgba(20, 28, 52, 0.95) !important;
  border-color: rgba(64, 158, 255, 0.3) !important;
}
</style>
