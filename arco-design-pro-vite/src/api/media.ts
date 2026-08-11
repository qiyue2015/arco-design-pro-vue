import axios from 'axios';
import type {
  CreateMediaGroupOptions,
  MediaGroup,
  MediaItem,
  MediaLibraryAdapter,
  MediaListParams,
  MediaType,
  MediaUploadOptions,
  MoveMediaOptions,
  RemoveMediaGroupOptions,
  RenameMediaGroupOptions,
} from '@admin9-labs/admin9-ui';

interface MediaListResponse {
  data: MediaItem[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
}

interface DataResponse<T> {
  data: T;
}

const ungroupedValue = '__ungrouped__';

const serializeGroupId = (groupId: string | null | undefined) => {
  if (groupId === null) return ungroupedValue;
  return groupId;
};

const list = async (params: MediaListParams) => {
  const response = await axios.get<any, MediaListResponse>('media', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      keyword: params.keyword,
      media_type: params.mediaType,
      group_id: serializeGroupId(params.groupId),
    },
  });

  return {
    list: response.data,
    pagination: {
      page: response.meta.page,
      pageSize: response.meta.page_size,
      total: response.meta.total,
      hasMore: response.meta.has_more,
    },
  };
};

const listGroups = async (mediaType: MediaType) => {
  const response = await axios.get<any, DataResponse<MediaGroup[]>>('media/groups', {
    params: { media_type: mediaType },
  });
  return response.data;
};

const upload = async (options: MediaUploadOptions) => {
  const formData = new FormData();
  formData.append('file', options.file);
  options.onProgress?.(10);

  const response = await axios.post<any, DataResponse<MediaItem>>('media/upload', formData, {
    params: {
      media_type: options.mediaType,
      group_id: serializeGroupId(options.groupId),
      file_name: options.file.name,
    },
    signal: options.signal,
  });
  options.onProgress?.(100);
  return response.data;
};

const remove = async (ids: string[]) => {
  const response = await axios.delete<any, DataResponse<string[]>>('media', {
    data: { ids },
  });
  return response.data;
};

const createGroup = async (options: CreateMediaGroupOptions) => {
  const response = await axios.post<any, DataResponse<MediaGroup>>('media/groups', options);
  return response.data;
};

const renameGroup = async (options: RenameMediaGroupOptions) => {
  const response = await axios.put<any, DataResponse<MediaGroup>>(`media/groups/${options.groupId}`, {
    mediaType: options.mediaType,
    name: options.name,
  });
  return response.data;
};

const removeGroup = async (options: RemoveMediaGroupOptions) => {
  await axios.delete(`media/groups/${options.groupId}`, {
    data: { mediaType: options.mediaType },
  });
};

const move = async (options: MoveMediaOptions) => {
  const response = await axios.put<any, DataResponse<string[]>>('media/move', options);
  return response.data;
};

const mediaLibraryAdapter: MediaLibraryAdapter = {
  list,
  listGroups,
  upload,
  remove,
  createGroup,
  renameGroup,
  removeGroup,
  move,
};

export default mediaLibraryAdapter;
