<template>
  <div class="tab-content">
    <el-row :gutter="16" class="mb-16">
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">场站数</div><div class="stat-value">{{ overview.stationCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">二级类码</div><div class="stat-value">{{ overview.secondClassCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">三级类码</div><div class="stat-value">{{ overview.thirdClassCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">数据类码</div><div class="stat-value">{{ overview.dataCategoryCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">数据码</div><div class="stat-value">{{ overview.dataCodeCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">类型域数</div><div class="stat-value">{{ overview.typeDomainCount }}</div></div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="mb-16">
      <el-col :span="8">
        <el-card>
          <template #header><span>类型域分布</span></template>
          <div class="chart-container"><v-chart v-if="distData" :option="distData" autoresize /></div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header><span>各类型域详情</span></template>
          <el-table :data="distItems" border stripe size="small">
            <el-table-column prop="typeDomainName" label="类型域" width="80" />
            <el-table-column prop="secondClassCount" label="二级类码数" width="100" />
            <el-table-column prop="dataCategoryCount" label="数据类码数" width="100" />
            <el-table-column prop="dataCodeCount" label="数据码数" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mb-16">
      <template #header><span>字典新增情况</span></template>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="新增总数" :value="add.totalNewCodes" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="手动新增" :value="add.manualCodes" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="自动新增" :value="add.autoCodes" />
        </el-col>
      </el-row>
      <el-row :gutter="16" class="mt-16">
        <el-col :span="12">
          <h4>按二级类码</h4>
          <div class="chart-container-sm"><v-chart v-if="scBarData" :option="scBarData" autoresize /></div>
        </el-col>
        <el-col :span="12">
          <h4>按日期趋势</h4>
          <div class="chart-container-sm"><v-chart v-if="dateLineData" :option="dateLineData" autoresize /></div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const overview = ref({ stationCount: 0, secondClassCount: 0, thirdClassCount: 0, dataCategoryCount: 0, dataCodeCount: 0, typeDomainCount: 0 });
const distItems = ref<Array<{ typeDomainCode: string; typeDomainName: string; secondClassCount: number; dataCategoryCount: number; dataCodeCount: number }>>([]);
const add = ref({ totalNewCodes: 0, manualCodes: 0, autoCodes: 0, newCodesBySecondClass: [] as any[], newCodesByDate: [] as any[] });

const distData = computed(() => {
  if (!distItems.value.length) return null;
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: distItems.value.map(i => ({ name: i.typeDomainName, value: i.dataCodeCount })),
      label: { show: true, formatter: '{b}: {c}' },
    }],
  };
});

const scBarData = computed(() => {
  const items = add.value.newCodesBySecondClass;
  if (!items.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: items.map(i => i.secondClassName || i.secondClassCode), axisLabel: { rotate: 45, fontSize: 10 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: items.map(i => i.count), itemStyle: { color: '#E6A23C' } }],
  };
});

const dateLineData = computed(() => {
  const items = add.value.newCodesByDate;
  if (!items.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: items.map(i => i.date), axisLabel: { fontSize: 10, interval: 3 } },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: items.map(i => i.count), smooth: true, areaStyle: { color: 'rgba(64,158,255,0.15)' }, itemStyle: { color: '#409EFF' } }],
  };
});

onMounted(async () => {
  try { overview.value = await statsService.getDictOverview(); } catch {}
  try { distItems.value = (await statsService.getDictTypeDomainDist()).items; } catch {}
  try { add.value = await statsService.getDictNewAddition(); } catch {}
});
</script>

<style scoped>
.tab-content { min-height: 400px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.warning { color: #E6A23C; }
.chart-container { height: 320px; width: 100%; }
.chart-container-sm { height: 280px; width: 100%; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.import-status { margin-top: 12px; padding: 8px 12px; border-radius: 4px; font-size: 13px; }
.import-status.completed { background: #f0f9eb; color: #67c23a; }
.import-status.failed { background: #fef0f0; color: #f56c6c; }
.import-status.processing { background: #ecf5ff; color: #409eff; }
</style>
