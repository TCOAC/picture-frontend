import request from '@/request'
export type Id = string | number
export interface Picture {
  id: Id; url: string; name: string; introduction?: string; category?: string; tags: string[];
  picWidth: number; picHeight: number; picSize: string; picFormat: string; picColor?: string;
  spaceId?: Id; userId: Id; user?: API.UserVO; reviewStatus: number; reviewMessage?: string;
  viewCount?: string; downloadCount?: string; createTime?: string;
}
export interface Space { id: Id; spaceName: string; spaceType: number; spaceLevel: number; userId: Id; maxSize: string; maxCount: string; totalSize: string; totalCount: string }
export interface Member { id: Id; userId: Id; spaceRole: string }
export interface Page<T> { records: T[]; total: string; current: string }
export async function api<T>(path: string, data?: unknown, method = 'POST'): Promise<T> {
  const res = await request<{ code: number; data: T; message: string }>('/api' + path, method === 'GET' ? { method, params: data } : { method, data })
  if (res.data.code !== 0) throw new Error(res.data.message || '操作失败')
  return res.data.data
}
export function media(p: Picture, thumbnail = false, code?: string, download = false) {
  const url = new URL(p.url, request.defaults.baseURL || location.origin)
  if (thumbnail && url.pathname.startsWith('/api/media/')) url.searchParams.set('thumbnail', 'true')
  if (code) url.searchParams.set('code', code)
  if (download) url.searchParams.set('download', 'true')
  return url.toString()
}
export function size(value: string | number) { const n = Number(value); return n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB` }
export const status = ['待审核', '已通过', '已驳回']
