<template>
  <div class="quick-search-panel">
    <!-- 搜索栏 -->
    <div class="tech-search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="输入数据码名称或编码，回车查询"
        clearable
        size="large"
        @keyup.enter="doSearch"
        class="search-input-tech"
      >
        <template #prefix>
          <span style="color:#667eea">🔎</span>
        </template>
        <template #append>
          <el-button @click="doSearch" :loading="searching" class="search-btn-tech">查询</el-button>
        </template>
      </el-input>
    </div>

    <!-- 筛选栏 -->
    <div v-if="searched" class="filter-bar">
      <div class="filter-row">
        <el-select
          v-model="typeFilter"
          placeholder="类型"
          clearable
          size="small"
          class="filter-select"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in typeOptions"
            :key="opt.value"
            :label="opt.text"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="secondClassFilter"
          placeholder="二级类码"
          clearable
          size="small"
          class="filter-select"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in secondClassOptions"
            :key="opt.value"
            :label="opt.text"
            :value="opt.value"
          />
        </el-select>
        <el-select
          v-model="dataCategoryFilter"
          placeholder="数据类码"
          clearable
          size="small"
          class="filter-select"
          @change="onFilterChange"
        >
          <el-option
            v-for="opt in dataCategoryOptions"
            :key="opt.value"
            :label="opt.text"
            :value="opt.value"
          />
        </el-select>
        <el-button
          v-if="hasActiveFilter"
          size="small"
          @click="clearFilters"
          class="clear-filter-btn"
        >
          清除筛选
        </el-button>
      </div>
      <!-- 激活的筛选标签 -->
      <div v-if="hasActiveFilter" class="filter-tags">
        <el-tag
          v-if="typeFilter"
          closable
          size="small"
          @close="typeFilter = ''; onFilterChange()"
        >
          类型: {{ typeLabel(typeFilter) }}
        </el-tag>
        <el-tag
          v-if="secondClassFilter"
          closable
          size="small"
          type="primary"
          @close="secondClassFilter = ''; onFilterChange()"
        >
          二级类码: {{ secondClassFilter }}
        </el-tag>
        <el-tag
          v-if="dataCategoryFilter"
          closable
          size="small"
          type="success"
          @close="dataCategoryFilter = ''; onFilterChange()"
        >
          数据类码: {{ dataCategoryFilter }}
        </el-tag>
      </div>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searched" class="search-meta">
      <span v-if="resultItems.length > 0">
        共检索到 <strong>{{ total }}</strong> 条匹配记录
      </span>
      <span v-else>未找到匹配的数据码</span>
    </div>

    <!-- 结果表格 -->
    <div v-if="resultItems.length > 0" class="search-table-wrap">
      <el-table :data="resultItems" stripe style="width:100%" size="small" class="tech-table">
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.typeCode)" size="small" effect="plain">{{ typeLabel(row.typeCode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二级类码" min-width="140">
          <template #default="{ row }">{{ row.secondClassCode }} {{ row.secondClassName }}</template>
        </el-table-column>
        <el-table-column label="数据类码" min-width="140">
          <template #default="{ row }">{{ row.dataCategoryCode }} {{ row.dataCategoryName }}</template>
        </el-table-column>
        <el-table-column label="数据码" min-width="150">
          <template #default="{ row }">
            <code class="tech-code-tag">{{ row.dataCode }}</code>
            <span style="margin-left:6px;">{{ row.dataName }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="total > pageSize" class="search-pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          background
          small
          @current-change="onPageChange"
          @size-change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import * as dictService from '@/services/dict';

const searchQuery = ref('');
const searching = ref(false);
const searched = ref(false);
const resultItems = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);

const typeFilter = ref('');
const secondClassFilter = ref('');
const dataCategoryFilter = ref('');

const typeOptions = ref<Array<{ text: string; value: string }>>([]);
const secondClassOptions = ref<Array<{ text: string; value: string }>>([]);
const dataCategoryOptions = ref<Array<{ text: string; value: string }>>([]);

/** 标记是否正在自动选择筛选条件，防止递归触发 */
let applyingAutoSelect = false;

const hasActiveFilter = computed(() =>
  !!(typeFilter.value || secondClassFilter.value || dataCategoryFilter.value)
);

