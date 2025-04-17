<template>
  <a-modal v-bind="attrs" title="修改密码" title-align="start" @before-ok="onSave" @close="onReset">
    <a-form ref="formRef" :rules="rules" :model="formData" layout="vertical">
      <a-form-item label="原始密码" field="password" required>
        <a-input-password v-model="formData.password" placeholder="请输入原始密码" />
      </a-form-item>
      <a-form-item label="新密码" field="new_password" required>
        <a-input-password v-model="formData.new_password" placeholder="请输入新密码" />
      </a-form-item>
      <a-form-item label="确认密码" field="confirm_password" required>
        <a-input-password v-model="formData.confirm_password" placeholder="请再次输入新密码" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, useAttrs } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useUserStore } from '@/store';
  import { useForm } from '@/hooks';
  import { useRouter } from 'vue-router';

  const attrs = useAttrs();
  const router = useRouter();
  const userStore = useUserStore();

  const formRef = ref();
  const { formData, resetForm } = useForm({
    password: '',
    new_password: '',
    confirm_password: '',
  });

  const rules = {
    password: [
      { required: true, message: '请输入原始密码' },
      { min: 6, max: 20, message: '密码长度在6-20个字符之间' },
    ],
    new_password: [
      { required: true, message: '请输入新密码' },
      { min: 6, max: 20, message: '密码长度在6-20个字符之间' },
      {
        validator: (value: string, cb: (error?: string) => void) => {
          if (value === formData.password) {
            cb('新密码不能与原始密码相同');
          } else {
            cb();
          }
        },
      },
      {
        message: '至少包含数字、大写字母、小写字母或特殊字符其中三种',
        validator: (value: string, cb: (error?: string) => void) => {
          const reg =
            /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])|(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])|(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]))[A-Za-z\d@$!%*?&]{6,20}$/;
          if (!reg.test(value)) {
            cb('密码至少包含数字、大写字母、小写字母和特殊字符中的三种');
          } else {
            cb();
          }
        },
      },
    ],
    confirm_password: [
      { required: true, message: '请再次输入新密码' },
      {
        validator: (value: string, cb: (error?: string) => void) => {
          if (value !== formData.new_password) {
            cb('两次输入的密码不一致');
          } else {
            cb();
          }
        },
      },
    ],
  };

  const onSave = async () => {
    try {
      if (await formRef.value.validate()) {
        return false;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });

      Message.success({
        content: '修改成功，请重新登录',
        duration: 2000,
        onClose: () => {
          userStore.logout();
          const currentRoute = router.currentRoute.value;
          router.push({
            name: 'login',
            query: {
              ...router.currentRoute.value.query,
              redirect: currentRoute.name as string,
            },
          });
        },
      });
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error during form validation:', error);
      return false;
    }
  };

  const onReset = () => {
    formRef.value?.resetFields();
    resetForm();
  };
</script>
