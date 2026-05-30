<template>
  <div class="quick-search-panel">
    <!-- 搜索栏 -->
    <div class="qs-search-section">
      <div class="qs-search-input-wrap">
        <el-input
          v-model="searchQuery"
          placeholder="输入数据码名称模糊查询，回车查询"
          clearable
          size="large"
          @keyup.enter="doSearch"
          class="qs-search-input"
        >
          <template #prefix>
            <svg class="qs-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 类型快速筛选 -->
    <div class="qs-type-filter">
      <button
        :class="['qs-type-btn', { active: typeFilter === '' }]"
        @click="typeFilter = ''; onFilterChange()"
      >
        <span class="qs-type-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </span>
        全部
      </button>
      <button
        :class="['qs-type-btn', { active: typeFilter === 'F' }]"
        @click="typeFilter = 'F'; onFilterChange()"
      >
        <span class="qs-type-icon">🌬️</span>
        风电
      </button>
      <button
        :class="['qs-type-btn', { active: typeFilter === 'G' }]"
        @click="typeFilter = 'G'; onFilterChange()"
      >
        <span class="qs-type-icon">☀️</span>
        光伏
      </button>
      <button
        :class="['qs-type-btn', { active: typeFilter === 'S' }]"
        @click="typeFilter = 'S'; onFilterChange()"
      >
        <span class="qs-type-icon">💧</span>
        水电
      </button>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searched" class="qs-meta">
      <template v-if="searching">
        <span class="qs-meta-searching">查询中...</span>
      </template>
      <template v-else-if="resultItems.length > 0">
        共检索到 <strong>{{ total }}</strong> 条匹配记录
      </template>
      <template v-else>
        <span class="qs-meta-empty">未找到匹配的数据码</span>
      </template>
    </div>
    <div v-else class="qs-meta qs-meta-hint">
      输入关键词后回车开始查询
    </div>

    <!-- 结果表格 -->
    <div v-show="resultItems.length > 0" class="qs-table-wrap">
      <el-table :data="resultItems" stripe style="width:100%;table-layout:fixed" size="small" class="qs-table" v-loading="searching">
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.typeCode)" size="small" effect="plain" class="qs-type-tag">{{ typeLabel(row.typeCode) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二级类码">
          <template #default="{ row }">
            <el-tag size="small" color="#e8f4fd" style="color:#1677ff;border:none;font-family:monospace;margin-right:4px;">{{ row.secondClassCode }}</el-tag>
            <span class="qs-name-tag">{{ row.secondClassName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据类码">
          <template #default="{ row }">
            <el-tag size="small" color="#f0f9eb" style="color:#67c23a;border:none;font-family:monospace;margin-right:4px;">{{ row.dataCategoryCode }}</el-tag>
            <span class="qs-name-tag">{{ row.dataCategoryName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数据码">
          <template #default="{ row }">
            <el-tag size="small" color="#fdf6ec" style="color:#e6a23c;border:none;font-family:monospace;margin-right:4px;">{{ row.dataCode }}</el-tag>
            <span class="qs-name-tag">{{ row.dataName }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="total > pageSize" class="qs-pagination">
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

async function fetchData() {
  const q = searchQuery.value.trim();
  if (!q) return;
  searching.value = true;
  try {
    const result = await dictService.quickSearchDict(
      q, pageNum.value, pageSize.value,
      typeFilter.value || undefined,
    );
    resultItems.value = result.items;
    total.value = result.total;
  } catch {
    ElMessage.error('查询失败');
    resultItems.value = [];
  } finally {
    searching.value = false;
  }
}

function doSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;
  pageNum.value = 1;
  searched.value = true;
  fetchData();
}

function onFilterChange() {
  if (!searched.value) return;
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

/* ========== 搜索栏 ========== */
.qs-search-section {
  max-width: 640px;
  margin: 0 auto;
}
.qs-search-input-wrap {
  position: relative;
}
.qs-search-input :deep(.el-input__wrapper) {
  border-radius: 12px !important;
  box-shadow: 0 0 0 1.5px #e2e6ec inset !important;
  background: #fff;
  transition: all 0.3s ease;
}
.qs-search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1.5px #667eea inset !important;
}
.qs-search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102,126,234,0.3) inset !important;
  border-color: transparent;
}
.qs-search-icon {
  color: #94a3b8;
  width: 18px;
  height: 18px;
}

/* ========== 类型快速筛选 ========== */
.qs-type-filter {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.qs-type-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 18px;
  border-radius: 8px;
  border: 1.5px solid #e8ecf1;
  background: #fff;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;
}
.qs-type-btn:hover {
  border-color: #c0c8d6;
  color: #606266;
}
.qs-type-btn.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.06));
  color: #667eea;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102,126,234,0.15);
}
.qs-type-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 1;
}

