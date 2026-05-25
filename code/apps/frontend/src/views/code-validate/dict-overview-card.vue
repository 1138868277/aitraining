<template>
  <div class="overview-section">
    <div class="overview-header">
      <div class="overview-header-left">
        <span class="overview-title">📊 字典概览</span>
        <el-radio-group v-model="typeFilter" size="small">
          <el-radio-button value="wind">风电</el-radio-button>
          <el-radio-button value="solar">光伏</el-radio-button>
          <el-radio-button value="hydro">水电</el-radio-button>
        </el-radio-group>
      </div>
      <div class="overview-header-right">
        <span v-if="lastRefreshTime" class="refresh-time">上次刷新：{{ lastRefreshTime }}</span>
        <el-button size="small" text @click="refreshData" :loading="refreshing">🔄 刷新</el-button>
      </div>
    </div>
    <div class="overview-stats">
      <div class="overview-stat-card">
        <div class="os-icon">📂</div>
        <div class="os-body">
          <div class="os-value" :style="{ color: typeFilter === 'wind' ? '#3b82f6' : '#10b981' }">{{ data.firstClassCount }}</div>
          <div class="os-label">一级类码</div>
        </div>
      </div>
      <div class="overview-stat-card">
        <div class="os-icon">📁</div>
        <div class="os-body">
          <div class="os-value" :style="{ color: typeFilter === 'wind' ? '#3b82f6' : '#10b981' }">{{ data.secondClassCount }}</div>
          <div class="os-label">二级类码</div>
        </div>
      </div>
      <div class="overview-stat-card">
        <div class="os-icon">🗂️</div>
        <div class="os-body">
          <div class="os-value" :style="{ color: typeFilter === 'wind' ? '#3b82f6' : '#10b981' }">{{ data.thirdClassCount }}</div>
          <div class="os-label">三级类码</div>
        </div>
      </div>
      <div class="overview-stat-card">
        <div class="os-icon">📋</div>
        <div class="os-body">
          <div class="os-value" :style="{ color: typeFilter === 'wind' ? '#3b82f6' : '#10b981' }">{{ data.dataCategoryCount }}</div>
          <div class="os-label">数据类码</div>
        </div>
      </div>
      <div class="overview-stat-card">
        <div class="os-icon">🏷️</div>
        <div class="os-body">
          <div class="os-split">
            <span class="os-split-item"><span class="oss-label">集团统一</span><span class="oss-value" style="color: #3b82f6;">{{ data.dataCodeGroup }}</span></span>
            <span class="os-split-divider"></span>
            <span class="os-split-item"><span class="oss-label">手动添加</span><span class="oss-value" style="color: #e6a23c;">{{ data.dataCodeManual }}</span></span>
          </div>
          <div class="os-label">数据码</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import * as statsService from '@/services/statistics';

const STORAGE_KEY = 'DICT_OVERVIEW_CACHE';
const TIME_STORAGE_KEY = 'DICT_OVERVIEW_REFRESH_TIME';

const typeFilter = ref('wind');
const overview = ref({ wind: null as any, solar: null as any, hydro: null as any });
const refreshing = ref(false);
const lastRefreshTime = ref('');

const data = computed(() => {
  const d = typeFilter.value === 'wind' ? overview.value.wind : typeFilter.value === 'solar' ? overview.value.solar : overview.value.hydro;
  return d || { firstClassCount: 0, secondClassCount: 0, thirdClassCount: 0, dataCategoryCount: 0, dataCodeGroup: 0, dataCodeManual: 0 };
});

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function loadFromCache() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      overview.value = JSON.parse(cached);
    }
    lastRefreshTime.value = localStorage.getItem(TIME_STORAGE_KEY) || '';
  } catch {}
}

function saveToCache(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const now = formatTime(Date.now());
    lastRefreshTime.value = now;
    localStorage.setItem(TIME_STORAGE_KEY, now);
  } catch {}
}

/** 手动刷新（从数据库重新统计） */
async function refreshData() {
  refreshing.value = true;
  try {
    const result = await statsService.getDictOverview(true);
    overview.value = result;
    saveToCache(result);
  } catch (err) {
    console.error('[DictOverview] refresh error:', err);
    ElMessage.error('刷新字典概览失败，请稍后重试');
  }
  refreshing.value = false;
}

onMounted(loadFromCache);
</script>

<style scoped>
.overview-section {
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.overview-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-title {
  font-size: 15px;
  font-weight: 600;
}

.overview-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.overview-stats {
  display: flex;
  padding: 16px;
  gap: 12px;
}

.overview-stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fafbff;
  border-radius: 8px;
  border: 1px solid #eef0f6;
  transition: all 0.25s ease;
}

.overview-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.os-icon { font-size: 24px; line-height: 1; }

.os-body { flex: 1; }

.os-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.os-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.os-split {
  display: flex;
  align-items: center;
  gap: 0;
}

.os-split-item { flex: 1; text-align: left; }

.oss-label {
  display: block;
  font-size: 10px;
  color: #909399;
  margin-bottom: 1px;
}

.oss-value { font-size: 18px; font-weight: 700; }

.os-split-divider {
  width: 1px;
  height: 28px;
  background: #e4e7ed;
  margin: 0 8px;
}
</style>
