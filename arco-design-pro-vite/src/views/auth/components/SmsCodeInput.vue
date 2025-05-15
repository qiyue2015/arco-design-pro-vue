<template>
  <a-input-group class="w-full">
    <a-input v-bind="{ ...attrs }" placeholder="请输入验证码" maxlength="6" />
    <a-button :disabled="!canSendSmsCode" class="w-36" @click="handleSendSmsCode">
      {{ smsSending ? smsCountdown + 's' : '获取验证码' }}
    </a-button>
  </a-input-group>
</template>

<script lang="ts" setup>
  import { Message } from '@arco-design/web-vue';
  import { ref, useAttrs, defineProps, computed } from 'vue';

  const props = defineProps<{ phone: string }>();
  const attrs = useAttrs();

  const smsSending = ref(false);
  const smsCountdown = ref(60);

  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 利用计算属性来判断是否可以发送验证码
  const canSendSmsCode = computed(() => {
    return !smsSending.value && isValidPhone(props.phone);
  });

  const handleSendSmsCode = () => {
    if (!props.phone) {
      Message.error('请先输入手机号');
      return;
    }
    if (!isValidPhone(props.phone)) {
      Message.error('请输入正确的手机号');
      return;
    }
    if (smsSending.value) return;
    smsSending.value = true;
    smsCountdown.value = 60;

    const interval = setInterval(() => {
      if (smsCountdown.value > 0) {
        smsCountdown.value -= 1;
      } else {
        clearInterval(interval);
        smsSending.value = false;
      }
    }, 1000);
  };
</script>
