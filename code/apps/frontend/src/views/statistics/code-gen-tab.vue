<template>
  <div class="tab-content">
    <!-- 概览卡片 -->
    <div class="overview-stats mb-16">
      <div class="overview-stat-card stat-card-total">
        <div class="os-left">
          <div class="os-icon">📋</div>
          <div class="os-label">累计生成</div>
        </div>
        <div class="os-value">{{ overview.totalCodes }}</div>
      </div>
      <div class="overview-stat-card stat-card-today">
        <div class="os-left">
          <div class="os-icon">📅</div>
          <div class="os-label">今日生成</div>
        </div>
        <div class="os-value">{{ overview.todayCodes }}</div>
      </div>
      <div class="overview-stat-card stat-card-week">
        <div class="os-left">
          <div class="os-icon">📆</div>
          <div class="os-label">本周生成</div>
        </div>
        <div class="os-value">{{ overview.thisWeekCodes }}</div>
      </div>
      <div class="overview-stat-card stat-card-month">
        <div class="os-left">
          <div class="os-icon">📊</div>
          <div class="os-label">本月生成</div>
        </div>
        <div class="os-value">{{ overview.thisMonthCodes }}</div>
      </div>
    </div>

    <!-- 类型分布 -->
    <div class="card-default mb-16">
      <div class="card-header">
        <span class="card-header-title">类型分布</span>
      </div>
      <div class="card-body">
        <div class="overview-stats">
          <div class="overview-stat-card stat-card-wind">
            <div class="os-left">
              <div class="os-icon">🌀</div>
              <div class="os-label">风电</div>
            </div>
            <div class="os-value">{{ typeStats.windCount }}</div>
          </div>
          <div class="overview-stat-card stat-card-solar">
            <div class="os-left">
              <div class="os-icon">☀️</div>
              <div class="os-label">光伏</div>
            </div>
            <div class="os-value">{{ typeStats.solarCount }}</div>
          </div>
          <div class="overview-stat-card stat-card-hydro">
            <div class="os-left">
              <div class="os-icon">🌊</div>
              <div class="os-label">水电</div>
            </div>
            <div class="os-value">{{ typeStats.hydroCount }}</div>
          </div>
          <div class="overview-stat-card stat-card-other">
            <div class="os-left">
              <div class="os-icon">🔄</div>
              <div class="os-label">不区分类型</div>
            </div>
            <div class="os-value">{{ typeStats.otherCount }}</div>
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
            <el-radio-group v-model="secondClassType" size="small" @change="loadSecondClass">
              <el-radio-button value="wind">风电</el-radio-button>
              <el-radio-button value="solar">光伏</el-radio-button>
              <el-radio-button value="hydro">水电</el-radio-button>
            </el-radio-group>
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
      </div>
      <div class="card-body">
        <div class="filter-bar-card">
          <el-select v-model="listFilters.typeCode" placeholder="类型" filterable clearable style="width:150px" @change="onTypeChange" :teleported="false">
            <el-option v-for="t in filterOptionMap.typeCodes" :key="t.code" :label="`${t.code} ${t.name}`" :value="t.code" />
          </el-select>
          <el-select v-model="listFilters.stationCode" placeholder="场站" filterable clearable style="width:150px" @change="onListFilter" :teleported="false">
            <el-option v-for="s in filterOptionMap.stationCodes" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
          </el-select>
          <el-select v-model="listFilters.secondClassCode" placeholder="二级类码" filterable clearable style="width:150px" @change="onSecondClassChange" :teleported="false">
            <el-option v-for="s in filterOptionMap.secondClassCodes" :key="s.code" :label="`${s.code} ${s.name}`" :value="s.code" />
          </el-select>
          <el-select v-model="listFilters.dataTypeCode" placeholder="数据类码" filterable clearable style="width:150px" @change="onListFilter" :teleported="false">
            <el-option v-for="d in filterOptionMap.dataTypeCodes" :key="d.code" :label="`${d.code} ${d.name}`" :value="d.code" />
          </el-select>
          <el-button type="primary" @click="onListFilter">查询</el-button>
          <el-button @click="onResetListFilter">重置</el-button>
          <el-button type="success" :disabled="selectedRows.length === 0" @click="handleExport">导出选中</el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleDeleteSelected">删除选中</el-button>
        </div>

        <div class="table-container-card">
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

          <div class="pagination-bar">
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
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
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
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#7c9cf5' },
            { offset: 0.5, color: '#5a7de8' },
            { offset: 1, color: '#3b5fc9' },
          ],
        },
        shadowBlur: 8,
        shadowColor: 'rgba(59, 95, 201, 0.2)',
        shadowOffsetX: 2,
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
        return `<strong>${p.axisValue}</strong><br/>数量：<strong>${p.value}</strong>`;
      },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      borderWidth: 1,
      textStyle: { fontSize: 12, color: '#303133' },
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
      label: {
        show: true,
        position: 'right',
        fontSize: 11,
        fontWeight: 600,
        color: '#303133',
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#5ad8a6' },
            { offset: 0.5, color: '#36c27d' },
            { offset: 1, color: '#1fa86a' },
          ],
        },
        shadowBlur: 8,
        shadowColor: 'rgba(31, 168, 106, 0.2)',
        shadowOffsetX: 2,
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

onMounted(() => { loadOverview(); loadTypeStats(); loadSecondClass(); loadStation(); loadCodeList(); });
</script>

<style scoped>
.tab-content { min-height: 400px; animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mb-16 { margin-bottom: 16px; }

/* ==================== 概览统计卡片 ==================== */
.overview-stats { display: flex; gap: 12px; }
.overview-stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 14px 12px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
  transition: all 0.25s ease;
}
.overview-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.os-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.os-icon { font-size: 24px; line-height: 1; }
.os-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.os-label { font-size: 12px; color: #909399; white-space: nowrap; }
.os-icon { font-size: 24px; line-height: 1; }
.os-body { flex: 1; }
.os-value { font-size: 24px; font-weight: 700; line-height: 1.2; }
.os-label { font-size: 12px; color: #909399; margin-top: 2px; }

/* ==================== 通用卡片 ==================== */
.card-default {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}
.card-header-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
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
  background: #409eff;
}
.card-body { padding: 16px; }
.chart-body { padding: 8px 16px 16px; }

/* ==================== 图表区域 ==================== */
.chart-row { display: flex; gap: 16px; }
.chart-col { flex: 1; min-width: 0; }
.chart-section { height: 100%; }
.chart-container-h { height: 360px; width: 100%; }

/* ==================== 筛选栏 ==================== */
.filter-bar-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
}

/* ==================== 表格容器 ==================== */
.table-container-card {
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
}
.pagination-bar {
  padding: 14px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f5f5f5;
}

/* ==================== 表格行动画 ==================== */
:deep(.el-table__body tr:hover) { background: #f0f7ff !important; }
:deep(.el-table__body tr) { animation: rowIn 0.25s ease both; }
@keyframes rowIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ==================== 展开行相关 ==================== */
:deep(.el-table__expand-column) { display: none; }
.code-count { display: inline-block; min-width: 28px; font-weight: 700; color: #409EFF; margin-right: 4px; }
:deep(.row-expanded-active) { background-color: #f0f9ff; }
:deep(.row-expanded-active > td) { color: #409EFF; font-weight: 600; }
:deep(.detail-table th),
:deep(.detail-table td) { background-color: #f0f9ff !important; }
</style>
