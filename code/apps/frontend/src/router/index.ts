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
    meta: { title: '编码创建' },
  },
  {
    path: '/code-verify',
    name: 'CodeVerify',
    component: () => import('@/views/code-verify/index.vue'),
    meta: { title: '编码维护' },
  },
  {
    path: '/code-validate',
    name: 'CodeValidate',
    component: () => import('@/views/code-validate/index.vue'),
    meta: { title: '字典管理' },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/statistics/index.vue'),
    meta: { title: '编码看板' },
  },
  {
    path: '/system-settings',
    name: 'SystemSettings',
    component: () => import('@/views/system-settings/index.vue'),
    meta: { title: '系统配置' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
