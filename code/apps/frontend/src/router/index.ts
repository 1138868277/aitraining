import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/code-generate',
  },
  {
    path: '/code-generate',
    name: 'CodeGenerate',
    component: () => import('@/views/code-generate/index.vue'),
    meta: { title: '编码生成' },
  },
  {
    path: '/code-validate',
    name: 'CodeValidate',
    component: () => import('@/views/code-validate/index.vue'),
    meta: { title: '编码校验' },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/statistics/index.vue'),
    meta: { title: '统计分析' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
