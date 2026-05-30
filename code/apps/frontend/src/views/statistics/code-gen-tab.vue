<template>
  <div class="tab-content">
    <!-- 概览 -->
    <div class="card-default mb-16">
      <div class="card-header">
        <span class="card-header-title">概览</span>
      </div>
      <div class="card-body">
        <div class="tech-metrics">
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#3b82f6;background:rgba(59,130,246,0.1)">📋</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#3b82f6">{{ overview.totalCodes }}</div>
              <div class="tmc-label">累计生成</div>
            </div>
            <div class="tmc-glow" style="background:#3b82f6"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#f59e0b;background:rgba(245,158,11,0.1)">📅</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#f59e0b">{{ overview.todayCodes }}</div>
              <div class="tmc-label">今日生成</div>
            </div>
            <div class="tmc-glow" style="background:#f59e0b"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#06b6d4;background:rgba(6,182,212,0.1)">📆</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#06b6d4">{{ overview.thisWeekCodes }}</div>
              <div class="tmc-label">本周生成</div>
            </div>
            <div class="tmc-glow" style="background:#06b6d4"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#909399;background:rgba(144,147,153,0.1)">📊</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#909399">{{ overview.thisMonthCodes }}</div>
              <div class="tmc-label">本月生成</div>
            </div>
            <div class="tmc-glow" style="background:#909399"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 类型分布 -->
    <div class="card-default mb-16">
      <div class="card-header">
        <span class="card-header-title">类型分布</span>
      </div>
      <div class="card-body">
        <div class="tech-metrics">
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#3b82f6;background:rgba(59,130,246,0.1)">🌀</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#3b82f6">{{ typeStats.windCount }}</div>
              <div class="tmc-label">风电</div>
            </div>
            <div class="tmc-glow" style="background:#3b82f6"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#f59e0b;background:rgba(245,158,11,0.1)">☀️</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#f59e0b">{{ typeStats.solarCount }}</div>
              <div class="tmc-label">光伏</div>
            </div>
            <div class="tmc-glow" style="background:#f59e0b"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#06b6d4;background:rgba(6,182,212,0.1)">🌊</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#06b6d4">{{ typeStats.hydroCount }}</div>
              <div class="tmc-label">水电</div>
            </div>
            <div class="tmc-glow" style="background:#06b6d4"></div>
          </div>
          <div class="tech-metric-card">
            <div class="tmc-icon" style="color:#909399;background:rgba(144,147,153,0.1)">🔄</div>
            <div class="tmc-body">
              <div class="tmc-value" style="color:#909399">{{ typeStats.otherCount }}</div>
              <div class="tmc-label">不区分类型</div>
            </div>
            <div class="tmc-glow" style="background:#909399"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 二级类码分布 + 场站分布（左右并排） -->
    <div class="chart-row mb-16">
      <div class="chart-col">
        <div class="card-default chart-section">
          <div class="card-header">
            <span class="card-header-title">二级类码分布</span>
            <div class="tech-filter-group">
              <button :class="['tech-filter-btn', { active: secondClassType === 'wind' }]" @click="secondClassType='wind';loadSecondClass()">
                <span class="tfb-dot" style="background:#3b82f6"></span>风电
              </button>
              <button :class="['tech-filter-btn', { active: secondClassType === 'solar' }]" @click="secondClassType='solar';loadSecondClass()">
                <span class="tfb-dot" style="background:#f59e0b"></span>光伏
              </button>
              <button :class="['tech-filter-btn', { active: secondClassType === 'hydro' }]" @click="secondClassType='hydro';loadSecondClass()">
                <span class="tfb-dot" style="background:#06b6d4"></span>水电
              </button>
            </div>
          </div>
          <div class="card-body chart-body">
            <div class="chart-container-h"><v-chart v-if="secondClassData" :option="secondClassData" autoresize /></div>
          </div>
        </div>
      </div>
      <div class="chart-col">
        <div class="card-default chart-section">
          <div class="card-header">
            <span class="card-header-title">场站分布</span>
          </div>
          <div class="card-body chart-body">
            <div class="chart-container-h"><v-chart v-if="stationData" :option="stationData" autoresize /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编码生成列表 -->
    <div class="card-default">
      <div class="card-header">
        <span class="card-header-title">编码生成列表</span>
        <div class="filter-actions">
          <button class="tb-btn" @click="onResetListFilter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            <span>重置</span>
          </button>
          <span class="filter-divider" />
          <button class="tb-btn" :disabled="selectedRows.length === 0" @click="handleExport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>导出选中</span>
          </button>
          <button class="tb-btn danger" :disabled="selectedRows.length === 0" @click="handleDeleteSelected">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>删除选中</span>
          </button>
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

      <div class="quick-search-pagination tech-pagination">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as XLSX from 'xlsx';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const overview = ref({ totalCodes: 0, todayCodes: 0, thisWeekCodes: 0, thisMonthCodes: 0 });
