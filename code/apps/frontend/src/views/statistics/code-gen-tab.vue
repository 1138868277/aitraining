<template>
  <div class="tab-content">
    <!-- 概览卡片 -->
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">累计生成</div><div class="stat-value">{{ overview.totalCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">今日生成</div><div class="stat-value primary">{{ overview.todayCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本周生成</div><div class="stat-value success">{{ overview.thisWeekCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本月生成</div><div class="stat-value warning">{{ overview.thisMonthCodes }}</div></div></el-card></el-col>
    </el-row>

    <!-- 类型维度 -->
    <el-card class="mb-16">
      <template #header><span class="section-title">类型维度</span></template>
      <el-row :gutter="16">
        <el-col :span="8"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon wind"><span class="dot" />风电</div><div class="stat-value primary">{{ typeStats.windCount }}</div></div></el-card></el-col>
        <el-col :span="8"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon solar"><span class="dot" />光伏</div><div class="stat-value success">{{ typeStats.solarCount }}</div></div></el-card></el-col>
        <el-col :span="8"><el-card shadow="hover"><div class="stat-card"><div class="stat-label type-icon other"><span class="dot" />不区分类型</div><div class="stat-value warning">{{ typeStats.otherCount }}</div></div></el-card></el-col>
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import * as statsService from '@/services/statistics';
import VChart from 'vue-echarts';
import 'echarts';

const overview = ref({ totalCodes: 0, todayCodes: 0, thisWeekCodes: 0, thisMonthCodes: 0 });
const typeStats = ref({ windCount: 0, solarCount: 0, otherCount: 0 });
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

onMounted(() => { loadOverview(); loadTypeStats(); loadSecondClass(); loadStation(); });
</script>

<style scoped>
.tab-content { min-height: 400px; }
.mb-16 { margin-bottom: 16px; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-value.warning { color: #E6A23C; }
.chart-container { height: 320px; width: 100%; }
.chart-container-h { height: 360px; width: 100%; }
.chart-card { height: 100%; }
.section-title { font-weight: 600; font-size: 15px; }
.type-icon { display: flex; align-items: center; justify-content: center; gap: 6px; }
.dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
.type-icon.wind .dot { background: #409EFF; }
.type-icon.solar .dot { background: #67C23A; }
.type-icon.other .dot { background: #E6A23C; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
