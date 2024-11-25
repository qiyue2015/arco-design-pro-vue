import Mock from 'mockjs';
import qs from 'query-string';
import setupMock, { successPaginationResponseWrap, successResponseWrap } from '@/utils/setup-mock';
import { GetParams } from '@/types/global';

const { Random } = Mock;

const data = Mock.mock({
  'list|55': [
    {
      'id|8': /[A-Z][a-z][-][0-9]/,
      'name': `${Random.word(2, 3)}.png`,
      'url': () => Random.image('800x600', Random.color(), Random.word(2, 3)),
    },
  ],
});

setupMock({
  setup() {
    // 图片例表
    Mock.mock(new RegExp('/api/file/images'), (params: GetParams) => {
      const parse = qs.parseUrl(params.url).query;
      const p = parseInt(parse.page as string, 10);
      const ps = parseInt(parse.page_size as string, 10);
      return successPaginationResponseWrap({
        data: data.list.slice((p - 1) * ps, p * ps),
        meta: {
          page: p,
          page_size: ps,
          has_more: true,
          total: 55,
        },
      });
    });

    // 上传图片
    Mock.mock(new RegExp('/api/upload/image'), 'post', () => {
      const responseData = {
        id: Random.id(),
        url: Random.image('800x600', Random.color(), Random.word(2, 3)),
      };

      return successResponseWrap(responseData);
    });
  },
});
