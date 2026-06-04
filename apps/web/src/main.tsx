import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { routeTree } from './routeTree.gen';
import { queryClient } from './lib/query-client';
import { useAuthStore } from './stores/auth.store';
import { useThemeStore } from './stores/theme.store';
import './styles.css';

// Apply persisted theme before first paint.
useThemeStore.getState().apply();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: useAuthStore.getState(),
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ConfirmDialog />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
);
