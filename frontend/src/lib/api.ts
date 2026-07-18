import * as T from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'lp_token';

export const api = {
  getToken(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem(TOKEN_KEY) ?? undefined;
  },

  setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<Res = any>(endpoint: string, options: RequestInit = {}): Promise<Res> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        this.clearToken();
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({}));
      
      let errorMessage = 'API request failed';
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Handle Pydantic validation errors (422)
          errorMessage = errorData.detail.map((err: any) => `${err.loc?.[err.loc.length - 1]}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
      throw new Error(errorMessage);
    }

    // Handle 204 or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as Res;
    }

    return response.json();
  },

  // Auth
  login: (data: any) => api.request<{access_token: string}>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: any) => api.request<{access_token: string}>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => api.request<T.UserResponse>('/auth/me'),
  deleteAccount: () => api.request<T.MessageResponse>('/auth/account', { method: 'DELETE' }),

  // Onboarding
  getOnboarding: () => api.request<T.OnboardingResponse>('/onboarding'),
  setOnboarding: (data: any) => api.request<T.OnboardingResponse>('/onboarding', { method: 'POST', body: JSON.stringify(data) }),

  // Path
  getPath: () => api.request<T.PathResponse>('/path'),

  // User & Stats
  getStats: () => api.request<T.UserStatsResponse>('/user/stats'),
  getProfile: () => api.request<T.UserProfileResponse>('/user/profile'),
  updateAvatar: (data: any) => api.request('/user/avatar', { method: 'PATCH', body: JSON.stringify(data) }),
  getLeaderboard: () => api.request<T.LeaderboardResponse>('/leaderboard'),
  advanceDay: () => api.request('/user/day/advance', { method: 'POST' }), // Dev only
  refillHearts: () => api.request('/user/hearts/refill', { method: 'POST' }),
  claimFreeCoins: () => api.request<T.CoinPurchaseResponse>('/user/coins/free-offer', { method: 'POST' }),
  purchaseCoinPack: (packId: string) =>
    api.request<T.CoinPurchaseResponse>(`/user/coins/purchase/${packId}`, { method: 'POST' }),

  // Course management
  getUserCourses: () => api.request<T.UserCoursesResponse>('/user/courses'),
  resetCourse: (language: string) => api.request<T.MessageResponse>(`/user/courses/${language}/reset`, { method: 'POST' }),
  removeCourse: (language: string) => api.request<T.MessageResponse>(`/user/courses/${language}`, { method: 'DELETE' }),

  // Lessons
  startLesson: (lessonId: number) => api.request<T.LessonStartResponse>(`/lesson/${lessonId}/start`, { method: 'POST' }),
  submitAnswer: (sessionId: number, data: any) => api.request<T.AnswerResponse>(`/session/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(data) }),
  completeLesson: (sessionId: number) => api.request<T.LessonCompleteResponse>(`/session/${sessionId}/complete`, { method: 'POST' })
};

