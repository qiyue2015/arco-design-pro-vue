<template>
  <a-tabs class="register-tab" :active-key="registerType" @change="onTabChange">
    <a-tab-pane key="phone" title="手机号注册">
      <PhoneRegisterForm />
    </a-tab-pane>
    <a-tab-pane key="password" title="账号注册">
      <PasswordRegisterForm />
    </a-tab-pane>
  </a-tabs>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import PhoneRegisterForm from './components/PhoneRegisterForm.vue';
  import PasswordRegisterForm from './components/PasswordRegisterForm.vue';

  const props = defineProps<{ registerType: 'phone' | 'password' }>();
  const emits = defineEmits(['update:registerType']);

  const registerType = computed(() => props.registerType);

  function onTabChange(key: string) {
    emits('update:registerType', key as 'phone' | 'password');
  }
</script>

<style lang="less" scoped>
  .register-tab {
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
