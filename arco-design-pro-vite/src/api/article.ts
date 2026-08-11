import axios from 'axios';

export interface ArticleRecord {
  id: string;
  title: string;
  description: string;
  content: string;
}

export interface ArticleParams {
  current: number;
  pageSize: number;
}

export interface ArticlesResponse {
  data: ArticleRecord[];
  meta: {
    page: number;
    page_size: number;
    has_more: boolean;
    total: number;
  };
}

export function queryArticles(params: ArticleParams) {
  return axios.get<any, ArticlesResponse>('articles', {
    params,
  });
}

export function queryArticle(id: string) {
  return axios.get<ArticleRecord>(`articles/${id}`);
}
