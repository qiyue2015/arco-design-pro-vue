<template>
  <div class="login-container">
    <a-form ref="loginForm" :model="userInfo" :rules="rules" layout="vertical" size="large" @submit-success="handleSubmit">
      <a-form-item field="email" :validate-trigger="['change', 'blur']" hide-label>
        <a-input v-model="userInfo.email" type="email" placeholder="邮箱地址" allow-clear />
      </a-form-item>
      <a-form-item field="code" :validate-trigger="['change', 'blur']" hide-label>
        <InputVerifyCode v-model="userInfo.code" :account="userInfo.email" type="email" />
      </a-form-item>
      <a-form-item hide-label>
        <AgreementNotice type="login" />
      </a-form-item>
      <a-button type="primary" size="large" html-type="submit" long :loading="loading"> 登录 </a-button>
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
  import InputVerifyCode from '@/components/input-verify-code/index.vue';
  import AgreementNotice from './AgreementNotice.vue';

  const { t } = useI18n();
  const { loading, setLoading } = useLoading();
  const userStore = useUserStore();
  const router = useRouter();

  const userInfo = reactive({
    email: 'fengqiyue@gmail.com',
    code: '1234',
  });

  const rules = {
    email: [
      {
        required: true,
        type: 'email',
        message: '请输入正确的邮箱地址',
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
