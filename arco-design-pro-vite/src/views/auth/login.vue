<template>
  <a-tabs class="login-tab" :active-key="loginType" @change="onTabChange">
    <a-tab-pane key="password" title="账号登录">
      <PasswordLoginForm />
    </a-tab-pane>
    <a-tab-pane key="phone" title="手机号登录">
      <PhoneLoginForm />
    </a-tab-pane>
    <a-tab-pane key="mail" title="邮箱登录">
      <MailLoginForm />
    </a-tab-pane>
  </a-tabs>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import PhoneLoginForm from './components/PhoneLoginForm.vue';
  import PasswordLoginForm from './components/PasswordLoginForm.vue';
  import MailLoginForm from './components/MailLoginForm.vue';

  type LoginType = 'password' | 'phone' | 'mail';

  const props = defineProps<{ loginType: LoginType }>();
  const emits = defineEmits<{
    (event: 'update:loginType', value: LoginType): void;
  }>();

  const loginType = computed(() => props.loginType);

  function onTabChange(key: string | number) {
    if (key === 'password' || key === 'phone' || key === 'mail') {
      emits('update:loginType', key);
    }
  }
</script>

<style lang="less" scoped>
  .login-tab {
    /* @apply mt-8 flex-1; */
    margin-top: 2rem;
    flex: 1;

    :deep(.arco-tabs-nav) {
      &:before {
        display: none;
      }
    }

    :deep(.arco-tabs-tab) {
      margin: 0;
      + .arco-tabs-tab {
        margin-left: 32px;
      }
      &:hover {
        .arco-tabs-tab-title::before {
          background: none;
        }
      }
    }
  }
</style>
