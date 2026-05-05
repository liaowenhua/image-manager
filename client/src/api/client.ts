import axios from 'axios';
import type { Photo, Tag, Album, PaginatedResponse, TimelineItem, ScanResult } from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Photos
export const getPhotos = (page = 1, limit = 24, filters?: { favorite?: boolean; rating?: number; date?: string }) =>
  api.get<PaginatedResponse<Photo>>('/photos', { params: { page, limit, ...filters } });

export const getPhoto = (id: number) =>
  api.get<Photo>(`/photos/${id}`);

export const updatePhoto = (id: number, data: { favorite?: boolean; rating?: number }) =>
  api.put<Photo>(`/photos/${id}`, data);

export const deletePhoto = (id: number) =>
  api.delete(`/photos/${id}`);

export const scanPhotos = (path: string) =>
  api.post<ScanResult>('/photos/scan', { path });

export const getPhotoFile = (id: number) =>
  api.get(`/photos/${id}/file`, { responseType: 'blob' });

export const getPhotoThumbnail = (id: number) =>
  api.get(`/photos/${id}/thumbnail`, { responseType: 'blob' });

// Tags
export const getTags = () =>
  api.get<Tag[]>('/tags');

export const createTag = (name: string, color?: string) =>
  api.post<Tag>('/tags', { name, color });

export const updateTag = (id: number, data: { name?: string; color?: string }) =>
  api.put<Tag>(`/tags/${id}`, data);

export const deleteTag = (id: number) =>
  api.delete(`/tags/${id}`);

export const addTagToPhoto = (photoId: number, tagId: number) =>
  api.post(`/tags/photos/${photoId}/tags`, { tagId });

export const removeTagFromPhoto = (photoId: number, tagId: number) =>
  api.delete(`/tags/photos/${photoId}/tags/${tagId}`);

// Albums
export const getAlbums = () =>
  api.get<Album[]>('/albums');

export const createAlbum = (name: string, description?: string, cover_photo_id?: number) =>
  api.post<Album>('/albums', { name, description, cover_photo_id });

export const updateAlbum = (id: number, data: { name?: string; description?: string; cover_photo_id?: number }) =>
  api.put<Album>(`/albums/${id}`, data);

export const deleteAlbum = (id: number) =>
  api.delete(`/albums/${id}`);

export const getAlbumPhotos = (albumId: number) =>
  api.get<Photo[]>(`/albums/${albumId}/photos`);

export const addPhotosToAlbum = (albumId: number, photoIds: number[]) =>
  api.post(`/albums/${albumId}/photos`, { photo_ids: photoIds });

export const removePhotosFromAlbum = (albumId: number, photoIds: number[]) =>
  api.delete(`/albums/${albumId}/photos`, { data: { photo_ids: photoIds } });

// Search
export const searchPhotos = (params: {
  q?: string;
  tags?: string;
  date?: string;
  favorite?: boolean;
  rating?: number;
  page?: number;
  limit?: number;
}) => api.get<PaginatedResponse<Photo>>('/search', { params });

export const getTimeline = (year?: string) =>
  api.get<TimelineItem[]>('/search/timeline', { params: { year } });

export const getFavorites = (page = 1, limit = 24) =>
  api.get<PaginatedResponse<Photo>>('/search/favorites', { params: { page, limit } });

export const setFavorite = (photoId: number, favorite: boolean) =>
  api.post<Photo>(`/search/photos/${photoId}/favorite`, { favorite });

export const setRating = (photoId: number, rating: number) =>
  api.post<Photo>(`/search/photos/${photoId}/rating`, { rating });

// Health
export const healthCheck = () => api.get('/health');

export default api;