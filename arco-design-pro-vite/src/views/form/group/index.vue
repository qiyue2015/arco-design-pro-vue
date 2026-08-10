<template>
  <div class="container">
    <Breadcrumb :items="['menu.form', 'menu.form.group']" />
    <a-form ref="formRef" layout="vertical" :model="formData">
      <a-space direction="vertical" :size="16">
        <a-card class="general-card">
          <template #title>
            {{ $t('groupForm.title.video') }}
          </template>
          <a-row :gutter="80">
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.mode')" field="video.mode">
                <a-select :placeholder="$t('groupForm.placeholder.video.mode')">
                  <a-option value="custom">自定义</a-option>
                  <a-option value="mode1">模式1</a-option>
                  <a-option value="mode2">模式2</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item
                :label="$t('groupForm.form.label.video.acquisition.resolution')"
                field="video.acquisition.resolution"
              >
                <a-select :placeholder="$t('groupForm.placeholder.video.acquisition.resolution')">
                  <a-option value="resolution1">分辨率1</a-option>
                  <a-option value="resolution2">分辨率2</a-option>
                  <a-option value="resolution3">分辨率3</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.acquisition.frameRate')" field="video.acquisition.frameRate">
                <a-input :placeholder="$t('groupForm.placeholder.video.acquisition.frameRate')">
                  <template #append> fps </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="80">
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.resolution')" field="video.encoding.resolution">
                <a-select :placeholder="$t('groupForm.placeholder.video.encoding.resolution')">
                  <a-option value="resolution1">分辨率1</a-option>
                  <a-option value="resolution2">分辨率2</a-option>
                  <a-option value="resolution3">分辨率3</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.rate.min')" field="video.encoding.rate.min">
                <a-input :placeholder="$t('groupForm.placeholder.video.encoding.rate.min')" add-after="bps">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.rate.max')" field="video.encoding.rate.max">
                <a-input :placeholder="$t('groupForm.placeholder.video.encoding.rate.max')">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="80">
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.rate.default')" field="video.encoding.rate.default">
                <a-input :placeholder="$t('groupForm.placeholder.video.encoding.rate.default')">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.frameRate')" field="video.encoding.frameRate">
                <a-input :placeholder="$t('groupForm.placeholder.video.encoding.frameRate')">
                  <template #append> fps </template>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.video.encoding.profile')" field="video.encoding.profile">
                <a-input :placeholder="$t('groupForm.placeholder.video.encoding.profile')">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
        <a-card class="general-card">
          <template #title>
            {{ $t('groupForm.title.audio') }}
          </template>
          <a-row :gutter="80">
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.audio.mode')" field="audio.mode">
                <a-select :placeholder="$t('groupForm.placeholder.audio.mode')">
                  <a-option value="custom">自定义</a-option>
                  <a-option value="mode1">模式1</a-option>
                  <a-option value="mode2">模式2</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.audio.acquisition.channels')" field="audio.acquisition.channels">
                <a-select :placeholder="$t('groupForm.placeholder.audio.acquisition.channels')">
                  <a-option value="1">1</a-option>
                  <a-option value="2">2</a-option>
                  <a-option value="3">3</a-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.audio.encoding.channels')" field="audio.encoding.channels">
                <a-input :placeholder="$t('groupForm.placeholder.audio.encoding.channels')">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="80">
            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.audio.encoding.rate')" field="audio.encoding.rate">
                <a-input :placeholder="$t('groupForm.placeholder.audio.encoding.rate')">
                  <template #append> bps </template>
                </a-input>
              </a-form-item>
            </a-col>

            <a-col :span="8">
              <a-form-item :label="$t('groupForm.form.label.audio.encoding.profile')" field="audio.encoding.profile">
                <a-input :placeholder="$t('groupForm.placeholder.audio.encoding.profile')">
                  <template #append> fps </template>
                </a-input>
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
        <a-card class="general-card" :title="$t('groupForm.title.assets')">
          <a-row :gutter="80">
            <a-col :xs="24" :md="12" :xl="6">
              <a-form-item :label="$t('groupForm.form.label.icon')" field="icon">
                <AIconPicker v-model="formData.icon" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12" :xl="6">
              <a-form-item :label="$t('groupForm.form.label.cover')" field="cover">
                <AMediaPicker
                  v-model="formData.cover"
                  media-type="image"
                  :service="mediaLibraryAdapter"
                  :can-upload="true"
                  :show-file-list="false"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12" :xl="6">
              <a-form-item :label="$t('groupForm.form.label.gallery')" field="photos">
                <AMediaPicker
                  v-model="formData.photos"
                  media-type="image"
                  multiple
                  :limit="2"
                  :service="mediaLibraryAdapter"
                  :can-upload="true"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12" :xl="6">
              <a-form-item :label="$t('groupForm.form.label.banner')" field="banner">
                <AMediaPicker
                  v-model="formData.banner"
                  media-type="image"
                  multiple
                  :limit="2"
                  :service="mediaLibraryAdapter"
                  :can-upload="true"
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>
        <a-card class="general-card" :bordered="false">
          <template #title>
            {{ $t('groupForm.title.description') }}
          </template>
          <a-form-item :label="$t('groupForm.form.label.parameterDescription')" field="audio.approvers">
            <a-textarea :placeholder="$t('groupForm.placeholder.description')" />
          </a-form-item>
        </a-card>
      </a-space>
      <div class="actions">
        <a-space>
          <a-button>
            {{ $t('groupForm.reset') }}
          </a-button>
          <a-button type="primary" :loading="loading" @click="onSubmitClick">
            {{ $t('groupForm.submit') }}
          </a-button>
        </a-space>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { FormInstance } from '@arco-design/web-vue';
  import { AIconPicker, AMediaPicker } from '@admin9-labs/admin9-ui';
  import type { MediaItem } from '@admin9-labs/admin9-ui';
  import useLoading from '@/hooks/loading';
  import mediaLibraryAdapter from '@/api/media';

  const formData = ref<{
    icon: string;
    cover?: MediaItem;
    photos: MediaItem[];
    banner: MediaItem[];
  }>({
    icon: '',
    photos: [],
    banner: [],
  });
  const formRef = ref<FormInstance>();
  const { loading, setLoading } = useLoading();
  const onSubmitClick = async () => {
    const res = await formRef.value?.validate();
    if (!res) {
      setLoading(true);
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
</script>

<script lang="ts">
  export default {
    name: 'Group',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 40px 20px;
    overflow: hidden;
  }

  .actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60px;
    padding: 14px 20px 14px 0;
    background: var(--color-bg-2);
    text-align: right;
  }
</style>
