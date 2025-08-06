<template>
  <div class="auth-container">
    <div class="logo">
      <div class="logo-text">{{ appStore?.app_name }}</div>
    </div>
    <div class="content">
      <div class="content-inner flex flex-col">
        <div class="auth-title font-brand">欢迎使用 {{ appStore?.app_name }}</div>
        <!-- 登录 -->
        <template v-if="$route.name === 'login'">
          <Login v-model:login-type="loginType" />
          <div class="text-center text-sm">
            <a-divider> 其他登录方式 </a-divider>
            <a-space size="large" class="mt-4">
              <icon-wechat size="32px" style="color: #1aad19" />
              <icon-google size="28px" style="color: #4285f4" />
              <icon-github size="26px" />
            </a-space>
            <div v-if="loginType === 'password'" class="mt-10">
              没有账号？ <a-link class="text-sm" @click="onRegister">现在就注册</a-link>
            </div>
          </div>
        </template>

        <!-- 注册 -->
        <template v-else-if="$route.name === 'register'">
          <Register v-model:register-type="registerType" />
          <div class="text-center text-sm"> 已有账号？ <a-link class="text-sm" @click="onLogin">立即登录</a-link> </div>
        </template>
      </div>
    </div>
    <div class="footer">
      <Footer />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useAppStore } from '@/store';
  import { useDark } from '@vueuse/core';
  import Footer from '@/components/footer/index.vue';
  import { useRouter } from 'vue-router';
  import Login from './login.vue';
  import Register from './register.vue';

  const appStore = useAppStore();
  const router = useRouter();

  useDark({
    selector: 'body',
    attribute: 'arco-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'arco-theme',
    onChanged(dark: boolean) {
      appStore.toggleTheme(dark);
    },
  });

  // 登录方式
  const loginType = ref<'password' | 'phone'>('password');

  // 注册方式
  const registerType = ref<'password' | 'phone'>('phone');

  const onLogin = () => {
    loginType.value = 'phone';
    router.push({ name: 'login' });
  };

  const onRegister = () => {
    registerType.value = 'phone';
    router.push({ name: 'register' });
  };
</script>

<style lang="less" scoped>
  .auth-container {
    background-image: url(assets/images/login-bg.png);
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    height: 100vh;

    .auth-title {
      @apply font-bold;
      @apply text-left;
      color: var(--color-text-1);
    }

    .content {
      @apply relative flex flex-1 items-center justify-center m-6 md:m-0;

      &-inner {
        @apply w-full p-6 lg:p-10;
        background: var(--color-bg-white);
        border-radius: 12px;
        max-width: 500px;
        height: 620px;
        overflow: hidden;
      }
    }

    .footer {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 100%;
    }
  }

  .logo {
    position: fixed;
    top: 24px;
    left: 22px;
    z-index: 1;
    display: inline-flex;
    align-items: center;

    &-text {
      margin-right: 4px;
      margin-left: 4px;
      // color: var(--color-fill-1);
      color: var(--color-text-1);
      font-size: 20px;
      font-family: '钉钉进步体 Regular', sans-serif;
    }
  }

  body[arco-theme='dark'] {
    .login-container {
      background: var(--color-fill-2);
    }
  }
</style>
