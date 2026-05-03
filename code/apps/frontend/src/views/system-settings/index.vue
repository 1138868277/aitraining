<template>
  <div class="system-settings">
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="数据源管理" name="datasource">
          <DatasourceTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DatasourceTab from './datasource-tab.vue';

const activeTab = ref('datasource');
</script>

<style scoped>
.system-settings {
  width: 100%;
}

.main-card {
  min-height: 400px;
}

.main-tabs {
  margin-top: -16px;
}
</style>