const typeStats = ref({ windCount: 0, solarCount: 0, hydroCount: 0, otherCount: 0 });
const secondClassType = ref('wind');
const secondClassItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const stationItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);

const secondClassData = computed(() => {
  if (!secondClassItems.value.length) return null;
  const items = [...secondClassItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-weight:600;color:#303133;margin-bottom:4px;">${p.axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>
                  <span style="color:#909399;">数量：</span>
                  <span style="color:#303133;font-weight:700;">${p.value}</span>
                </div>`;
      },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,0.06);border-radius:8px;',
      textStyle: { fontSize: 12, color: '#606266' },
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLabel: { fontSize: 11, fontWeight: 600, color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      barMaxWidth: 26,
      barMinHeight: 8,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 40,
      label: {
        show: true,
        position: 'right',
        fontSize: 12,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: '#22d3ee' },
          ],
        },
        shadowBlur: 4,
        shadowColor: 'rgba(59,130,246,0.15)',
        shadowOffsetX: 1,
      },
    }],
  };
});

const stationData = computed(() => {
  if (!stationItems.value.length) return null;
  const items = [...stationItems.value].reverse();
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-weight:600;color:#303133;margin-bottom:4px;">${p.axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;"></span>
                  <span style="color:#909399;">数量：</span>
                  <span style="color:#303133;font-weight:700;">${p.value}</span>
                </div>`;
      },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      extraCssText: 'box-shadow:0 4px 12px rgba(0,0,0,0.06);border-radius:8px;',
      textStyle: { fontSize: 12, color: '#606266' },
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map(i => i.name),
      axisLabel: { fontSize: 11, fontWeight: 600, color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map(i => i.value),
      barMaxWidth: 26,
      barMinHeight: 8,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      animationDelay: (idx: number) => idx * 40,
      label: {
        show: true,
        position: 'right',
        fontSize: 12,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#22d3ee' },
          ],
        },
        shadowBlur: 4,
        shadowColor: 'rgba(139,92,246,0.15)',
        shadowOffsetX: 1,
      },
    }],
  };
});

async function loadOverview() {
  try { overview.value = await statsService.getCodeGenOverview(); } catch {}
}
async function loadTypeStats() {
  try { typeStats.value = await statsService.getCodeGenByType(); } catch {}
}
async function loadSecondClass() {
  try { secondClassItems.value = (await statsService.getCodeGenBySecondClass(secondClassType.value)).items; } catch {}
}
async function loadStation() {
  try { stationItems.value = (await statsService.getCodeGenByStation()).items; } catch {}
}

// 编码生成列表（分组统计）
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

// 给列表数据自动补充 rowKey
function enrichListData(list: any[]) {
  return list.map(item => ({ ...item, rowKey: getRowKey(item), _detailList: [], _detailLoading: false }));
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

/** 表头筛选选项（联动：类型→二级类码→三级类码→数据类码） */
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

/** 从列头筛选值中提取编码（值格式为 "code|name"） */
function extractCode(val: string | undefined): string | undefined {
  return val ? val.split('|')[0] : undefined;
}

/** 列头筛选变化 → 只更新当前列，其他筛选保持独立 → 触发查询 */
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

onMounted(() => { loadOverview(); loadTypeStats(); loadSecondClass(); loadStation(); loadCodeList(); });
</script>

<style scoped>
.tab-content { min-height: 400px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mb-16 { margin-bottom: 16px; }

/* ==================== 科技风指标卡片（与字典查询风格一致） ==================== */
.tech-metrics { display: flex; gap: 12px; }
.tech-metric-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tech-metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
}
.tmc-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0.6;
}
.tmc-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.tmc-body { flex: 1; }
.tmc-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.tmc-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ==================== 科技风筛选按钮 ==================== */
.tech-filter-group {
  display: flex;
  background: rgba(59,130,246,0.06);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid rgba(59,130,246,0.1);
}
.tech-filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  white-space: nowrap;
}
.tech-filter-btn:hover { color: #606266; }
.tech-filter-btn.active {
  background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08));
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59,130,246,0.12);
}
.tfb-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  transition: all 0.3s ease;
}
.tech-filter-btn.active .tfb-dot {
  box-shadow: 0 0 6px currentColor;
}

/* ==================== 通用卡片（科技风） ==================== */
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
.card-body { padding: 16px; }
.chart-body { padding: 8px 16px 16px; }

