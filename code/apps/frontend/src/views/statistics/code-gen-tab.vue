<template>
  <div class="tab-content">
    <el-row :gutter="16" class="mb-16">
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">累计生成</div><div class="stat-value">{{ overview.totalCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">今日生成</div><div class="stat-value primary">{{ overview.todayCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本周生成</div><div class="stat-value success">{{ overview.thisWeekCodes }}</div></div></el-card></el-col>
      <el-col :span="6"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">本月生成</div><div class="stat-value warning">{{ overview.thisMonthCodes }}</div></div></el-card></el-col>
    </el-row>

    <el-row :gutter="16" class="mb-16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header"><span>维度分布</span>
              <el-select v-model="dimension" size="small" style="width:140px" @change="loadDimension">
                <el-option label="类型" value="typeCode" />
                <el-option label="场站" value="stationCode" />
                <el-option label="二级类码" value="secondClassCode" />
                <el-option label="数据类码" value="dataCategoryCode" />
              </el-select>
            </div>
          </template>
          <div class="chart-container"><v-chart v-if="barData" :option="barData" autoresize /></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>每日趋势（近30天）</span></template>
          <div class="chart-container"><v-chart v-if="trendData" :option="trendData" autoresize /></div>
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
const dimension = ref('typeCode');
const dimItems = ref<Array<{ name: string; value: number; percentage: number }>>([]);
const trendItems = ref<Array<{ date: string; count: number }>>([]);

const barData = computed(() => {
  if (!dimItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: dimItems.value.map(i => i.name), axisLabel: { rotate: 45, fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: dimItems.value.map(i => i.value), itemStyle: { color: '#409EFF' }, barMaxWidth: 40 }],
  };
});

const trendData = computed(() => {
  if (!trendItems.value.length) return null;
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: trendItems.value.map(i => i.date), axisLabel: { fontSize: 10, interval: 2 } },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: trendItems.value.map(i => i.count), smooth: true, lineStyle: { color: '#67C23A' }, areaStyle: { color: 'rgba(103,194,58,0.15)' }, itemStyle: { color: '#67C23A' } }],
  };
});

async function loadOverview() {
  try { overview.value = await statsService.getCodeGenOverview(); } catch {}
}
async function loadDimension() {
  try { dimItems.value = (await statsService.getCodeGenByDimension(dimension.value)).items; } catch {}
}
async function loadTrend() {
  try { trendItems.value = (await statsService.getCodeGenTrend(30)).items; } catch {}
}

onMounted(() => { loadOverview(); loadDimension(); loadTrend(); });
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
