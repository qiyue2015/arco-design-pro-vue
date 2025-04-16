<template>
  <div class="login-container">
    <div class="logo">
      <div class="logo-text">{{ appStore?.app_name }}</div>
    </div>
    <div class="content">
      <div class="content-inner">
        <LoginForm />
      </div>
      <div class="footer">
        <Footer />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAppStore } from '@/store';
  import { useDark } from '@vueuse/core';
  import Footer from '@/components/footer/index.vue';
  import LoginForm from './components/login-form.vue';

  const appStore = useAppStore();

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
</script>

<style lang="less" scoped>
  .login-container {
    background-image: url(assets/images/login-bg.png);
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    display: flex;
    height: 100vh;

    .content {
      position: relative;
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      @apply pb-24;

      &-inner {
        @apply w-full max-w-sm lg:max-w-md;
        padding: 32px;
        background: var(--color-fill-1);
        border-radius: 12px;
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
