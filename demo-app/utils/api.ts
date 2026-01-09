import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://34.61.142.200';

type RequestOptions = Omit<RequestInit, 'body' | 'headers'> & { body?: any; headers?: Record<string, string>; skipAuth?: boolean };

type ErrorPayload = { message?: string | string[] } | string;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  // do not set JSON content-type when body is FormData (multipart)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body && !headers['Content-Type'] && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options.skipAuth) {
    const token = await AsyncStorage.getItem('authToken');
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const body = isFormData
    ? options.body
    : typeof options.body === 'string'
    ? options.body
    : options.body
    ? JSON.stringify(options.body)
    : undefined;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch (err) {
    // Ignore JSON parse errors; data stays null
  }

  if (!response.ok) {
    const payload: ErrorPayload = data?.message ?? data ?? 'Request failed';
    const message = Array.isArray(payload) ? payload.join(', ') : payload;
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }

  return data as T;
}

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    location?: string;
    avatar?: string;
  };
};

export type CategoryResponse = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

export type ItemResponse = {
  id: string;
  title: string;
  description: string;
  condition?: string;
  type?: string;
  status?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  estimatedCO2?: number;
  views?: number;
  distance?: number;
  isFavorited?: boolean;
  createdAt?: string;
  updatedAt?: string;
  category?: { id: string; name: string };
  owner?: { id: string; name: string; avatar?: string; rating?: number };
};

export async function createItem(formData: FormData) {
  return request<ItemResponse>('/items', { method: 'POST', body: formData });
}

export type ItemListResponse = {
  items: ItemResponse[];
  total: number;
  page: number;
  limit: number;
};

export async function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export async function register(name: string, email: string, password: string, phone: string, location: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password, phone, location },
    skipAuth: true,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
    skipAuth: true,
  });
}

