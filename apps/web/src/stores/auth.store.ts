import { create } from 'zustand';
import type { UserDto } from '@collabflow/shared';
import { ACCESS_TOKEN_KEY } from '@/lib/api';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  setSession: (token: string, user: UserDto) => void;
  setUser: (user: UserDto | null) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  setSession: (token, user) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token, user });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    set({ user: null, accessToken: null });
  },
  isAuthenticated: () => !!get().accessToken,
}));
