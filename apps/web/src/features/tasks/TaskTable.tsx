import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { TaskDto } from '@collabflow/shared';
import { Badge, Select } from '@/components/ui';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { useUpdateTaskStatus } from './tasks.api';

function StatusDropdown({ task }: { task: TaskDto }) {
  const updateStatus = useUpdateTaskStatus();
  return (
    <Select
      value={task.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        updateStatus.mutate({ id: task.id, status: e.target.value })
      }
      className="py-1 text-xs"
    >
      <option value="todo">To Do</option>
      <option value="in_progress">In Progress</option>
      <option value="completed">Completed</option>
    </Select>
  );
}

const columns: ColumnDef<TaskDto>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link
        to="/tasks/$id"
        params={{ id: row.original.id }}
        className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        onClick={(e) => e.stopPropagation()}
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ getValue }) => <Badge value={getValue<string>()} />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusDropdown task={row.original} />,
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => (
      <span
        className={cn(
          'text-sm',
          isOverdue(row.original.dueDate, row.original.status) &&
            'font-medium text-red-600',
        )}
      >
        {formatDate(row.original.dueDate)}
      </span>
    ),
  },
  {
    id: 'assignee',
    header: 'Assignee',
    accessorFn: (t) => t.assignee?.name ?? 'Unassigned',
    cell: ({ getValue }) => (
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {getValue<string>()}
      </span>
    ),
  },
];

export function TaskTable({ tasks }: { tasks: TaskDto[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none px-4 py-3"
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
