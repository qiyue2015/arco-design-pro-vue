import Mock from 'mockjs';

import './user';
import './message-box';

import '@/views/dashboard/workplace/mock';
/** simple */
import '@/views/list/card/mock';
import '@/views/list/search-table/mock';

import '@/views/form/step/mock';

import '@/views/profile/basic/mock';

import '@/views/user/info/mock';

import '@/views/form/tiptap/mock';
import './media';
/** simple end */

Mock.setup({
  timeout: '600-1000',
});
