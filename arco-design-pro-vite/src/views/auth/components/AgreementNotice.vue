<template>
  <div class="text-sm">
    <template v-if="attrs.type === 'register'">
      <a-space size="mini" fill>
        <a-checkbox v-bind="{ ...attrs }" class="text-sm">点击开始体验代表已阅读并同意</a-checkbox>
        <a href="/user-agreement" class="text-link" target="_blank">《服务协议》</a>
        <a href="/user-agreement" class="text-link" target="_blank">《隐私政策》</a>
      </a-space>
    </template>
    <template v-else>
      <span>登录视为您已阅读并同意</span>
      <a href="/user-agreement" class="text-link" target="_blank">《服务协议》</a>
      <a href="/user-agreement" class="text-link" target="_blank">《隐私政策》</a>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { useAttrs } from 'vue';

  const attrs = useAttrs();
</script>
