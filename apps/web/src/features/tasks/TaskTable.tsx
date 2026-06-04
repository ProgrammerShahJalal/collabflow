import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Pencil, Trash2 } from 'lucide-react';
import type { TaskDto } from '@collabflow/shared';
import { Badge, Modal, Select } from '@/components/ui';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { canManageTasks } from '@/lib/permissions';
import { confirm } from '@/stores/confirm.store';
import { useAuthStore } from '@/stores/auth.store';
import { useDeleteTask, useUpdateTaskStatus } from './tasks.api';
import { EditTaskForm } from './EditTaskForm';

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

function RowActions({
  task,
  onEdit,
}: {
  task: TaskDto;
  onEdit: (task: TaskDto) => void;
}) {
  const deleteTask = useDeleteTask();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete task',
      message: `Delete task "${task.title}"? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onEdit(task)}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
        aria-label="Edit task"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={deleteTask.isPending}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-50 dark:hover:bg-slate-800"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TaskTable({ tasks }: { tasks: TaskDto[] }) {
  const user = useAuthStore((s) => s.user);
  const canManage = canManageTasks(user);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<TaskDto | null>(null);

  const columns = useMemo<ColumnDef<TaskDto>[]>(() => {
    const cols: ColumnDef<TaskDto>[] = [
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

    if (canManage) {
      cols.push({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <RowActions task={row.original} onEdit={setEditing} />
        ),
      });
    }

    return cols;
  }, [canManage]);

  const table = useReactTable({
    data: tasks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    className={cn(
                      'select-none px-4 py-3',
                      h.column.getCanSort() && 'cursor-pointer',
                    )}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[
                      h.column.getIsSorted() as string
                    ] ?? ''}
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

      {editing && (
        <Modal title="Edit Task" onClose={() => setEditing(null)}>
          <EditTaskForm task={editing} onSuccess={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