function typeLabel(code: string): string {
  if (!code) return '';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return '风电';
  if (first === 'G') return '光伏';
  if (first === 'S') return '水电';
  return code;
}

function typeTagType(code: string): 'primary' | 'success' | 'info' | 'warning' {
  if (!code) return 'info';
  const first = code.charAt(0).toUpperCase();
  if (first === 'F') return 'primary';
  if (first === 'G') return 'success';
  if (first === 'S') return 'info';
  return 'warning';
}

async function fetchData(initialSearch = false) {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  try {
    const result = await dictService.quickSearchDict(
      q, pageNum.value, pageSize.value,
      typeFilter.value || undefined,
      secondClassFilter.value || undefined,
      dataCategoryFilter.value || undefined,
    );
    resultItems.value = result.items;
    total.value = result.total;
    typeOptions.value = (result.typeOptions || []).map((t: string) => ({
      text: t === 'F' ? 'F 风电' : t === 'G' ? 'G 光伏' : t === 'S' ? 'S 水电' : t,
      value: t,
    }));
    secondClassOptions.value = (result.secondClassOptions || []).map((s: any) => ({
      text: `${s.secondClassCode} ${s.secondClassName}`,
      value: s.secondClassCode,
    }));
    dataCategoryOptions.value = (result.dataCategoryOptions || []).map((d: any) => ({
      text: `${d.dataCategoryCode} ${d.dataCategoryName}`,
      value: d.dataCategoryCode,
    }));

    // 初始搜索后自动选择唯一筛选选项
    if (initialSearch && !applyingAutoSelect) {
      applyingAutoSelect = true;
      let changed = false;
      if (!typeFilter.value && typeOptions.value.length === 1) {
        typeFilter.value = typeOptions.value[0].value;
        changed = true;
      }
      if (!secondClassFilter.value && secondClassOptions.value.length === 1) {
        secondClassFilter.value = secondClassOptions.value[0].value;
        changed = true;
      }
      if (!dataCategoryFilter.value && dataCategoryOptions.value.length === 1) {
        dataCategoryFilter.value = dataCategoryOptions.value[0].value;
        changed = true;
      }
      applyingAutoSelect = false;
      // 如果自动选中了筛选条件，当前结果已正确，不触发重查
    }
  } catch {
    ElMessage.error('查询失败');
    resultItems.value = [];
  } finally {
    searching.value = false;
  }
}

async function doSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  pageNum.value = 1;
  searched.value = true;
  await fetchData(true);
}

function onFilterChange() {
  pageNum.value = 1;
  fetchData();
}

function clearFilters() {
  typeFilter.value = '';
  secondClassFilter.value = '';
  dataCategoryFilter.value = '';
  pageNum.value = 1;
  fetchData();
}

function onPageChange() {
  fetchData();
}
</script>

<style scoped>
.quick-search-panel {
  padding: 20px 16px;
}

.tech-search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.search-input-tech :deep(.el-input__wrapper) {
  border-radius: 10px 0 0 10px !important;
  box-shadow: 0 0 0 1.5px #e8ecf1 inset !important;
}
.search-input-tech :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1.5px #667eea inset !important;
}
.search-input-tech :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102,126,234,0.3) inset !important;
}
.search-btn-tech {
  border-radius: 0 10px 10px 0 !important;
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: #fff !important;
  border: none !important;
  padding: 0 24px !important;
  font-weight: 600;
}
.search-btn-tech:hover { opacity: 0.9; }

/* 筛选栏 */
.filter-bar {
  margin-top: 16px;
}
.filter-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-select {
  width: 200px;
}
.clear-filter-btn {
  flex-shrink: 0;
}
.filter-tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

/* 搜索结果统计 */
.search-meta {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #909399;
}
.search-meta strong { color: #667eea; }

/* 表格 */
.search-table-wrap {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
}
.tech-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, #f8f9ff, #f0f2ff) !important;
  color: #4a4a8a !important;
  font-weight: 600 !important;
  font-size: 12px !important;
}
.tech-code-tag {
  background: rgba(230,162,60,0.12);
  color: #e6a23c;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
}
.search-pagination {
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f2f4f8;
}
</style>
