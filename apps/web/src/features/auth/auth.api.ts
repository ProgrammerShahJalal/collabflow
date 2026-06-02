import { useMutation, useQuery } from '@tanstack/react-query';
import type { AuthResponse, UserDto } from '@collabflow/shared';
import { api } from '@/lib/api';
import { keys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth.store';

interface LoginInput {
  email: string;
  password: string;
}
interface SignupInput extends LoginInput {
  name: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<AuthResponse>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useSignup() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: SignupInput) => {
      const { data } = await api.post<AuthResponse>('/auth/signup', input);
      return data;
    },
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout').catch(() => undefined);
    },
    onSettled: () => clear(),
  });
}

export function useMe() {
  const { accessToken, setUser } = useAuthStore();
  return useQuery({
    queryKey: keys.me(),
    enabled: !!accessToken,
    queryFn: async () => {
      const { data } = await api.get<UserDto>('/auth/me');
      setUser(data);
      return data;
    },
  });
}
