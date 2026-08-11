import Mock from 'mockjs';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';

setupMock({
  setup() {
    Mock.mock(new RegExp('/user/upload-avatar'), () => {
      return successResponseWrap('ok');
    });
  },
});
