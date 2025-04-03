<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { FormInstance } from '@arco-design/web-vue';
  import useLoading from '@/hooks/loading';
  import { queryArticle } from '@/api/article';

  const { loading, setLoading } = useLoading(true);
  const formRef = ref<FormInstance>();
  const formData = ref({
    title: '',
    description: '',
    content: '',
  });

  onMounted(() => {
    queryArticle('9f0B98B6-5E8F-EBe5-F37B-5Bd608b74e38').then((res) => {
      formData.value = res.data;
      setLoading(false);
    });
  });
</script>

<template>
  <div class="container">
    <Breadcrumb :items="['menu.form', 'menu.form.group']" />
    <a-row :gutter="[16, 16]">
      <a-col :span="14">
        <a-form ref="formRef" layout="vertical" :model="formData">
          <a-space direction="vertical" :size="16">
            <a-card :loading="loading" class="general-card" title="Tiptap">
              <a-form-item label="标题" field="title" required>
                <a-input v-model="formData.title" placeholder="请填写标题" />
              </a-form-item>
              <a-form-item label="简介" field="description">
                <a-textarea v-model="formData.description" placeholder="请填写简介" />
              </a-form-item>
              <a-form-item label="内容" field="content" required>
                <Tiptap v-model="formData.content" placeholder="请填写内容" />
              </a-form-item>
            </a-card>
          </a-space>
        </a-form>
      </a-col>
      <a-col :span="10">
        <a-card :bordered="false">
          <pre>{{ formData }}</pre>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped lang="less">
  .container {
    padding: 0 20px 40px 20px;
    overflow: hidden;
  }
</style>