export async function getItems(params?: {
  search?: string;
  category?: string;
  type?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.append('search', params.search);
  if (params?.category) qs.append('category', params.category);
  if (params?.type) qs.append('type', params.type);
  if (params?.status) qs.append('status', params.status);
  if (typeof params?.lat === 'number') qs.append('lat', String(params.lat));
  if (typeof params?.lng === 'number') qs.append('lng', String(params.lng));
  if (typeof params?.radius === 'number') qs.append('radius', String(params.radius));
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return request<ItemListResponse>(`/items${query ? `?${query}` : ''}`);
}

export async function getItem(id: string, params?: { lat?: number; lng?: number }) {
  const qs = new URLSearchParams();
  if (typeof params?.lat === 'number') qs.append('lat', String(params.lat));
  if (typeof params?.lng === 'number') qs.append('lng', String(params.lng));
  const query = qs.toString();
  return request<ItemResponse>(`/items/${id}${query ? `?${query}` : ''}`);
}

export async function getCategories() {
  return request<CategoryResponse[]>('/categories');
}

export { BASE_URL };

// Favorites
export async function addFavorite(itemId: string) {
  return request('/favorites', { method: 'POST', body: { itemId } });
}

export async function getFavorites(params?: { limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return request<ItemListResponse>(`/favorites${query ? `?${query}` : ''}`);
}

export async function removeFavorite(itemId: string) {
  return request(`/favorites/${itemId}`, { method: 'DELETE' });
}

// Wishlists
export async function createWishlist(payload: { keyword: string; categoryId?: string; maxDistance?: number }) {
  return request('/wishlists', { method: 'POST', body: payload });
}

export async function getMyWishlists(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.append('status', params.status);
  const query = qs.toString();
  return request(`/wishlists/my${query ? `?${query}` : ''}`);
}

export async function getWishlistMatches(id: string) {
  return request(`/wishlists/${id}/matches`);
}

export async function updateWishlist(id: string, payload: any) {
  return request(`/wishlists/${id}`, { method: 'PUT', body: payload });
}

export async function deleteWishlist(id: string) {
  return request(`/wishlists/${id}`, { method: 'DELETE' });
}

export async function getPublicWishlists(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  return request(`/wishlists/public${qs.toString() ? `?${qs.toString()}` : ''}`);
}

// Transactions
export async function createTransaction(payload: { itemId: string; meetingLocation?: string; meetingTime?: string }) {
  return request('/transactions', { method: 'POST', body: payload });
}

export async function getMyTransactions(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.append('status', params.status);
  const query = qs.toString();
  return request(`/transactions/my${query ? `?${query}` : ''}`);
}

export async function getTransaction(id: string) {
  return request(`/transactions/${id}`);
}

export async function confirmGiver(transactionId: string) {
  return request(`/transactions/${transactionId}/confirm-giver`, { method: 'PATCH' });
}

export async function confirmReceiver(transactionId: string) {
  return request(`/transactions/${transactionId}/confirm-receiver`, { method: 'PATCH' });
}

export async function completeTransaction(transactionId: string) {
  return request(`/transactions/${transactionId}/complete`, { method: 'PATCH' });
}

// Ratings
export async function postRating(payload: { transactionId: string; toUserId?: string; rating: number; comment?: string }) {
  return request('/ratings', { method: 'POST', body: payload });
}

export async function getUserRatings(userId: string, params?: { limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return request(`/ratings/users/${userId}${query ? `?${query}` : ''}`);
}

export async function getMyItemsAll(params?: { status?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.append('status', params.status);
  const query = qs.toString();
  return request(`/items/my/all${query ? `?${query}` : ''}`);
}

// Points
export async function getPointsBalance() {
  return request('/points/balance');
}

export async function getPointsHistory(params?: { limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return request(`/points/history${query ? `?${query}` : ''}`);
}

export async function checkPoints(amount: number) {
  return request(`/points/check/${amount}`);
}

// Gamification & Eco
export async function getAchievements() {
  return request('/achievements');
}

export async function getMyAchievements() {
  return request('/achievements/my');
}

export async function getEcoImpactMe() {
  return request('/eco/impact/me');
}

export async function getEcoLeaderboard() {
  return request('/eco/leaderboard');
}

// Notifications
export async function getNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
  const qs = new URLSearchParams();
  if (typeof params?.unreadOnly === 'boolean') qs.append('unreadOnly', String(params.unreadOnly));
  if (params?.limit) qs.append('limit', String(params.limit));
  const query = qs.toString();
  return request(`/notifications${query ? `?${query}` : ''}`);
}

export async function markNotificationRead(id: string) {
  return request(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PATCH' });
}

export async function deleteNotification(id: string) {
  return request(`/notifications/${id}`, { method: 'DELETE' });
}

// User profile
export async function getMe() {
  return request('/users/me');
}

export async function updateMe(payload: any) {
  return request('/users/me', { method: 'PUT', body: payload });
}

export async function uploadAvatar(formData: FormData) {
  return request('/users/me/avatar', { method: 'POST', body: formData });
}

export async function getUser(id: string) {
  return request(`/users/${id}`);
}

export async function getUserStats(id: string) {
  return request(`/users/${id}/stats`);
}

// Auth session
export async function logout() {
  return request('/auth/logout', { method: 'POST' });
}

export async function refreshToken(refreshToken: string) {
  return request<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken }, skipAuth: true });
}

// Reports
export async function createReport(payload: { targetType: 'user' | 'item'; targetId: string; reason: string }) {
  return request('/reports', { method: 'POST', body: payload });
}

// Conversations / Chat
export async function createConversation(payload: { participants: string[]; itemId?: string }) {
  return request('/conversations', { method: 'POST', body: payload });
}

export async function listConversations() {
  return request('/conversations');
}

export async function sendMessage(conversationId: string, payload: { text?: string; attachments?: any[] }) {
  return request(`/conversations/${conversationId}/messages`, { method: 'POST', body: payload });
}

export async function listMessages(conversationId: string, params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.append('page', String(params.page));
  if (params?.limit) qs.append('limit', String(params.limit));
  return request(`/conversations/${conversationId}/messages${qs.toString() ? `?${qs.toString()}` : ''}`);
}
