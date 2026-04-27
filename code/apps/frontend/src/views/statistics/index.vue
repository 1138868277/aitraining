<template>
  <div class="statistics-page">
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="编码生成统计" name="codeGen">
          <CodeGenTab />
        </el-tab-pane>
        <el-tab-pane label="全量测点统计" name="measure">
          <MeasureTab />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeGenTab from './code-gen-tab.vue';
import MeasureTab from './measure-tab.vue';

const activeTab = ref('codeGen');
</script>

<style scoped>
.statistics-page {
  width: 100%;
}

.main-card {
  min-height: 500px;
}

.main-tabs {
  margin-top: -16px;
}
</style>
