import { createFileRoute, Outlet } from '@tanstack/react-router';

// Layout route for a single project. The detail view lives in `$id.index.tsx`
// and the edit form in `$id.edit.tsx`; both render here via the Outlet so they
// fully replace each other rather than nesting.
export const Route = createFileRoute('/_auth/projects/$id')({
  component: ProjectLayout,
});

function ProjectLayout() {
  return <Outlet />;
}
