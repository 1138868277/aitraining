<template>
  <div class="tab-content">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">累计生成</div><div class="stat-value primary">{{ overview.totalCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">今<span class="label-unit label-unit-success">日</span>生成</div><div class="stat-value success">{{ overview.todayCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本<span class="label-unit label-unit-hydro">周</span>生成</div><div class="stat-value hydro">{{ overview.thisWeekCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本<span class="label-unit label-unit-warning">月</span>生成</div><div class="stat-value warning">{{ overview.thisMonthCodes }}</div></div></el-card></el-col>
    </el-row>

    <!-- 类型维度 -->
    <el-card class="mb-16">
      <template #header><span class="section-title">类型维度</span></template>
      <el-row :gutter="16">
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon wind"><svg viewBox="0 0 20 20" width="15" height="15" class="type-icon-svg"><line x1="10" y1="9" x2="10" y2="17" stroke="#409EFF" stroke-width="1.6" stroke-linecap="round"/><path d="M10 9 L3 3 L10 6 L17 3 Z" fill="#409EFF"/><circle cx="10" cy="6" r="1.8" fill="#409EFF"/></svg>风电</div><div class="stat-value primary">{{ typeStats.windCount }}</div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon solar"><svg viewBox="0 0 20 20" width="15" height="15" class="type-icon-svg"><circle cx="10" cy="10" r="3.5" fill="none" stroke="#67C23A" stroke-width="1.5"/><line x1="10" y1="2" x2="10" y2="4.5" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="10" y1="15.5" x2="10" y2="18" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="2" y1="10" x2="4.5" y2="10" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="15.5" y1="10" x2="18" y2="10" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="4.3" y1="4.3" x2="6.1" y2="6.1" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="13.9" y1="13.9" x2="15.7" y2="15.7" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="4.3" y1="15.7" x2="6.1" y2="13.9" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/><line x1="13.9" y1="6.1" x2="15.7" y2="4.3" stroke="#67C23A" stroke-width="1.3" stroke-linecap="round"/></svg>光伏</div><div class="stat-value success">{{ typeStats.solarCount }}</div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon hydro"><svg viewBox="0 0 20 20" width="15" height="15" class="type-icon-svg"><path d="M10 2 C10 2 4 9.5 4 13 C4 16.3 6.7 19 10 19 C13.3 19 16 16.3 16 13 C16 9.5 10 2 10 2 Z" fill="none" stroke="#36CFC9" stroke-width="1.5"/></svg>水电</div><div class="stat-value hydro">{{ typeStats.hydroCount }}</div></div></el-card></el-col>
        <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon other"><svg viewBox="0 0 20 20" width="15" height="15" class="type-icon-svg"><circle cx="10" cy="6" r="2" fill="none" stroke="#E6A23C" stroke-width="1.4"/><circle cx="6" cy="14" r="2" fill="none" stroke="#E6A23C" stroke-width="1.4"/><circle cx="14" cy="14" r="2" fill="none" stroke="#E6A23C" stroke-width="1.4"/></svg>不区分类型</div><div class="stat-value warning">{{ typeStats.otherCount }}</div></div></el-card></el-col>
      </el-row>
    </el-card>

    <!-- 二级类码维度 + 场站维度（左右并排） -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="section-title">二级类码维度</span>
              <el-radio-group v-model="secondClassType" size="small" @change="loadSecondClass">
                <el-radio-button value="wind">风电</el-radio-button>
                <el-radio-button value="solar">光伏</el-radio-button>
                <el-radio-button value="hydro">水电</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container-h"><v-chart v-if="secondClassData" :option="secondClassData" autoresize /></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header><span class="section-title">场站维度</span></template>
          <div class="chart-container-h"><v-chart v-if="stationData" :option="stationData" autoresize /></div>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <!-- 编码生成列表 -->
  <div class="list-section">
    <div class="list-section-header">编码生成列表</div>

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
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    yAxis: {
      type: 'category',
      data: secondClassItems.value.map(i => i.name).reverse(),
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: secondClassItems.value.map(i => i.value).reverse(),
      barMaxWidth: 24,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#4db8ff' },
            { offset: 1, color: '#1a7bca' },
          ],
        },
        shadowBlur: 6,
        shadowColor: 'rgba(26, 123, 202, 0.3)',
        shadowOffsetX: 2,
      },
    }],
  };
});

const stationData = computed(() => {
  if (!stationItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: 'rgba(0,0,0,0.06)' } },
      axisLabel: { fontSize: 10, color: '#909399' },
    },
    yAxis: {
      type: 'category',
      data: stationItems.value.map(i => i.name).reverse(),
      axisLabel: { fontSize: 11, fontWeight: 'bold', color: '#303133' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stationItems.value.map(i => i.value).reverse(),
      barMaxWidth: 24,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#40944f' },
          ],
        },
        shadowBlur: 6,
        shadowColor: 'rgba(64, 148, 79, 0.3)',
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
.tab-content { min-height: 400px; }
.mb-16 { margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.label-unit { display: inline-block; padding: 0 5px; border-radius: 3px; background: #f0f0f0; color: #606266; font-weight: 600; font-size: 13px; line-height: 1.6; }
.label-unit-success { background: #f0f9eb; color: #67C23A; }
.label-unit-hydro { background: #e6f9f8; color: #36CFC9; }
.label-unit-warning { background: #fdf6ec; color: #E6A23C; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 1px; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.hydro { color: #36CFC9; }
.stat-value.warning { color: #E6A23C; }
.chart-container { height: 320px; width: 100%; }
.chart-container-h { height: 360px; width: 100%; }
.chart-card { height: 100%; }
.section-title { font-weight: 600; font-size: 15px; }
.type-icon { display: flex; align-items: center; justify-content: center; gap: 6px; }
.type-icon-svg { flex-shrink: 0; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.type-icon.wind .dot { background: #409EFF; }
.type-icon.solar .dot { background: #67C23A; }
.type-icon.hydro .dot { background: #36CFC9; }
.type-icon.other .dot { background: #E6A23C; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.list-section { margin-top: 32px; border-top: 1px solid #e4e7ed; padding-top: 24px; }
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
