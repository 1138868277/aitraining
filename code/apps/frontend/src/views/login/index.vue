<template>
  <div class="login-page">
    <canvas ref="canvasRef" class="bg-canvas"></canvas>

    <div class="login-card">
      <div class="login-header">
        <img src="/logo.png" class="login-logo" alt="logo">
        <div class="login-title">华电新能源编码管理平台</div>
        <div class="login-subtitle">请登录以继续</div>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
        <div v-if="error" class="login-error">{{ error }}</div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '@/stores/auth';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const error = ref('');

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

// Canvas 粒子网络动画
const canvasRef = ref<HTMLCanvasElement>();
let animId: number;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
}

onMounted(() => {
  const canvas = canvasRef.value!;
  const ctx = canvas.getContext('2d')!;
  let w = window.innerWidth;
  let h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;

  const particles: Particle[] = [];
  const count = Math.min(80, Math.floor(w * h / 12000));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 1 + Math.random() * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // 画连接线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.06 * (1 - dist / 180)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // 画粒子
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(96, 165, 250, ${0.2 + p.size * 0.1})`;
      ctx.fill();
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  };
  window.addEventListener('resize', resize);
  onUnmounted(() => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  });
});

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  error.value = '';
  try {
    const success = await auth.login(form.username, form.password);
    if (success) {
      router.replace('/code-generate');
    } else {
      error.value = '用户名或密码错误';
    }
  } catch {
    error.value = '登录失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #060b18 0%, #0a1628 50%, #0d1b36 100%);
  position: relative;
  overflow: hidden;
}

.bg-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* 四个角的数据角标 */
.login-page::before {
  content: 'SYS::ENC-MGMT v2.1 /// 编码管理平台 /// 华电新能源';
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(96, 165, 250, 0.15);
  letter-spacing: 2px;
  z-index: 0;
  pointer-events: none;
  white-space: nowrap;
}

.login-card {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  border-radius: 8px;
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-top: 6px;
}

.login-form { margin-top: 8px; }

.login-form :deep(.el-input__wrapper) {
  padding: 4px 12px;
  border-radius: 8px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  letter-spacing: 2px;
}

.login-error {
  text-align: center;
  color: #f56c6c;
  font-size: 13px;
  margin-top: -8px;
}
</style>
