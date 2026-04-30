<template>
  <el-card class="mb-16">
    <template #header>
      <div class="dict-stats-header">
        <span class="section-title">字典概览</span>
        <el-radio-group v-model="typeFilter" size="small">
          <el-radio-button value="wind">风电</el-radio-button>
          <el-radio-button value="solar">光伏</el-radio-button>
          <el-radio-button value="hydro">水电</el-radio-button>
        </el-radio-group>
        <span v-if="lastRefreshTime" class="refresh-time">上次刷新：{{ lastRefreshTime }}</span>
        <el-button size="small" text class="refresh-btn" @click="refreshData" :loading="refreshing">刷新</el-button>
      </div>
    </template>
    <el-row :gutter="16">
      <el-col :span="5"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">一级类码</div><div class="stat-value" :class="typeFilter === 'wind' ? 'primary' : 'success'">{{ data.firstClassCount }}</div></div></el-card></el-col>
      <el-col :span="5"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">二级类码</div><div class="stat-value" :class="typeFilter === 'wind' ? 'primary' : 'success'">{{ data.secondClassCount }}</div></div></el-card></el-col>
      <el-col :span="5"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">三级类码</div><div class="stat-value" :class="typeFilter === 'wind' ? 'primary' : 'success'">{{ data.thirdClassCount }}</div></div></el-card></el-col>
      <el-col :span="4"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">数据类码</div><div class="stat-value" :class="typeFilter === 'wind' ? 'primary' : 'success'">{{ data.dataCategoryCount }}</div></div></el-card></el-col>
      <el-col :span="5"><el-card shadow="hover"><div class="stat-card"><div class="stat-label">数据码</div><div class="stat-split"><span class="split-item"><span class="split-label">集团统一</span><span class="split-value group">{{ data.dataCodeGroup }}</span></span><span class="split-divider" /><span class="split-item"><span class="split-label">手动添加</span><span class="split-value manual">{{ data.dataCodeManual }}</span></span></div></div></el-card></el-col>
    </el-row>
  </el-card>
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
.mb-16 { margin-bottom: 16px; }
.dict-stats-header { display: flex; align-items: center; gap: 12px; }
.refresh-btn { margin-left: auto; }
.section-title { font-weight: 600; font-size: 15px; }
.refresh-time { font-size: 12px; color: #909399; white-space: nowrap; }
.stat-card { text-align: center; padding: 8px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 6px; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; }
.stat-value.primary { color: #409EFF; }
.stat-value.success { color: #67C23A; }
.stat-split { display: flex; align-items: center; justify-content: center; gap: 0; }
.split-item { flex: 1; text-align: center; }
.split-label { display: block; font-size: 11px; color: #909399; margin-bottom: 2px; }
.split-value { font-size: 22px; font-weight: 700; }
.split-value.group { color: #409EFF; }
.split-value.manual { color: #E6A23C; }
.split-divider { width: 1px; height: 32px; background: #e4e7ed; }
</style>
