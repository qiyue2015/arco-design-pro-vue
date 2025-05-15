<template>
  <div class="login-container">
    <a-form ref="loginForm" :model="userInfo" :rules="rules" layout="vertical" size="large" @submit-success="handleSubmit">
      <a-form-item field="phone" :validate-trigger="['change', 'blur']" hide-label>
        <a-input v-model="userInfo.phone" placeholder="请输入手机号" allow-clear>
          <template #prefix> +86 </template>
        </a-input>
      </a-form-item>
      <a-form-item field="code" :validate-trigger="['change', 'blur']" hide-label>
        <SmsCodeInput v-model="userInfo.code" :phone="userInfo.phone" />
      </a-form-item>
      <a-form-item hide-label>
        <AgreementNotice type="login" />
      </a-form-item>
      <a-button type="primary" size="large" html-type="submit" long :loading="loading"> 登录 / 注册 </a-button>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useLoading } from '@/hooks';
  import { useUserStore } from '@/store';
  import { useRouter } from 'vue-router';
  import { DEFAULT_ROUTE_NAME } from '@/router/constants';
  import { Message } from '@arco-design/web-vue';
  import AgreementNotice from './AgreementNotice.vue';
  import SmsCodeInput from './SmsCodeInput.vue';

  const { t } = useI18n();
  const { loading, setLoading } = useLoading();
  const userStore = useUserStore();
  const router = useRouter();

  const userInfo = reactive({
    phone: '13888888888',
    code: '1234',
  });

  const rules = {
    phone: [
      { required: true, message: '请输入手机号' },
      {
        required: true,
        validator: (value: string, cb: (arg: string) => void) => {
          return new Promise<void>((resolve) => {
            if (!/^1[3-9]\d{9}$/.test(value)) {
              cb('输入值不是有效电话号码');
            } else {
              resolve();
            }
          });
        },
      },
    ],
    code: [
      { required: true, message: '请输入验证码' },
      { required: true, min: 4, max: 6, message: '验证码长度在 4 到 6 个字符之间' },
    ],
  };

  const loginForm = ref();
  const handleSubmit = async (values: Record<string, any>) => {
    try {
      setLoading(true);
      await userStore.login(values as any);
      const { redirect, ...othersQuery } = router.currentRoute.value.query;
      router.push({
        name: (redirect as string) || DEFAULT_ROUTE_NAME,
        query: { ...othersQuery },
      });
      Message.success(t('login.form.login.success'));
    } catch (err) {
      loginForm.value.setFields({
        password: {
          status: 'error',
          message: (err as Error).message,
        },
      });
    } finally {
      setLoading(false);
    }
  };
</script>

<style lang="less" scoped></style>
