import { useState } from 'react';
import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
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

const DEMO_PASSWORD = 'Demo@1234';
const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@collabflow.dev' },
  { label: 'Project Manager', email: 'manager@collabflow.dev' },
  { label: 'Team Member', email: 'member@collabflow.dev' },
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <FieldError message={error} />
          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign In
          </Button>
        </form>

        <div className="mt-4">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
            Try a demo account
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                variant="outline"
                className="w-full"
                onClick={(e) => submit(e, { email: account.email, password: DEMO_PASSWORD })}
                loading={login.isPending}
              >
                Demo Login as {account.label}
              </Button>
            ))}
          </div>
        </div>

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
