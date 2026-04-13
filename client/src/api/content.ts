import api from './axios';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface ContentListItem {
  id: string;
  title: string;
  contentType: string;
  videoUrl: string | null;
  sortOrder: number;
  createdAt: string;
  authorName: string;
}

export interface Attachment {
  id: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  originalName: string;
  uploadedAt: string;
}

export interface ContentDetail extends ContentListItem {
  body: string;
  categoryId: number | null;
  tabId: number;
  updatedAt: string;
  attachments: Attachment[];
}

export interface ContentListResponse {
  items: ContentListItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getCategories(tabSlug: string): Promise<Category[]> {
  const { data } = await api.get<Category[]>(`/tabs/${tabSlug}/categories`);
  return data;
}

export async function getCategoryContent(categoryId: number, page = 1): Promise<ContentListResponse> {
  const { data } = await api.get<ContentListResponse>(`/categories/${categoryId}/content`, {
    params: { page, limit: 20 },
  });
  return data;
}

export async function getTabContent(tabSlug: string, page = 1): Promise<ContentListResponse> {
  const { data } = await api.get<ContentListResponse>(`/tabs/${tabSlug}/content`, {
    params: { page, limit: 20 },
  });
  return data;
}

export async function getContentDetail(id: string): Promise<ContentDetail> {
  const { data } = await api.get<ContentDetail>(`/content/${id}`);
  return data;
}

export interface CreateContentPayload {
  title: string;
  body?: string;
  contentType?: string;
  videoUrl?: string;
  categoryId?: number | null;
  tabId: number;
  sortOrder?: number;
}

export async function createContent(payload: CreateContentPayload) {
  const { data } = await api.post('/content', payload);
  return data;
}

export async function updateContent(id: string, payload: Partial<CreateContentPayload>) {
  const { data } = await api.put(`/content/${id}`, payload);
  return data;
}

export async function deleteContent(id: string) {
  const { data } = await api.delete(`/content/${id}`);
  return data;
}

export async function uploadFile(file: File, contentItemId?: string): Promise<Attachment & { fileUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  if (contentItemId) form.append('contentItemId', contentItemId);
  const { data } = await api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAttachment(id: string) {
  const { data } = await api.delete(`/upload/${id}`);
  return data;
}
