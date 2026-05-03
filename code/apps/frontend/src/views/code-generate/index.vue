<template>
  <div class="code-generate">
    <!-- 快捷筛选面板 -->
    <el-card class="quick-filter-card">
      <template #header>
        <div class="quick-filter-header">
          <span>快捷搜索</span>
          <el-button size="small" type="primary" @click="showAddDialog = true">新增</el-button>
        </div>
      </template>
      <div class="quick-filter-body">
        <div class="quick-search-row">
          <el-input
            v-model="quickSearchText"
            placeholder="数据码模糊搜索 或 编码后5位"
            clearable
            @input="onQuickSearchInput"
            @clear="onQuickSearchClear"
          >
            <template #prefix>
              <span class="search-prefix">搜索</span>
            </template>
          </el-input>
          <div v-if="recentSearchTags.length > 0" class="recent-search-tags">
            <span class="recent-tags-label">最近搜索：</span>
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
        <div v-if="quickSearchLoading" class="quick-search-loading">
          <span>搜索中...</span>
        </div>
        <div v-if="quickSearchResults.length > 0" class="quick-search-results">
          <div class="quick-search-filter-bar">
            <span class="quick-search-filter-label">类型：</span>
            <el-select v-model="quickSearchTypeFilter" placeholder="全部" clearable size="small" style="width: 100px" @change="onQuickSearchFilterChange">
              <el-option v-for="item in quickSearchTypeOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <span class="quick-search-filter-label">二级类码：</span>
            <el-select v-model="quickSearchSecondClassFilter" placeholder="全部" clearable size="small" style="width: 200px" @change="onQuickSearchFilterChange">
              <el-option
                v-for="item in quickSearchFilteredSecondClassOptions"
                :key="item.code"
                :label="item.code + ' ' + item.name"
                :value="item.code"
              />
            </el-select>
          </div>
          <el-table
            :data="quickSearchResults"
            border
            stripe
            style="width: 100%"
            max-height="360"
            size="small"
          >
            <el-table-column label="类型域" min-width="70">
              <template #default="{ row }">
                <span class="code-highlight">{{ row.typeCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="二级类码" min-width="160">
              <template #default="{ row }">
                <span class="code-highlight">{{ row.secondClassCode }}</span>
                <span class="name-muted">&nbsp;{{ row.secondClassName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据类码" min-width="140">
              <template #default="{ row }">
                <span class="code-highlight">{{ row.dataCategoryCode }}</span>
                <span class="name-muted">&nbsp;{{ row.dataCategoryName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数据码" min-width="180">
              <template #default="{ row }">
                <span class="code-highlight">{{ row.dataCode }}</span>
                <span class="name-muted">&nbsp;{{ row.dataName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="140">
              <template #default="{ row }">
                <el-tag v-if="row.isManual === '1'" size="small" type="warning">手动添加</el-tag>
                <el-tag v-else size="small" type="info">集团统一</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="onQuickSearchRowClick(row)">筛选</el-button>
              </template>
            </el-table-column>
          </el-table>
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
        </div>
        <el-empty
          v-if="quickSearchSearched && quickSearchResults.length === 0 && !quickSearchLoading && quickSearchText.trim()"
          description="未找到匹配的数据码"
        />
      </div>
    </el-card>

    <!-- 手动新增编码字典对话框（批量） -->
    <el-dialog v-model="showAddDialog" title="新增编码字典" width="820px" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="120px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型" required>
              <el-select v-model="addForm.typeCode" placeholder="请选择类型" filterable clearable style="width: 100%" @change="onAddTypeChange">
                <el-option label="F 风力发电" value="F" />
                <el-option label="G 光伏发电" value="G" />
                <el-option label="S 水力发电" value="S" />
                <el-option label="Y 通用" value="Y" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="二级类码" required>
              <el-select v-model="addForm.secondClassCode" placeholder="请选择二级类码" filterable clearable style="width: 100%" :disabled="!addForm.typeCode" @change="onAddSecondClassChange">
                <el-option
                  v-for="item in addSecondClassOptions"
                  :key="item.code"
                  :label="item.code + ' ' + item.name"
                  :value="item.code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="添加方式">
          <el-radio-group v-model="addMode">
            <el-radio value="existing">选择已有数据类码</el-radio>
            <el-radio value="new">新增数据类码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="addMode === 'existing'" label="数据类码" required>
          <el-select v-model="addForm.dataCategoryCode" placeholder="请选择已有数据类码" filterable clearable style="width: 100%" @change="onAddDataCategorySelect">
            <el-option v-for="item in addDataTypeOptions" :key="item.code" :label="item.code + ' ' + item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="addMode === 'new'" label="数据类码" required>
          <div class="code-name-pair">
            <el-input v-model="addForm.dataCategoryCode" placeholder="2位数字" clearable maxlength="2" style="width: 120px" @input="onDataCategoryCodeInput" />
            <el-input v-model="addForm.dataCategoryName" placeholder="名称（必填）" clearable maxlength="100" />
          </div>
        </el-form-item>
        <el-form-item label="数据码列表">
          <div class="batch-entry-table">
            <div class="batch-entry-header">
              <span class="batch-entry-col batch-entry-col-code">数据码</span>
              <span class="batch-entry-col batch-entry-col-name">数据码名称</span>
              <span class="batch-entry-col batch-entry-col-action">操作</span>
            </div>
            <div v-for="(entry, index) in addEntries" :key="index" class="batch-entry-row">
              <el-input v-model="entry.dataCode" placeholder="3位数字" clearable maxlength="3" class="batch-entry-col batch-entry-col-code" size="small" @input="onDataCodeInput(entry)" />
              <el-input v-model="entry.dataName" placeholder="名称（必填）" clearable maxlength="100" class="batch-entry-col batch-entry-col-name" size="small" />
              <el-button type="danger" link size="small" @click="removeEntryRow(index)">删除</el-button>
            </div>
            <el-button class="batch-entry-add-btn" size="small" @click="addEntryRow">+ 添加一行</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="batch-entry-count">已添加 {{ addEntries.length }} 条记录</span>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" :disabled="!addFormValid" @click="handleAddSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 顶部筛选条件面板 -->
    <el-card class="condition-card">
      <template #header>
        <div class="condition-header">
          <span>筛选条件</span>
          <el-popover
            ref="recentPopoverRef"
            trigger="hover"
            placement="bottom-end"
            width="480"
            popper-class="recent-condition-popover"
          >
            <template #reference>
              <el-button size="small">
                最近记录
              </el-button>
            </template>
            <div class="recent-conditions-list">
              <div
                v-for="(item, index) in recentConditions"
                :key="item.id"
                class="recent-condition-item"
                :class="{ 'is-first': index === 0 }"
                @click="applyRecentCondition(item)"
              >
                <div class="recent-condition-fields">
                  <div class="recent-field" v-if="item.conditionData.stationCode">
                    <span class="recent-field-label">场站：</span>
                    <span class="recent-field-value">{{ item.conditionData.stationCode }}{{ formatName('stationCode', item.conditionData.stationCode) }}</span>
                  </div>
                  <div class="recent-field" v-if="item.conditionData.typeCode">
                    <span class="recent-field-label">发电类型：</span>
                    <span class="recent-field-value">{{ item.conditionData.typeCode }}{{ formatName('typeCode', item.conditionData.typeCode) }}</span>
                  </div>
                  <div class="recent-field" v-if="item.conditionData.secondClassCode">
                    <span class="recent-field-label">二级类码：</span>
                    <span class="recent-field-value">{{ item.conditionData.secondClassCode }}{{ formatName('secondClassCode', item.conditionData.secondClassCode) }}</span>
                  </div>
                  <div class="recent-field" v-if="item.conditionData.thirdClassCode">
                    <span class="recent-field-label">三级类码：</span>
                    <span class="recent-field-value">{{ item.conditionData.thirdClassCode }}{{ formatName('thirdClassCode', item.conditionData.thirdClassCode) }}</span>
                  </div>
                  <div class="recent-field" v-if="item.conditionData.dataTypeCode">
                    <span class="recent-field-label">数据类码：</span>
                    <span class="recent-field-value">{{ item.conditionData.dataTypeCode }}{{ formatName('dataTypeCode', item.conditionData.dataTypeCode) }}</span>
                  </div>
                  <div class="recent-field" v-if="item.conditionData.dataCode">
                    <span class="recent-field-label">数据码：</span>
                    <span class="recent-field-value">{{ formatDataCode(item.conditionData.dataCode) }}</span>
                  </div>
                </div>
                <div class="recent-condition-meta">
                  <span class="recent-condition-time">{{ item.generateTime }}</span>
                  <el-tag size="small" type="primary" effect="plain" class="apply-tag">点击应用</el-tag>
                </div>
              </div>
              <el-empty v-if="recentConditions.length === 0" description="暂无最近记录" />
            </div>
          </el-popover>
        </div>
      </template>
      <el-form :model="conditions" label-width="140px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="6" v-for="field in conditionFields" :key="field.key">
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
    </el-card>

    <!-- 编码结果展示区 -->
    <el-card class="result-card">
      <template #header>
        <div class="result-header">
          <span>编码结果</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-click="onTabClick">
        <!-- 编码预览标签页 -->
        <el-tab-pane label="编码预览" name="preview">
          <div v-if="generatedCodes.length > 0" class="preview-actions">
            <span class="preview-count">共 {{ generatedCodes.length }} 条</span>
            <el-button size="small" @click="copyAllPreview">一键复制全部</el-button>
            <el-button size="small" type="primary" :loading="savedSaving" @click="handleSaveCodes">保存</el-button>
          </div>
          <el-table :data="paginatedPreviewCodes" border stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="60" :index="previewPageIndex" />
            <el-table-column prop="code" label="编码" width="320" />
            <el-table-column label="编码名称" min-width="260">
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
            <el-table-column prop="generateTime" label="生成时间" width="180" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="copyCode(row.code)">复制</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="generatedCodes.length > 0" class="preview-pagination">
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
          <el-empty v-if="generatedCodes.length === 0" description="暂无生成记录" />
        </el-tab-pane>

        <!-- 已生成编码列表 -->
        <el-tab-pane label="编码列表" name="saved">
          <div class="list-section">
            <div class="list-filter-bar">
              <el-select v-model="listFilters.typeCode" placeholder="类型" clearable style="width:150px" @change="onTypeChange" :teleported="false">
                <el-option v-for="t in filterOptionMap.typeCodes" :key="t.code" :label="`${t.code} ${t.name}`" :value="t.code" />
              </el-select>
              <el-select v-model="listFilters.stationCode" placeholder="场站" clearable style="width:150px" @change="onListFilter" :teleported="false">
                <el-option v-for="s in filterOptionMap.stationCodes" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
              </el-select>
              <el-select v-model="listFilters.secondClassCode" placeholder="二级类码" clearable style="width:150px" @change="onSecondClassChange" :teleported="false">
                <el-option v-for="s in filterOptionMap.secondClassCodes" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
              </el-select>
              <el-select v-model="listFilters.dataTypeCode" placeholder="数据类码" clearable style="width:150px" @change="onListFilter" :teleported="false">
                <el-option v-for="d in filterOptionMap.dataTypeCodes" :key="d.code" :label="`${d.code} ${d.name}`" :value="d.code" />
              </el-select>
              <el-button type="primary" @click="onListFilter">查询</el-button>
              <el-button @click="onResetListFilter">重置</el-button>
              <el-button type="success" :disabled="selectedRows.length === 0" @click="handleExport">导出选中</el-button>
              <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleDeleteSelected">删除选中</el-button>
            </div>

            <el-table ref="mainTableRef" :data="codeList" row-key="rowKey" :expand-row-keys="expandedRowKeys" border stripe v-loading="listLoading" style="width:100%" max-height="520" @expand-change="onGroupExpand" :row-class-name="getExpandRowClass" @selection-change="onSelectionChange">
              <el-table-column type="selection" width="45" fixed />
              <el-table-column type="index" label="序号" width="60" fixed />
              <el-table-column label="类型" width="90" prop="type_code" />
              <el-table-column label="场站" min-width="150">
                <template #default="{ row }">{{ row.station_name ? `${row.station_code} ${row.station_name}` : row.station_code }}</template>
              </el-table-column>
              <el-table-column label="二级类码" min-width="150">
                <template #default="{ row }">{{ row.second_class_name ? `${row.second_class_code} ${row.second_class_name}` : row.second_class_code }}</template>
              </el-table-column>
              <el-table-column label="三级类码" min-width="150">
                <template #default="{ row }">{{ row.third_class_name ? `${row.third_class_code} ${row.third_class_name}` : row.third_class_code }}</template>
              </el-table-column>
              <el-table-column label="数据类码" min-width="90">
                <template #default="{ row }">{{ row.data_type_name ? `${row.data_type_code} ${row.data_type_name}` : row.data_type_code }}</template>
              </el-table-column>
              <el-table-column label="数据码" min-width="120">
                <template #default="{ row }">{{ row.data_name ? `${row.data_code} ${row.data_name}` : row.data_code }}</template>
              </el-table-column>
              <el-table-column label="操作" min-width="140">
                <template #default="{ row }">
                  <span class="code-count">{{ row.code_count }}</span>
                  <el-button size="small" @click="toggleRowExpand(row)">{{ isRowExpanded(row) ? '收起' : '明细' }}</el-button>
                </template>
              </el-table-column>
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div v-if="row._detailLoading" style="text-align:center;padding:12px">加载中...</div>
                  <el-table v-else :data="row._detailList" border stripe size="small" class="detail-table">
                    <el-table-column type="index" label="序号" width="60" />
                    <el-table-column label="测点编码" width="300" prop="code" />
                    <el-table-column label="测点名称" width="500" prop="name" />
                    <el-table-column label="生成时间" width="200" prop="create_date" />
                  </el-table>
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
                @current-change="loadCodeList"
                @size-change="loadCodeList"
              />
            </div>
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import * as dictService from '@/services/dict';
import * as codeService from '@/services/code-generation';
import * as statsService from '@/services/statistics';
import { generateCodeRequestSchema } from '@cec/contracts';

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

/** 锁定筛选条件（本地存储持久化） */
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
const recentConditions = ref<Array<{ id: number; conditionData: Record<string, any>; conditionSummary: string; generateTime: string }>>([]);
const recentPopoverRef = ref<any>(null);
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

const filterOptionMap = ref<{
  typeCodes: Array<{ code: string; name: string }>;
  stationCodes: Array<{ code: string; name: string }>;
  secondClassCodes: Array<{ code: string; name: string }>;
  dataTypeCodes: Array<{ code: string; name: string }>;
}>({ typeCodes: [], stationCodes: [], secondClassCodes: [], dataTypeCodes: [] });
const listFilters = reactive({
  typeCode: undefined as string | undefined,
  stationCode: undefined as string | undefined,
  secondClassCode: undefined as string | undefined,
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
  listFilters.dataTypeCode = undefined;
  listPageNum.value = 1;
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
const quickSearchPageNum = ref(1);
const quickSearchPageSize = ref(20);
const quickSearchTypeFilter = ref('');
const quickSearchSecondClassFilter = ref('');
const quickSearchTypeOptions = ref<string[]>([]);
let quickSearchTimer: ReturnType<typeof setTimeout> | null = null;

const quickSearchSecondClassOptions = ref<Array<{ code: string; name: string; typeCode: string }>>([]);

const quickSearchFilteredSecondClassOptions = computed(() => {
  if (!quickSearchTypeFilter.value) return quickSearchSecondClassOptions.value;
  return quickSearchSecondClassOptions.value.filter(s => s.typeCode === quickSearchTypeFilter.value);
});

function onQuickSearchFilterChange() {
  // 类型筛选变化时，若当前二级类码不属于该类型则清空
  if (quickSearchTypeFilter.value && quickSearchSecondClassFilter.value) {
    const match = quickSearchSecondClassOptions.value.find(
      s => s.code === quickSearchSecondClassFilter.value && s.typeCode === quickSearchTypeFilter.value
    );
    if (!match) {
      quickSearchSecondClassFilter.value = '';
    }
  }
  // 重新请求服务端带筛选条件的分页数据
  doQuickSearch();
}

/** 执行带当前筛选条件的服务端搜索 */
async function doQuickSearch(resetPage: boolean = true) {
  const text = quickSearchText.value.trim();
  if (!text) return;
  quickSearchLoading.value = true;
  if (resetPage) quickSearchPageNum.value = 1;
  try {
    const typeFilter = quickSearchTypeFilter.value || undefined;
    const secondClassFilter = quickSearchSecondClassFilter.value || undefined;
    const result = await dictService.quickSearchDict(text, quickSearchPageNum.value, quickSearchPageSize.value, typeFilter, secondClassFilter);
    quickSearchResults.value = result.items;
    quickSearchTotal.value = result.total;
    quickSearchTypeOptions.value = result.typeOptions || [];
    const seen = new Set<string>();
    quickSearchSecondClassOptions.value = (result.secondClassOptions || []).filter(s => {
      const key = s.secondClassCode;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map(s => ({ code: s.secondClassCode, name: s.secondClassName, typeCode: s.typeCode }));
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
const addLoading = ref(false);
const addMode = ref<'existing' | 'new'>('existing');
const addForm = reactive({
  typeCode: '',
  secondClassCode: '',
  dataCategoryCode: '',
  dataCategoryName: '',
});
const addEntries = ref<Array<{
  dataCode: string;
  dataName: string;
}>>([{ dataCode: '', dataName: '' }]);
const addSecondClassOptions = ref<Array<{ code: string; name: string }>>([]);
const addDataTypeOptions = ref<Array<{ code: string; name: string }>>([]);

const addFormValid = computed(() => {
  if (!addForm.typeCode || !addForm.secondClassCode) return false;
  if (addMode.value === 'existing') {
    return !!addForm.dataCategoryCode
      && addEntries.value.length > 0
      && addEntries.value.every(e => /^\d{3}$/.test(e.dataCode) && e.dataName);
  }
  return /^\d{2}$/.test(addForm.dataCategoryCode) && addForm.dataCategoryName
    && addEntries.value.length > 0
    && addEntries.value.every(e => /^\d{3}$/.test(e.dataCode) && e.dataName);
});

/** 编码递增工具 */
function padStart3(num: number): string {
  return String(num).padStart(3, '0');
}
function getNextDataCode(prev: string): string {
  const n = parseInt(prev, 10);
  return padStart3(isNaN(n) ? 1 : n + 1);
}
function getNextCategoryCode(prev: string): string {
  const n = parseInt(prev, 10);
  return String(isNaN(n) ? 1 : n + 1).padStart(2, '0');
}

/** 用起始数据码填充编码列表（连续递增） */
function fillEntries(startCode: string) {
  const start = parseInt(startCode, 10);
  addEntries.value = [{ dataCode: padStart3(isNaN(start) ? 1 : start), dataName: '' }];
}

function addEntryRow() {
  const last = addEntries.value[addEntries.value.length - 1];
  addEntries.value.push({ dataCode: getNextDataCode(last.dataCode), dataName: '' });
}

function removeEntryRow(index: number) {
  if (addEntries.value.length <= 1) return;
  addEntries.value.splice(index, 1);
}

/** 数据类码输入：只允许数字，最多2位 */
function onDataCategoryCodeInput(value: string) {
  addForm.dataCategoryCode = value.replace(/\D/g, '').slice(0, 2);
}

/** 数据码输入：只允许数字，最多3位 */
function onDataCodeInput(entry: { dataCode: string }) {
  entry.dataCode = entry.dataCode.replace(/\D/g, '').slice(0, 3);
}

/** 切换添加方式时清空数据类码相关字段和数据码列表 */
watch(addMode, () => {
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addEntries.value = [{ dataCode: '', dataName: '' }];
  if (addForm.typeCode && addForm.secondClassCode) {
    if (addMode.value === 'existing') {
      loadAddDataTypeOptions();
    } else {
      fillNewCategoryCodeAndEntries();
    }
  }
});

/** 选择已有数据类码 → 自动填充名称 + 获取最大数据码并自动编号 */
async function onAddDataCategorySelect(code: string) {
  if (!code) { addForm.dataCategoryName = ''; return; }
  const selected = addDataTypeOptions.value.find(o => o.code === code);
  addForm.dataCategoryName = selected?.name || '';
  try {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode] || addForm.typeCode;
    const maxDataCode = await dictService.getMaxDataCode(addForm.secondClassCode, code, mappedType);
    fillEntries(maxDataCode ? getNextDataCode(maxDataCode) : '001');
  } catch {
    fillEntries('001');
  }
}

/** 二级类码变更 → 加载已有数据类码 或 自动填充新增数据类码 */
async function onAddSecondClassChange() {
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addDataTypeOptions.value = [];
  addEntries.value = [{ dataCode: '', dataName: '' }];
  if (!addForm.typeCode || !addForm.secondClassCode) return;

  if (addMode.value === 'existing') {
    await loadAddDataTypeOptions();
  } else {
    await fillNewCategoryCodeAndEntries();
  }
}

/** 新增数据类码模式：取最大数据类码+1 并初始化数据码从001开始 */
async function fillNewCategoryCodeAndEntries() {
  try {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode] || addForm.typeCode;
    const maxCategoryCode = await dictService.getMaxDataCategoryCode(addForm.secondClassCode, mappedType);
    const nextCode = maxCategoryCode ? getNextCategoryCode(maxCategoryCode) : '01';
    // 如果溢出（超过2位），则留空让用户手动输入
    addForm.dataCategoryCode = nextCode.length <= 2 ? nextCode : '';
    fillEntries('001');
  } catch {
    addForm.dataCategoryCode = '01';
    fillEntries('001');
  }
}

async function loadAddDataTypeOptions() {
  try {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode] || addForm.typeCode;
    addDataTypeOptions.value = await dictService.getDataTypeBySecondClass(mappedType, addForm.secondClassCode);
  } catch {
    addDataTypeOptions.value = [];
  }
}

// F/G/Y 映射到具体类型码，用于加载二级类码
const TYPE_CODE_MAP: Record<string, string> = {
  F: 'F1',
  S: 'S1',
  G: 'G1',
  Y: 'Y0',
};

async function onAddTypeChange() {
  addForm.secondClassCode = '';
  addForm.dataCategoryCode = '';
  addForm.dataCategoryName = '';
  addEntries.value = [{ dataCode: '', dataName: '' }];
  addSecondClassOptions.value = [];
  addDataTypeOptions.value = [];
  if (addForm.typeCode) {
    const mappedType = TYPE_CODE_MAP[addForm.typeCode];
    if (mappedType) {
      try {
        addSecondClassOptions.value = await dictService.getSecondClassByType(mappedType);
      } catch {
        addSecondClassOptions.value = [];
      }
    }
  }
}

async function handleAddSave() {
  if (!addFormValid.value) return;
  addLoading.value = true;
  try {
    const secondClass = addSecondClassOptions.value.find(item => item.code === addForm.secondClassCode);
    await dictService.batchCreateManualCode({
      mode: addMode.value,
      typeCode: addForm.typeCode,
      secondClassCode: addForm.secondClassCode,
      secondClassName: secondClass?.name || '',
      entries: addEntries.value.map(e => ({
        dataCategoryCode: addForm.dataCategoryCode,
        dataCategoryName: addForm.dataCategoryName,
        dataCode: e.dataCode,
        dataName: e.dataName,
      })),
    });
    ElMessage.success(`新增成功，共 ${addEntries.value.length} 条`);
    showAddDialog.value = false;
    // 重置表单
    addMode.value = 'existing';
    addForm.typeCode = '';
    addForm.secondClassCode = '';
    addForm.dataCategoryCode = '';
    addForm.dataCategoryName = '';
    addEntries.value = [{ dataCode: '', dataName: '' }];
    addSecondClassOptions.value = [];
    addDataTypeOptions.value = [];
    // 如果当前有搜索文本，刷新搜索结果
    if (quickSearchText.value.trim()) {
      onQuickSearchInput();
    }
  } catch (err: any) {
    ElMessage.error(err.message || '新增失败');
  } finally {
    addLoading.value = false;
  }
}

// 监听对话框打开
watch(showAddDialog, (val) => {
  if (!val) {
    addMode.value = 'existing';
    addForm.typeCode = '';
    addForm.secondClassCode = '';
    addForm.dataCategoryCode = '';
    addForm.dataCategoryName = '';
    addEntries.value = [{ dataCode: '', dataName: '' }];
    addSecondClassOptions.value = [];
    addDataTypeOptions.value = [];
  }
});

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
    quickSearchTypeFilter.value = '';
    quickSearchSecondClassFilter.value = '';
    quickSearchSecondClassOptions.value = [];
    quickSearchTypeOptions.value = [];
    return;
  }
  quickSearchTimer = setTimeout(async () => {
    quickSearchSearched.value = true;
    quickSearchTypeFilter.value = '';
    quickSearchSecondClassFilter.value = '';
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
  quickSearchTypeFilter.value = '';
  quickSearchSecondClassFilter.value = '';
  quickSearchSecondClassOptions.value = [];
  quickSearchTypeOptions.value = [];
}

/** 点击快捷搜索结果行，自动填入筛选条件 */
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
  // 如果类型已锁定，使用当前值；否则使用快捷搜索的映射值
  const resolvedTypeCode = lockedFields.typeCode
    ? conditions.typeCode
    : (typeCodeMap[row.typeCode] || row.typeCode);
  conditions.typeCode = resolvedTypeCode;
  // 2. 触发类型级联，加载二级类码列表
  await onConditionChange('typeCode');

  // 3. 设置二级类码（锁定字段使用原值）
  conditions.secondClassCode = lockedFields.secondClassCode ? conditions.secondClassCode : row.secondClassCode;
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
    // 加载锁定的筛选条件状态
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

    // 加载最近条件记录
    loadRecentConditions();

    // 加载编码生成列表
    loadCodeList();
  } catch (err: any) {
    ElMessage.error('筛选条件加载失败，请刷新重试');
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

  // 类型代码变更时，重新加载二级类码列表，并清空后续级联字段
  if (key === 'typeCode') {
    // 先清空二级类码及其后续的级联筛选字段
    conditions.secondClassCode = '';
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
    // 再加载新类型下的二级类码选项
    try {
      const secondClassItems = await dictService.getSecondClassByType(conditions[key]);
      dictOptions['secondClassCode'] = secondClassItems;
    } catch {}
    if (generatedCodes.value.length > 0) {
      generatedCodes.value = [];
    }
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
  // 扩展码不与其他筛选条件联动，只清空已生成的编码
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
      } else if (result && result.codes && Array.isArray(result.codes)) {
        allResults.push(...result.codes);
      }
    }

    generatedCodes.value = allResults;
    previewPageNum.value = 1;

    // 显示生成数量提示
    if (allResults.length > 1) {
      ElMessage.success(`成功生成 ${allResults.length} 个编码`);
    }

    // 生成成功后保存当前条件到最近记录
    saveCurrentConditions();

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
    activeTab.value = 'saved';
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败');
  } finally {
    savedSaving.value = false;
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
  nextTick(() => {
    window.scrollTo(0, scrollY);
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

/** 加载最近条件记录 */
async function loadRecentConditions() {
  try {
    const list = await codeService.getRecentConditions();
    recentConditions.value = (list || []).map((item: any) => ({
      id: item.id,
      conditionData: typeof item.condition_data === 'string' ? JSON.parse(item.condition_data) : (item.condition_data || {}),
      conditionSummary: item.condition_summary || '',
      generateTime: item.generate_time || '',
    }));

    // 预加载最近记录的字典名称（三级类码、数据类码、数据码）
    if (recentConditions.value.length > 0) {
      const data = recentConditions.value[0].conditionData;
      await preloadRecentDicts(data);
    }
  } catch {
    // 静默失败，不影响主功能
  }
}

/** 根据最近记录的编码预加载对应的字典列表，使名称能正常显示 */
async function preloadRecentDicts(data: Record<string, any>) {
  if (data.secondClassCode) {
    if (!dictOptions['thirdClassCode']?.length) {
      try {
        dictOptions['thirdClassCode'] = await dictService.getCascadedDictItems(data.secondClassCode, data.typeCode);
      } catch {}
    }
    if (!dictOptions['dataTypeCode']?.length) {
      try {
        dictOptions['dataTypeCode'] = await dictService.getDataTypeBySecondClass(data.typeCode, data.secondClassCode);
      } catch {}
    }
  }
  if (data.dataTypeCode && !dictOptions['dataCode']?.length) {
    try {
      dictOptions['dataCode'] = await dictService.getDataCodes(data.dataTypeCode, data.secondClassCode, data.typeCode);
    } catch {}
  }
}

/** 查找字典项名称 */
function findDictName(key: string, code: string): string | undefined {
  return dictOptions[key]?.find(item => item.code === code)?.name;
}

/** 显示字典名称（code 有对应 name 时返回 " name"，否则返回空串） */
function formatName(dictKey: string, code: string): string {
  const name = findDictName(dictKey, code);
  return name ? ` ${name}` : '';
}

/** 显示数据码（支持多选），格式："001 电压" 或 "001 电压、002 频率" */
function formatDataCode(dataCode: string | string[]): string {
  const codes = Array.isArray(dataCode) ? dataCode : [dataCode];
  return codes.map(c => {
    const name = findDictName('dataCode', c);
    return name ? `${c} ${name}` : c;
  }).join('、');
}

/** 保存当前条件到最近记录（只存筛选条件编码，不存名称） */
async function saveCurrentConditions() {
  const snapshot: Record<string, any> = {};
  conditionFields.forEach((field) => {
    const val = conditions[field.key];
    if (val !== undefined && val !== null && val !== '') {
      if (field.multiple && Array.isArray(val) && val.length === 0) return;
      snapshot[field.key] = val;
    }
  });
  // 保存扩展字段
  ['secondExtCodeStart', 'secondExtCodeCount', 'thirdExtCodeStart', 'thirdExtCodeCount'].forEach((k) => {
    if (conditions[k]) snapshot[k] = conditions[k];
  });

  try {
    await codeService.saveRecentCondition(snapshot);
    loadRecentConditions();
  } catch {
    // 静默失败
  }
}

/** 应用最近条件记录：一键切换所有筛选条件 */
async function applyRecentCondition(item: { conditionData: Record<string, any> }) {
  const saved = item.conditionData;
  if (!saved || Object.keys(saved).length === 0) return;

  // 保存锁定的字段值，清空后再恢复
  const lockedSnapshot: Record<string, any> = {};
  LOCKABLE_FIELDS.forEach(key => {
    if (lockedFields[key]) lockedSnapshot[key] = conditions[key];
  });

  // 1. 清空所有条件
  conditionFields.forEach((field) => {
    conditions[field.key] = field.multiple ? [] : '';
  });
  ['secondExtCodeStart', 'secondExtCodeCount', 'thirdExtCodeStart', 'thirdExtCodeCount'].forEach((k) => {
    conditions[k] = '';
  });

  // 2. 按依赖顺序设置条件并触发级联加载
  // 2a. 设置独立字段（锁定字段使用原值）
  conditions.stationCode = lockedFields.stationCode ? lockedSnapshot.stationCode : (saved.stationCode || '');
  conditions.typeCode = lockedFields.typeCode ? lockedSnapshot.typeCode : (saved.typeCode || '');
  conditions.projectLineCode = lockedFields.projectLineCode ? lockedSnapshot.projectLineCode : (saved.projectLineCode || '');
  conditions.prefixNo = lockedFields.prefixNo ? lockedSnapshot.prefixNo : (saved.prefixNo || '');
  conditions.firstClassCode = lockedFields.firstClassCode ? lockedSnapshot.firstClassCode : (saved.firstClassCode || '');

  // 2b. 触发类型级联（加载二级类码列表）
  await onConditionChange('typeCode');

  // 2c. 设置二级类码（锁定字段使用原值）
  conditions.secondClassCode = lockedFields.secondClassCode ? lockedSnapshot.secondClassCode : (saved.secondClassCode || '');

  // 2d. 触发二级类级联（加载三级类码和数据类码列表，会重置扩展码）
  await onConditionChange('secondClassCode');

  // 2e. 级联后再恢复二级类扩展码
  conditions.secondExtCodeStart = saved.secondExtCodeStart || '1';
  conditions.secondExtCodeCount = saved.secondExtCodeCount || '1';

  // 2f. 设置三级类、扩展和数据类字段
  conditions.thirdClassCode = saved.thirdClassCode || '';
  conditions.thirdExtCodeStart = saved.thirdExtCodeStart || '0';
  conditions.thirdExtCodeCount = saved.thirdExtCodeCount || '1';
  conditions.dataTypeCode = saved.dataTypeCode || '';

  // 2g. 触发数据类码级联（加载数据码列表）
  await onConditionChange('dataTypeCode');

  // 2h. 设置数据码
  if (saved.dataCode !== undefined && saved.dataCode !== null) {
    conditions.dataCode = saved.dataCode;
  }

  // 清空已生成的编码
  generatedCodes.value = [];

  // 关闭popover
  recentPopoverRef.value?.hide?.();

  ElMessage.success('已应用最近条件');
}
</script>

<style scoped>
.code-generate {
  max-width: 1400px;
  margin: 0 auto;
  overflow-anchor: none;
}

.quick-filter-card {
  margin-bottom: 16px;
}

.quick-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-filter-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-search-row {
  display: flex;
  align-items: flex-start;
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
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.recent-tag {
  cursor: pointer;
}

.recent-tag:hover {
  opacity: 0.8;
}

.search-prefix {
  color: #909399;
  font-size: 13px;
}

.quick-search-loading {
  font-size: 13px;
  color: #909399;
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
  color: #606266;
  white-space: nowrap;
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

.condition-card {
  margin-bottom: 16px;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-conditions-list {
  max-height: 420px;
  overflow-y: auto;
}

.recent-condition-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.recent-condition-item:last-child {
  border-bottom: none;
}

.recent-condition-item:hover {
  background-color: #f5f7fa;
}

.recent-condition-item.is-first {
  background-color: #f0f9eb;
}

.recent-condition-item.is-first:hover {
  background-color: #e1f3d8;
}

.recent-condition-fields {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recent-field {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 13px;
  line-height: 1.6;
}

.recent-field-label {
  color: #909399;
  flex-shrink: 0;
}

.recent-field-value {
  color: #303133;
}

.recent-condition-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.recent-condition-time {
  font-size: 12px;
  color: #909399;
}

.apply-tag {
  flex-shrink: 0;
}

.condition-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-card {
  overflow-anchor: none;
}

.preview-actions {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-count {
  font-size: 14px;
  color: #606266;
}

.preview-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
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

.lock-btn {
  flex-shrink: 0;
  min-width: 60px;
}

.quick-option-tag.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.quick-options {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.quick-option-tag {
  cursor: pointer;
  user-select: none;
}

.quick-option-tag:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
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

.extend-prefix {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.expected-count {
  margin-left: 12px;
  font-size: 14px;
  color: #67c23a;
  display: flex;
  align-items: center;
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

.code-name-pair {
  display: flex;
  gap: 8px;
  width: 100%;
}

/* 批量新增编码字典 - 表格列表 */
.batch-entry-table {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  width: 100%;
}

.batch-entry-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 8px;
}

.batch-entry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-entry-row:last-child {
  margin-bottom: 0;
}

.batch-entry-col-code {
  width: 110px;
  flex-shrink: 0;
}

.batch-entry-col-name {
  flex: 1;
  min-width: 0;
}

.batch-entry-col-action {
  width: 50px;
  flex-shrink: 0;
  text-align: center;
}

.batch-entry-add-btn {
  margin-top: 8px;
  width: 100%;
}

.batch-entry-count {
  font-size: 13px;
  color: #909399;
}

/* ===== 编码生成列表样式 ===== */
.list-section { padding-top: 0; }
.list-section-header { font-weight: 600; font-size: 16px; margin-bottom: 16px; }
.list-filter-bar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.list-pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
:deep(.el-table__expand-column) { display: none; }
.code-count { display: inline-block; min-width: 28px; font-weight: 700; color: #409EFF; margin-right: 4px; }
:deep(.row-expanded-active) { background-color: #f0f9ff; }
:deep(.row-expanded-active > td) { color: #409EFF; font-weight: 600; }
:deep(.detail-table th),
:deep(.detail-table td) { background-color: #f0f9ff !important; }

</style>
