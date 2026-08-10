<script setup lang="ts">
  import { ref } from 'vue';
  import { AMediaLibrary } from '@admin9-labs/admin9-ui';
  import type { MediaType } from '@admin9-labs/admin9-ui';
  import mediaLibraryAdapter from '@/api/media';

  const activeType = ref<MediaType>('image');
</script>

<template>
  <div class="container">
    <Breadcrumb :items="['menu.list', 'menu.list.mediaLibrary']" />
    <a-card class="general-card" :bordered="false">
      <a-tabs v-model:active-key="activeType" lazy-load>
        <a-tab-pane key="image" :title="$t('mediaLibrary.type.image')" />
        <a-tab-pane key="video" :title="$t('mediaLibrary.type.video')" />
        <a-tab-pane key="audio" :title="$t('mediaLibrary.type.audio')" />
      </a-tabs>
      <AMediaLibrary :key="activeType" :media-type="activeType" :service="mediaLibraryAdapter" :page-size="12" />
    </a-card>
  </div>
</template>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px;
  }
</style>
