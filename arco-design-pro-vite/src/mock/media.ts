import Mock from 'mockjs';
import qs from 'query-string';
import type { MediaGroup, MediaItem, MediaType } from '@admin9-labs/admin9-ui';
import loginBackground from '@/assets/images/login-bg.png';
import setupMock, { successPaginationResponseWrap, successResponseWrap } from '@/utils/setup-mock';
import type { MockParams } from '@/types/mock';

interface StoredGroup extends MediaGroup {
  mediaType: MediaType;
}

interface MutationBody {
  ids?: string[];
  mediaType?: MediaType;
  groupId?: string | null;
  name?: string;
}

const videoUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const audioUrl = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
const ungroupedValue = '__ungrouped__';
let sequence = 100;

const imageGroupIdFor = (index: number) => {
  if (index % 3 === 0) return null;
  return index % 2 === 0 ? 'image-content' : 'image-brand';
};

const mimeFor = (mediaType: MediaType) => {
  if (mediaType === 'image') return 'image/png';
  if (mediaType === 'video') return 'video/mp4';
  return 'audio/mpeg';
};

const groups: StoredGroup[] = [
  { id: 'image-brand', name: '品牌素材', mediaType: 'image' },
  { id: 'image-content', name: '内容配图', mediaType: 'image' },
  { id: 'video-promo', name: '宣传视频', mediaType: 'video' },
  { id: 'audio-effect', name: '音效', mediaType: 'audio' },
];

const imageItems: MediaItem[] = Array.from({ length: 12 }, (_, index) => ({
  id: `image-${index + 1}`,
  name: `admin9-image-${String(index + 1).padStart(2, '0')}.png`,
  type: 'image',
  groupId: imageGroupIdFor(index),
  url: loginBackground,
  thumbnail: loginBackground,
  width: 1920,
  height: 1080,
  mime: 'image/png',
  extension: 'png',
  size: 168000 + index * 1024,
  createdAt: new Date(2026, 6, index + 1).toISOString(),
  status: 'ready',
}));

const videoItems: MediaItem[] = Array.from({ length: 6 }, (_, index) => ({
  id: `video-${index + 1}`,
  name: `product-video-${String(index + 1).padStart(2, '0')}.mp4`,
  type: 'video',
  groupId: index % 3 === 0 ? null : 'video-promo',
  url: videoUrl,
  thumbnail: loginBackground,
  duration: 5,
  mime: 'video/mp4',
  extension: 'mp4',
  size: 1180000 + index * 4096,
  createdAt: new Date(2026, 6, index + 10).toISOString(),
  status: 'ready',
}));

const audioItems: MediaItem[] = Array.from({ length: 6 }, (_, index) => ({
  id: `audio-${index + 1}`,
  name: `notification-${String(index + 1).padStart(2, '0')}.mp3`,
  type: 'audio',
  groupId: index % 3 === 0 ? null : 'audio-effect',
  url: audioUrl,
  duration: 2,
  mime: 'audio/mpeg',
  extension: 'mp3',
  size: 42000 + index * 1024,
  createdAt: new Date(2026, 6, index + 20).toISOString(),
  status: 'ready',
}));

const mediaItems = [...imageItems, ...videoItems, ...audioItems];

const parseBody = (params: MockParams): MutationBody => {
  if (!params.body || typeof params.body !== 'string') return {};
  try {
    return JSON.parse(params.body) as MutationBody;
  } catch {
    return {};
  }
};

const queryValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const mediaUrlFor = (mediaType: MediaType) => {
  if (mediaType === 'video') return videoUrl;
  if (mediaType === 'audio') return audioUrl;
  return loginBackground;
};