/* ========== 结果统计 ========== */
.qs-meta {
  text-align: center;
  margin-top: 14px;
  font-size: 13px;
  color: #909399;
  min-height: 20px;
}
.qs-meta strong { color: #667eea; font-weight: 700; }
.qs-meta-searching { color: #667eea; }
.qs-meta-empty { color: #c0c4cc; }
.qs-meta-hint { color: #c0c4cc; font-size: 12px; }

/* ========== 结果表格 ========== */
.qs-table-wrap {
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  background: #fff;
  min-height: 200px;
}
.qs-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, #f8f9ff, #f0f2ff) !important;
  color: #4a4a8a !important;
  font-weight: 600 !important;
  font-size: 12px !important;
}
.qs-table :deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}
.qs-type-tag {
  font-weight: 600;
}
.qs-name-tag {
  color: #909399;
  font-size: 12px;
}
.qs-pagination {
  margin-top: 8px;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(34,211,238,0.03) 100%);
  border-top: 1px solid #eef2f8;
  position: relative;
}
.qs-pagination::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #3b82f6, #22d3ee, transparent);
  opacity: 0.5;
  pointer-events: none;
}
.qs-pagination :deep(.el-pagination) {
  font-weight: 500;
}
.qs-pagination :deep(.el-pagination button) {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e4e9f2;
  background: #fff;
  color: #475569;
  transition: all 0.2s ease;
}
.qs-pagination :deep(.el-pagination button:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
  box-shadow: 0 0 12px rgba(59,130,246,0.15);
}
.qs-pagination :deep(.el-pagination button:disabled) {
  border-color: #e4e9f2;
  color: #cbd5e1;
  background: #f8fafc;
  box-shadow: none;
}
.qs-pagination :deep(.el-pager li) {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e4e9f2;
  background: #fff;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  margin: 0 2px;
}
.qs-pagination :deep(.el-pager li:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
}
.qs-pagination :deep(.el-pager li.is-active) {
  border-color: transparent;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(59,130,246,0.30);
}
.qs-pagination :deep(.el-pagination__total) {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
  margin-right: 12px;
  padding: 0 12px;
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.05));
  border: 1px solid rgba(59,130,246,0.12);
  border-radius: 6px;
  line-height: 28px;
  height: 28px;
  letter-spacing: 0.3px;
}
.qs-pagination :deep(.el-pagination__sizes) {
  margin-right: 8px;
}
.qs-pagination :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}
.qs-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid rgba(59,130,246,0.15);
  box-shadow: none !important;
  background: linear-gradient(135deg, #fff, rgba(59,130,246,0.04));
  min-height: 32px;
  height: 32px;
  transition: all 0.2s ease;
}
.qs-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59,130,246,0.12) !important;
}
.qs-pagination :deep(.el-pagination__sizes .el-select .el-input__inner) {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
}
.qs-pagination :deep(.el-pagination__sizes .el-select .el-input__suffix) {
  color: #3b82f6;
}
.qs-pagination :deep(.el-pagination__sizes .el-select-dropdown) {
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(59,130,246,0.12);
  padding: 6px;
  background: rgba(255,255,255,0.98);
  min-width: 100px;
}
.qs-pagination :deep(.el-pagination__sizes .el-select-dropdown__item) {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  transition: all 0.15s ease;
}
.qs-pagination :deep(.el-pagination__sizes .el-select-dropdown__item:hover) {
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.04));
  color: #3b82f6;
}
.qs-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 600;
}
.qs-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected:hover) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
</style>
