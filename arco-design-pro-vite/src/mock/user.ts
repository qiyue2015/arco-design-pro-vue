import Mock from 'mockjs';
import setupMock, { successResponseWrap, failResponseWrap } from '@/utils/setup-mock';

import { MockParams } from '@/types/mock';
import { isLogin } from '@/utils/auth';

setupMock({
  setup() {
    // Mock.XHR.prototype.withCredentials = true;

    // 用户信息
    Mock.mock(new RegExp('/api/user/info'), () => {
      if (isLogin()) {
        const role = window.localStorage.getItem('userRole') || 'admin';
        return successResponseWrap({
          name: 'admin',
          avatar: '//lf1-xgcdn-tos.pstatp.com/obj/vcloud/vadmin/start.8e0e4855ee346a46ccff8ff3e24db27b.png',
          email: 'wangliqun@email.com',
          job: 'frontend',
          jobName: '前端艺术家',
          organization: 'Frontend',
          organizationName: '前端',
          location: 'beijing',
          locationName: '北京',
          introduction: '人潇洒，性温存',
          personalWebsite: 'https://www.arco.design',
          phone: '150****0000',
          registrationDate: '2013-05-10 12:10:00',
          accountId: '15012312300',
          certification: 1,
          role,
        });
      }
      return failResponseWrap(null, '未登录', 50008);
    });

    // 登录
    Mock.mock(new RegExp('/api/user/login'), (params: MockParams) => {
      const { username, password, phone, code } = JSON.parse(params.body);
      // 账户密码登录
      if (username || password) {
        if (!username) {
          return failResponseWrap(null, '用户名不能为空', 50000);
        }
        if (!password) {
          return failResponseWrap(null, '密码不能为空', 50000);
        }
        if (username === 'admin' && password === '111111') {
          window.localStorage.setItem('userRole', 'admin');
          return successResponseWrap({ token: '12345' });
        }
        if (username === 'user' && password === '111111') {
          window.localStorage.setItem('userRole', 'user');
          return successResponseWrap({ token: '54321' });
        }
        return failResponseWrap(null, '账号或者密码错误', 50000);
      }

      if (phone || code) {
        if (!phone) {
          return failResponseWrap(null, '用户名不能为空', 50000);
        }
        if (!code) {
          return failResponseWrap(null, '密码不能为空', 50000);
        }
        if (phone === '13888888888' && code === '1234') {
          window.localStorage.setItem('userRole', 'admin');
          return successResponseWrap({ token: '12345' });
        }
        if (phone === '13555555555' && code === '1234') {
          window.localStorage.setItem('userRole', 'user');
          return successResponseWrap({ token: '54321' });
        }

        return failResponseWrap(null, '验证码错误', 50000);
      }

      return failResponseWrap(null, '请输入账号信息', 50000);
    });

    Mock.mock(new RegExp('/api/user/register'), (params: MockParams) => {
      const { phone, code } = JSON.parse(params.body);
      if (!phone) {
        return failResponseWrap(null, '手机号不能为空', 50000);
      }
      if (!code) {
        return failResponseWrap(null, '验证码不能为空', 50000);
      }
      // 简单模拟：用户名已存在
      if (phone === '13888888888') {
        return failResponseWrap(null, '用户名已存在', 50001);
      }
      return successResponseWrap({ message: '注册成功' });
    });

    // 登出
    Mock.mock(new RegExp('/api/user/logout'), () => {
      return successResponseWrap(null);
    });

    // 用户的服务端菜单
    Mock.mock(new RegExp('/api/user/menu'), () => {
      const menuList = [
        {
          path: '/dashboard',
          name: 'dashboard',
          meta: {
            locale: 'menu.server.dashboard',
            requiresAuth: true,
            icon: 'icon-dashboard',
            order: 1,
          },
          children: [
            {
              path: 'workplace',
              name: 'Workplace',
              meta: {
                locale: 'menu.server.workplace',
                requiresAuth: true,
              },
            },
            {
              path: 'https://arco.design',
              name: 'arcoWebsite',
              meta: {
                locale: 'menu.arcoWebsite',
                requiresAuth: true,
              },
            },
          ],
        },
      ];
      return successResponseWrap(menuList);
    });
  },
});