setupMock({
  setup() {
    Mock.mock(/\/api\/media\/groups(?:\?.*)?$/, 'get', (params: MockParams) => {
      const { query } = qs.parseUrl(params.url);
      const mediaType = queryValue(query.media_type) as MediaType;
      const data = groups
        .filter((group) => group.mediaType === mediaType)
        .map((group) => ({
          id: group.id,
          name: group.name,
          count: mediaItems.filter((item) => item.type === mediaType && item.groupId === group.id).length,
        }));
      return successResponseWrap(data);
    });

    Mock.mock(/\/api\/media\/groups(?:\?.*)?$/, 'post', (params: MockParams) => {
      const body = parseBody(params);
      const mediaType = body.mediaType as MediaType;
      sequence += 1;
      const group: StoredGroup = {
        id: `${mediaType}-group-${sequence}`,
        name: body.name?.trim() || `新分组 ${sequence}`,
        mediaType,
      };
      groups.push(group);
      return successResponseWrap({ id: group.id, name: group.name, count: 0 });
    });

    Mock.mock(/\/api\/media\/groups\/[^/?]+(?:\?.*)?$/, 'put', (params: MockParams) => {
      const groupId = params.url.split('?')[0].split('/').pop();
      const body = parseBody(params);
      const group = groups.find((item) => item.id === groupId && item.mediaType === body.mediaType);
      if (group && body.name?.trim()) group.name = body.name.trim();
      return successResponseWrap({ id: group?.id, name: group?.name, count: 0 });
    });

    Mock.mock(/\/api\/media\/groups\/[^/?]+(?:\?.*)?$/, 'delete', (params: MockParams) => {
      const groupId = params.url.split('?')[0].split('/').pop();
      const body = parseBody(params);
      const index = groups.findIndex((item) => item.id === groupId && item.mediaType === body.mediaType);
      if (index >= 0) groups.splice(index, 1);
      mediaItems.forEach((item) => {
        if (item.type === body.mediaType && item.groupId === groupId) item.groupId = null;
      });
      return successResponseWrap(null);
    });

    Mock.mock(/\/api\/media\/upload(?:\?.*)?$/, 'post', (params: MockParams) => {
      const { query } = qs.parseUrl(params.url);
      const mediaType = queryValue(query.media_type) as MediaType;
      const rawGroupId = queryValue(query.group_id) as string | undefined;
      const fileName = (queryValue(query.file_name) as string | undefined) || `uploaded-${sequence}`;
      sequence += 1;
      const item: MediaItem = {
        id: `${mediaType}-${sequence}`,
        name: fileName,
        type: mediaType,
        groupId: rawGroupId && rawGroupId !== ungroupedValue ? rawGroupId : null,
        url: mediaUrlFor(mediaType),
        thumbnail: mediaType === 'audio' ? undefined : loginBackground,
        mime: mimeFor(mediaType),
        createdAt: new Date().toISOString(),
        status: 'ready',
      };
      mediaItems.unshift(item);
      return successResponseWrap(item);
    });

    Mock.mock(/\/api\/media\/move(?:\?.*)?$/, 'put', (params: MockParams) => {
      const body = parseBody(params);
      const ids = body.ids || [];
      const movedIds: string[] = [];
      mediaItems.forEach((item) => {
        if (item.type === body.mediaType && ids.includes(item.id)) {
          item.groupId = body.groupId ?? null;
          movedIds.push(item.id);
        }
      });
      return successResponseWrap(movedIds);
    });

    Mock.mock(/\/api\/media(?:\?.*)?$/, 'delete', (params: MockParams) => {
      const ids = parseBody(params).ids || [];
      const removedIds: string[] = [];
      for (let index = mediaItems.length - 1; index >= 0; index -= 1) {
        const item = mediaItems[index];
        if (ids.includes(item.id)) {
          removedIds.push(item.id);
          mediaItems.splice(index, 1);
        }
      }
      return successResponseWrap(removedIds);
    });

    Mock.mock(/\/api\/media(?:\?.*)?$/, 'get', (params: MockParams) => {
      const { query } = qs.parseUrl(params.url);
      const page = Number(queryValue(query.page) || 1);
      const pageSize = Number(queryValue(query.page_size) || 24);
      const mediaType = queryValue(query.media_type) as MediaType;
      const keyword = String(queryValue(query.keyword) || '')
        .trim()
        .toLowerCase();
      const groupId = queryValue(query.group_id) as string | undefined;
      const filtered = mediaItems.filter((item) => {
        if (item.type !== mediaType) return false;
        if (keyword && !item.name.toLowerCase().includes(keyword)) return false;
        if (groupId === ungroupedValue) return item.groupId === null;
        if (groupId) return item.groupId === groupId;
        return true;
      });
      const start = (page - 1) * pageSize;
      return successPaginationResponseWrap({
        data: filtered.slice(start, start + pageSize),
        meta: {
          page,
          page_size: pageSize,
          total: filtered.length,
          has_more: start + pageSize < filtered.length,
        },
      });
    });
  },
});
