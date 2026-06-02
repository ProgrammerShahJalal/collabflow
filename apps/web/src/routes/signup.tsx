import { useState } from 'react';
import { createFileRoute, redirect, useNavigate, Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useSignup } from '@/features/auth/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { Button, Card, FieldError, Input, Label } from '@/components/ui';

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuthenticated()) {
      throw redirect({ to: '/' });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const signup = useSignup();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    try {
      await signup.mutateAsync({ name, email, password });
      toast.success('Account created!');
      navigate({ to: '/' });
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          Create account
        </h1>
        <p className="mb-6 text-sm text-slate-500">Join your team on CollabFlow</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              minLength={8}
              required
            />
          </div>
          <FieldError message={error} />
          <Button type="submit" className="w-full" loading={signup.isPending}>
            Sign Up
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
