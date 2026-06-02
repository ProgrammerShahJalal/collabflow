import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const ACCESS_TOKEN_KEY = 'collabflow-access-token';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && !original?._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing =
          refreshing ??
          axios
            .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .then((r) => {
              const token = r.data.accessToken as string;
              localStorage.setItem(ACCESS_TOKEN_KEY, token);
              return token;
            })
            .finally(() => {
              refreshing = null;
            });

        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an Axios error. */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return error.message;
  }
  return 'Something went wrong.';
}
