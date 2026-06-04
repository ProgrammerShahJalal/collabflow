import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/ui';
import { ActivityFeed } from '@/features/activities/ActivityFeed';

export const Route = createFileRoute('/_auth/activity')({
  component: ActivityPage,
});

function ActivityPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <Card>
        <ActivityFeed
          limit={perPage}
          page={page}
          onPageChange={setPage}
          onLimitChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
