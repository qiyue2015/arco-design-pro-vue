<template>
  <a-card v-bind="{ ...attrs }">
    <div class="flex flex-col md:flex-row items-center gap-4">
      <div class="w-32 text-center">
        <a-upload
          :file-list="[file]"
          :show-file-list="false"
          :action="uploadAction"
          :headers="{ Authorization: `Bearer ${token}` }"
          list-type="picture-card"
          @change="onChange"
          @success="onSuccess"
          @progress="onProgress"
        >
          <template #upload-button>
            <a-avatar :size="84" class="info-avatar" object-fit="cover">
              <template #trigger-icon>
                <icon-camera />
              </template>
              <img v-if="file.url" :src="file.url" />
            </a-avatar>
          </template>
        </a-upload>
      </div>
      <div class="flex-1">
        <a-descriptions :column="1" class="pt-[8px]">
          <a-descriptions-item label="昵称">
            {{ userInfo.nickname || '未设定昵称' }}
          </a-descriptions-item>
          <a-descriptions-item label="个人签名">
            {{ userInfo.introduce || '未设定签名' }}
          </a-descriptions-item>
          <a-descriptions-item label="账号ID">
            <a-typography-paragraph class="!m-0" copyable> {{ userInfo.id }} </a-typography-paragraph>
          </a-descriptions-item>
        </a-descriptions>
      </div>
      <!-- simple -->
      <a-button type="primary" @click="$router.push({ name: 'Authentication' })">实名认证</a-button>
      <!-- simple end -->
      <a-button type="outline" @click="onEditAccountInfo">编辑资料</a-button>
    </div>

    <EditAccountInfoModal ref="EditAccountInfoModalRef" />
  </a-card>
</template>

<script lang="ts" setup>
  import { computed, ref, useAttrs } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FileItem } from '@arco-design/web-vue';
  import { useUserStore } from '@/store';
  import { getToken } from '@/utils/auth';
  import EditAccountInfoModal from './EditAccountInfoModal.vue';

  const attrs = useAttrs();

  const token = getToken();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  const uploadAction = `${apiBaseUrl.replace(/\/$/, '')}/user/upload-avatar`;
  const userStore = useUserStore();
  const userInfo = computed(() => userStore.userInfo);
  const file = ref<FileItem>({ uid: '-2', name: 'avatar.png', url: userInfo.value.avatar });

  interface AvatarUploadResponse {
    code: number;
    message: string;
    data: {
      url: string;
    };
  }

  const parseUploadResponse = (value: unknown): AvatarUploadResponse | undefined => {
    let response: unknown = value;
    if (typeof value === 'string') {
      try {
        response = JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof response.code === 'number' &&
      'message' in response &&
      typeof response.message === 'string' &&
      'data' in response &&
      typeof response.data === 'object' &&
      response.data !== null &&
      'url' in response.data &&
      typeof response.data.url === 'string'
    ) {
      return {
        code: response.code,
        message: response.message,
        data: {
          url: response.data.url,
        },
      };
    }
    return undefined;
  };

  const onChange = (_fileItemList: FileItem[], fileItem: FileItem) => {
    file.value = fileItem;
  };

  const onProgress = (currentFile: FileItem) => {
    file.value = currentFile;
  };

  const onSuccess = async (currentFile: FileItem) => {
    file.value = currentFile;
    const response = parseUploadResponse(currentFile.response);
    if (!response) {
      return;
    }
    const { code, message, data } = response;
    if (code === 0) {
      file.value.url = data.url;
      userStore.info();
      Message.success('头像上传成功');
    } else {
      Message.error(message);
    }
  };

  // 修改昵称
  const EditAccountInfoModalRef = ref<InstanceType<typeof EditAccountInfoModal>>();
  const onEditAccountInfo = () => {
    EditAccountInfoModalRef.value?.onEdit();
  };
</script>
