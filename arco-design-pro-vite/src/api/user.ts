import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginRes {
  token: string;
}

export function login(data: LoginData) {
  return axios.post<LoginRes>('user/login', data);
}

export function logout() {
  return axios.post<LoginRes>('user/logout');
}

export function getUserInfo() {
  return axios.post<UserState>('user/info');
}

export function getMenuList() {
  return axios.post<RouteRecordNormalized[]>('user/menu');
}

export interface RegisterData {
  phone: string;
  code: string;
  password: string;
  invite_code?: string;
}

export function register(data: RegisterData) {
  return axios.post('user/register', data);
}

// 上传头像
export function uploadAvatar(data: FormData) {
  return axios.post('user/upload-avatar', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
