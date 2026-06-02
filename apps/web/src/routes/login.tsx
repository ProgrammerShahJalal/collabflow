import { useState } from 'react';
import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useLogin } from '@/features/auth/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { Button, Card, FieldError, Input, Label } from '@/components/ui';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

const DEMO_EMAIL = 'admin@collabflow.dev';
const DEMO_PASSWORD = 'Demo@1234';

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent, creds?: { email: string; password: string }) => {
    e.preventDefault();
    setError(undefined);
    try {
      await login.mutateAsync(creds ?? { email, password });
      toast.success('Welcome back!');
      navigate({ to: '/' });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          CollabFlow
        </h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to your workspace</p>

        <form onSubmit={(e) => submit(e)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <FieldError message={error} />
          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign In
          </Button>
        </form>

        <Button
          variant="outline"
          className="mt-3 w-full"
          onClick={(e) => submit(e, { email: DEMO_EMAIL, password: DEMO_PASSWORD })}
          loading={login.isPending}
        >
          Try Demo Login
        </Button>

        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{' '}
          <Link to="/signup" className="font-medium text-indigo-600">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