/* ==================== 图表区域 ==================== */
.chart-row { display: flex; gap: 16px; }
.chart-col { flex: 1; min-width: 0; }
.chart-section { height: 100%; }
.chart-container-h { height: 360px; width: 100%; }

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
.quick-search-pagination {
  margin-top: 8px;
  padding: 10px 16px;
  display: flex;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(59,130,246,0.04) 0%, rgba(34,211,238,0.03) 100%);
  border-top: 1px solid #eef2f8;
  position: relative;
}
.quick-search-pagination::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #3b82f6, #22d3ee, transparent);
  opacity: 0.5;
}
.tech-pagination :deep(.el-pagination) {
  font-weight: 500;
}
.quick-search-pagination :deep(.el-pagination button) {
  min-width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e4e9f2;
  background: #fff;
  color: #475569;
  transition: all 0.2s ease;
}
.quick-search-pagination :deep(.el-pagination button:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
  box-shadow: 0 0 12px rgba(59,130,246,0.15);
}
.quick-search-pagination :deep(.el-pagination button:disabled) {
  border-color: #e4e9f2;
  color: #cbd5e1;
  background: #f8fafc;
  box-shadow: none;
}
.quick-search-pagination :deep(.el-pager li) {
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
.quick-search-pagination :deep(.el-pager li:hover) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59,130,246,0.06);
}
.quick-search-pagination :deep(.el-pager li.is-active) {
  border-color: transparent;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(59,130,246,0.30);
}
.quick-search-pagination :deep(.el-pagination__total) {
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
.quick-search-pagination :deep(.el-pagination__sizes) {
  margin-right: 8px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select) {
  width: 110px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper) {
  border-radius: 6px;
  border: 1px solid rgba(59,130,246,0.15);
  box-shadow: none !important;
  background: linear-gradient(135deg, #fff, rgba(59,130,246,0.04));
  min-height: 32px;
  height: 32px;
  transition: all 0.2s ease;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__wrapper:hover) {
  border-color: #3b82f6;
  box-shadow: 0 0 12px rgba(59,130,246,0.12) !important;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__inner) {
  font-size: 13px;
  font-weight: 600;
  color: #1e3a5f;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select .el-input__suffix) {
  color: #3b82f6;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown) {
  border: 1px solid rgba(59,130,246,0.15);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(59,130,246,0.12);
  padding: 6px;
  background: rgba(255,255,255,0.98);
  min-width: 100px;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item) {
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  transition: all 0.15s ease;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item:hover) {
  background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(34,211,238,0.04));
  color: #3b82f6;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 600;
}
.quick-search-pagination :deep(.el-pagination__sizes .el-select-dropdown__item.selected:hover) {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
}
.quick-search-pagination :deep(.el-pagination__rightwrapper) {
  gap: 4px;
}
.cell-code {
  font-weight: 500;
  color: #303133;
}
.cell-name {
  color: #909399;
  font-size: 12px;
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

/* ==================== 表格样式 ==================== */
:deep(.el-table) {
  border: none !important;
}
:deep(.el-table .el-table__inner-wrapper) {
  border: none !important;
}
:deep(.el-table__body tr) {
  transition: background 0.2s ease;
}
:deep(.el-table__body tr:hover) {
  background: #f0f7ff !important;
}
:deep(.el-table__body tr.el-table__row--striped:hover) {
  background: #e8f0fe !important;
}
:deep(.el-table__cell) {
  padding: 8px 0 !important;
}

/* ==================== 展开行相关 ==================== */
:deep(.el-table__expand-column) { display: none; }
:deep(.row-expanded-active) { background-color: #f0f9ff !important; }
:deep(.row-expanded-active > td.el-table__cell) { border-bottom-color: #d0e3ff !important; }
:deep(.el-table__expanded-cell) { padding: 8px 16px 8px 50px !important; background: #f8faff !important; }
.detail-table { border: none !important; }
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
/* 筛选激活的表头单元格：更明显的背景色 */
.styled-table th.is-filter-active,
.styled-table .el-table__cell.is-filter-active {
  background: #d6e8ff !important;
  box-shadow: inset 0 -2px 0 0 #409eff;
}
/* 筛选激活的表头标签着色 */
.styled-table th.is-filter-active .cell {
  color: #1a5ec7 !important;
}
/* 表头单元格内容垂直居中 */
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

/* ==================== tb-btn 工具栏按钮 ==================== */
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
  border: 1.5px solid #d1d9e6;
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  line-height: 1;
  color: #475569;
  background: #fff;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-family: inherit;
}
.tb-btn:hover:not(:disabled) {
  border-color: #94a3b8;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.tb-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  transform: none;
}
.tb-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fff;
}
.tb-btn.danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(220,38,38,0.08);
}
</style>
