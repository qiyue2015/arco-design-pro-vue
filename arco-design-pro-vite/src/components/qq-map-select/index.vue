<script setup lang="ts">
  import { computed, reactive, ref } from 'vue';
  import { CascaderOption, Message } from '@arco-design/web-vue';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import { jsonp } from 'vue-jsonp';
  import { useLoading, useVisible } from '@/hooks';

  const emits = defineEmits(['update:modelValue', 'change']);

  const props = defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    appKey: {
      type: String,
      default: '',
    },
  });

  const isConfigured = computed(() => Boolean(props.appKey.trim()));
  const mapErrorMessage = '腾讯地图服务暂时不可用';

  const getAppKey = () => {
    const appKey = props.appKey.trim();
    if (!appKey) throw new Error('Tencent Maps key is not configured');
    return appKey;
  };

  const assertSuccessfulResponse = (response: any) => {
    if (!response || response.status !== 0) {
      throw new Error(response?.message || mapErrorMessage);
    }
    return response;
  };

  /**
   * jsonp 获取省市区 district
   */
  const getDistrict = async () => {
    const cacheKey = 'qq-map-district';
    const areaData = localStorage.getItem(cacheKey);
    if (areaData) {
      try {
        return JSON.parse(areaData);
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    const response = assertSuccessfulResponse(
      await jsonp('https://apis.map.qq.com/ws/district/v1/list', {
        key: getAppKey(),
        output: 'jsonp',
      })
    );
    localStorage.setItem(cacheKey, JSON.stringify(response));
    return response;
  };

  /**
   * jsonp 获取当前位置
   * https://lbs.qq.com/dev/console/demo-center
   */
  const getCurrentPosition = () => {
    return jsonp('https://apis.map.qq.com/ws/location/v1/ip', {
      key: getAppKey(),
      output: 'jsonp',
    });
  };

  /**
   * 关键词输入提示
   * https://lbs.qq.com/service/webService/webServiceGuide/search/webServiceSuggestion
   */
  const getPlaceSuggestions = (param: any) => {
    return jsonp('https://apis.map.qq.com/ws/place/v1/suggestion', {
      ...param,
      key: getAppKey(),
      region_fix: 1,
      policy: 1,
      output: 'jsonp',
    });
  };

  const columns = computed<TableColumnData[]>(() => [
    { title: '序号', slotName: 'index', width: 60, align: 'center', fixed: 'left' },
    { title: '地址', slotName: 'title', ellipsis: true, tooltip: true },
    { title: '选择', slotName: 'operate', width: 100, fixed: 'right' },
  ]);

  const cascaderLoading = ref(false);
  const cascaderOptions = ref<CascaderOption[]>([]);
  const initCascaderData = async () => {
    if (cascaderOptions.value.length > 0) return;

    try {
      cascaderLoading.value = true;
      const response = await getDistrict();
      const [provinceData, cityData, districtData] = response.result || [];
      if (![provinceData, cityData, districtData].every(Array.isArray)) {
        throw new Error('Invalid Tencent Maps district response');
      }
      cascaderOptions.value = provinceData.map((row: any) => {
        const children: CascaderOption[] = [];
        for (let i = row.cidx[0]; i <= row.cidx[1]; i += 1) {
          // 城市代码，取前4位
          const cityCode = cityData[i].id.toString().slice(0, 4);

          // 遍历区县根据城市代码前置4位匹配
          const districtChildren = districtData
            .filter((city: any) => {
              return city.id.toString().startsWith(cityCode);
            })
            .map((city: any) => ({
              label: city.fullname,
              value: city.id,
            }));

          if (districtChildren.length === 0) {
            // 没有区县的城市
            children.push({
              label: cityData[i].fullname,
              value: cityData[i].id,
            });
          } else {
            // 有区县的城市
            children.push({
              label: cityData[i].fullname,
              value: cityData[i].id,
              children: districtChildren,
            });
          }
        }
        return {
          label: row.fullname,
          value: row.id,
          children,
        };
      });
    } catch {
      cascaderOptions.value = [];
      Message.error(mapErrorMessage);
    } finally {
      cascaderLoading.value = false;
    }
  };

  const { loading, setLoading } = useLoading(false);
  const { visible, setVisible } = useVisible(false);

  const location = ref<string>(props.modelValue);
  const formData = ref<any>({ keyword: '', region: '' });
  const query = reactive({ page_index: 1, page_size: 20 });
  const pagination = reactive({ current: query.page_index, pageSize: query.page_size, total: 0, showTotal: true });
  const addressList = ref<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, count } = assertSuccessfulResponse(await getPlaceSuggestions({ ...query, ...formData.value }));
      if (!Array.isArray(data) || typeof count !== 'number') {
        throw new Error('Invalid Tencent Maps suggestion response');
      }
      pagination.total = count;
      addressList.value = data;
    } catch {
      pagination.total = 0;
      addressList.value = [];
      Message.error(mapErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (page: number) => {
    query.page_index = page;
    pagination.current = page;
    fetchData();
  };

  const onSelect = (record: any) => {
    location.value = `${record.location.lat},${record.location.lng}`;
    emits('update:modelValue', `${record.location.lat},${record.location.lng}`);
    emits('change', record);
    setVisible(false);
  };

  const openModal = async () => {
    if (!isConfigured.value) return;

    setVisible(true);
    try {
      const { result } = assertSuccessfulResponse(await getCurrentPosition());
      formData.value.region = result?.ad_info?.district || '';
      formData.value.areaCode = result?.ad_info?.adcode ? String(result.ad_info.adcode) : '';
    } catch {
      Message.error(mapErrorMessage);
    }
    await initCascaderData();
  };
</script>

<template>
  <div class="qq-map-container">
    <a-input-search
      v-model="location"
      :placeholder="isConfigured ? '请从地图选择坐标' : '未配置腾讯地图 Key'"
      button-text="选择"
      :disabled="!isConfigured"
      search-button
      readonly
      @search="openModal"
    />
    <a-modal v-model:visible="visible" :footer="false" width="680px" title-align="start" title="选择坐标">
      <a-space direction="vertical" size="medium" fill>
        <a-row :gutter="10">
          <a-col :span="10">
            <a-cascader
              v-model="formData.areaCode"
              :loading="cascaderLoading"
              :options="cascaderOptions"
              style="width: 100%"
              expand-child
              allow-clear
              placeholder="请选择区域"
            />
          </a-col>
          <a-col :span="14">
            <a-input-search
              v-model="formData.keyword"
              :loading="loading"
              allow-clear
              placeholder="请输入地址搜索详细地址及坐标"
              style="width: 100%"
              search-button
              button-text="搜索"
              @search="fetchData"
            />
          </a-col>
        </a-row>
        <a-table
          :loading="loading"
          :columns="columns"
          :data="addressList"
          :pagination="pagination"
          :virtual-list-props="{ height: 300 }"
          size="small"
          stripe
          @page-change="onPageChange"
        >
          <template #index="{ rowIndex }">
            <div style="width: 30px; text-align: center">{{ rowIndex + 1 }}</div>
          </template>
          <template #title="{ record }">
            <div style="color: var(--color-text-1)">{{ record.title }}</div>
            <div style="color: var(--color-text-3)">{{ record.address }}</div>
            <div style="color: var(--color-text-3)">{{ record.location.lat }}, {{ record.location.lng }}</div>
          </template>
          <template #operate="{ record }">
            <a-button type="text" size="small" @click="onSelect(record)">选择</a-button>
          </template>
        </a-table>
      </a-space>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
  .qq-map-container {
    width: 100%;
  }

  :deep(.arco-empty) {
    padding: 106px 0;
  }
</style>
