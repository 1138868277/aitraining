<template>
  <div class="statistics">
    <!-- 数据上传区 -->
    <el-card class="upload-card">
      <template #header>
        <span>数据上传</span>
      </template>
      <el-upload
        drag
        action="#"
        accept=".xlsx,.xls"
        :auto-upload="false"
        :on-change="handleFileUpload"
        :limit="1"
      >
        <el-icon class="el-icon--upload">
          <svg viewBox="0 0 1024 1024" width="40" height="40" fill="#909399">
            <path d="M544 864V288h-64v576H352l160 160 160-160z"/>
            <path d="M128 128h768v128H128z"/>
          </svg>
        </el-icon>
        <div class="el-upload__text">拖拽稽核数据文件到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 .xlsx/.xls 文件，大小不超过 10MB</div>
        </template>
      </el-upload>
    </el-card>

    <!-- 统计概览卡片 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="overview-card">
            <div class="overview-label">总编码数</div>
            <div class="overview-value">{{ overview.totalCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="overview-card">
            <div class="overview-label">合规编码数</div>
            <div class="overview-value compliant">{{ overview.compliantCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="overview-card">
            <div class="overview-label">异常编码数</div>
            <div class="overview-value abnormal">{{ overview.abnormalCount }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="overview-card">
            <div class="overview-label">合规率</div>
            <div class="overview-value rate">{{ overview.complianceRate }}%</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表展示区 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>柱状图</span>
              <el-select v-model="barDimension" size="small" style="width: 140px" @change="refreshCharts">
                <el-option label="管理域" value="managementDomain" />
                <el-option label="场站" value="station" />
                <el-option label="类型" value="type" />
                <el-option label="校验结果" value="checkResult" />
              </el-select>
            </div>
          </template>
          <div class="chart-placeholder">
            <div v-if="barData" class="bar-chart">
              <div v-for="(cat, i) in barData.categories" :key="i" class="bar-item">
                <div class="bar-label">{{ cat }}</div>
                <div class="bar-wrapper">
                  <div
                    class="bar-bar compliant-bar"
                    :style="{ width: barPercent(barData.compliantData[i], maxBarValue) + '%' }"
                  >
                    {{ barData.compliantData[i] }}
                  </div>
                  <div
                    class="bar-bar abnormal-bar"
                    :style="{ width: barPercent(barData.abnormalData[i], maxBarValue) + '%' }"
                  >
                    {{ barData.abnormalData[i] }}
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>饼图</span>
              <el-select v-model="pieDimension" size="small" style="width: 140px" @change="refreshCharts">
                <el-option label="管理域" value="managementDomain" />
                <el-option label="场站" value="station" />
                <el-option label="类型" value="type" />
              </el-select>
            </div>
          </template>
          <div class="chart-placeholder">
            <div v-if="pieData" class="pie-chart">
              <div v-for="(item, i) in pieData.series" :key="i" class="pie-item">
                <div class="pie-color" :style="{ background: pieColors[i % pieColors.length] }"></div>
                <span class="pie-name">{{ item.name }}</span>
                <span class="pie-value">{{ item.value }}</span>
                <span class="pie-percent">{{ item.percentage }}%</span>
              </div>
            </div>
            <el-empty v-else description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计明细表格 -->
    <el-card class="detail-card">
      <template #header>
        <span>统计明细</span>
      </template>
      <el-table :data="detailList" border stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="managementDomain" label="管理域" min-width="120" />
        <el-table-column prop="station" label="场站" min-width="120" />
        <el-table-column prop="totalCount" label="总编码数" width="100" />
        <el-table-column prop="compliantCount" label="合规数" width="100" />
        <el-table-column prop="abnormalCount" label="异常数" width="100" />
        <el-table-column prop="complianceRate" label="合规率" width="100">
          <template #default="{ row }">
            {{ row.complianceRate }}%
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="detailTotal"
          layout="total, prev, pager, next"
          @current-change="loadDetails"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as statisticsService from '@/services/statistics';

const overview = ref({ totalCount: 0, compliantCount: 0, abnormalCount: 0, complianceRate: 0 });
const barDimension = ref('managementDomain');
const pieDimension = ref('managementDomain');
const barData = ref<any>(null);
const pieData = ref<any>(null);
const detailList = ref<any[]>([]);
const detailTotal = ref(0);
const pageNum = ref(1);
const pageSize = ref(20);
const maxBarValue = ref(0);

const pieColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#B37FEB'];

function barPercent(value: number, max: number): number {
  if (max === 0) return 0;
  return (value / max) * 100;
}

function handleFileUpload() {
  ElMessage.success('文件上传功能已触发');
}

async function loadOverview() {
  try {
    const data = await statisticsService.getOverview();
    overview.value = data;
  } catch {}
}

async function refreshCharts() {
  try {
    const bar = await statisticsService.getChartData('bar', barDimension.value);
    barData.value = bar;
    maxBarValue.value = Math.max(...[...bar.compliantData, ...bar.abnormalData], 1);
  } catch {}

  try {
    const pie = await statisticsService.getChartData('pie', pieDimension.value);
    pieData.value = pie;
  } catch {}
}

async function loadDetails() {
  try {
    const result = await statisticsService.getDetails(pageNum.value, pageSize.value);
    detailList.value = result.list;
    detailTotal.value = result.total;
  } catch {}
}

onMounted(() => {
  loadOverview();
  refreshCharts();
  loadDetails();
});
</script>

<style scoped>
.statistics {
  max-width: 1400px;
  margin: 0 auto;
}

.upload-card {
  margin-bottom: 20px;
}

.overview-row {
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
  padding: 10px 0;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.overview-value.compliant {
  color: #67c23a;
}

.overview-value.abnormal {
  color: #f56c6c;
}

.overview-value.rate {
  color: #409eff;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-placeholder {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-chart {
  width: 100%;
}

.bar-item {
  margin-bottom: 12px;
}

.bar-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.bar-wrapper {
  display: flex;
  gap: 2px;
}

.bar-bar {
  padding: 2px 6px;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  border-radius: 2px;
  min-width: 20px;
}

.compliant-bar {
  background: #67c23a;
}

.abnormal-bar {
  background: #f56c6c;
}

.pie-chart {
  width: 100%;
}

.pie-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 8px;
}

.pie-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.pie-name {
  flex: 1;
  font-size: 14px;
}

.pie-value {
  font-size: 14px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.pie-percent {
  font-size: 13px;
  color: #909399;
  min-width: 50px;
  text-align: right;
}

.detail-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
