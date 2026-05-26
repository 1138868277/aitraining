import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    redirect: '/code-generate',
  },
  {
    path: '/code-generate',
    name: 'CodeGenerate',
    component: () => import('@/views/code-generate/index.vue'),
    meta: { title: '编码创建', requiresAuth: true },
  },
  {
    path: '/code-verify',
    name: 'CodeVerify',
    component: () => import('@/views/code-verify/index.vue'),
    meta: { title: '编码维护', requiresAuth: true },
  },
  {
    path: '/code-validate',
    name: 'CodeValidate',
    component: () => import('@/views/code-validate/index.vue'),
    meta: { title: '字典管理', requiresAuth: true },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/statistics/index.vue'),
    meta: { title: '编码看板', requiresAuth: true },
  },
  {
    path: '/system-settings',
    name: 'SystemSettings',
    component: () => import('@/views/system-settings/index.vue'),
    meta: { title: '系统配置', requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const user = JSON.parse(localStorage.getItem('auth_user') || 'null');
  if (to.meta.requiresAuth && !user) {
    next('/login');
  } else if (to.path === '/login' && user) {
    next('/code-generate');
  } else {
    next();
  }
});

export default router;
