import api from './axios';

export type BlockType = 'text' | 'video' | 'image' | 'file' | 'audio';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content?: string;      // HTML для text-блока
  url?: string;          // Rutube URL для video-блока
  fileUrl?: string;      // Путь к файлу для image/file/audio-блоков
  originalName?: string;
  fileSize?: number;
  fileType?: string;     // 'image' | 'pdf' | 'audio' | 'ebook' | 'other'
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  parentId: number | null;
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
  blocks: ContentBlock[] | null;
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
  blocks?: ContentBlock[];
  categoryId?: number | null;
  tabId: number;
  sortOrder?: number;
}

export interface FileUploadResult {
  fileUrl: string;
  fileType: string;
  fileSize: number;
  originalName: string;
  id?: string;
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

export async function reorderContent(items: { id: string; sortOrder: number }[]) {
  const { data } = await api.patch('/content/reorder', { items });
  return data;
}

export async function uploadFile(file: File, contentItemId?: string): Promise<FileUploadResult> {
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
