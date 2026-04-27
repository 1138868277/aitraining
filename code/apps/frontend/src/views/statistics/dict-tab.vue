<template>
  <div class="tab-content">
    <!-- 字典新增情况 -->
    <el-card class="mb-16">
      <template #header><span class="section-title">字典新增情况</span></template>
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

const add = ref({ totalNewCodes: 0, manualCodes: 0, autoCodes: 0, newCodesBySecondClass: [] as any[], newCodesByDate: [] as any[] });

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
  try { add.value = await statsService.getDictNewAddition(); } catch {}
});
</script>

<style scoped>
.tab-content { min-height: 400px; }
.mb-16 { margin-bottom: 16px; }
.mt-16 { margin-top: 16px; }
.chart-container-sm { height: 280px; width: 100%; }
.section-title { font-weight: 600; font-size: 15px; }
</style>
