import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import type { TaskDto } from '@collabflow/shared';
import { Badge, Modal, Select } from '@/components/ui';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api';
import { canManageTasks } from '@/lib/permissions';
import { confirm } from '@/stores/confirm.store';
import { useAuthStore } from '@/stores/auth.store';
import {
  useBulkTaskAction,
  useDeleteTask,
  useUpdateTaskStatus,
  type BulkTaskResult,
} from './tasks.api';
import { EditTaskForm } from './EditTaskForm';

function RowCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate ?? false;
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function BulkToolbar({
  selectedIds,
  onDone,
}: {
  selectedIds: string[];
  onDone: () => void;
}) {
  const bulk = useBulkTaskAction();

  const report = (result: BulkTaskResult, verb: string) => {
    const ok = result.succeeded.length;
    const failed = result.failed.length;
    if (ok) toast.success(`${ok} task${ok === 1 ? '' : 's'} ${verb}`);
    if (failed) {
      toast.error(
        `${failed} task${failed === 1 ? '' : 's'} skipped: ${result.failed[0].reason}`,
      );
    }
    onDone();
  };

  const handleStatus = async (status: string) => {
    if (!status) return;
    try {
      const res = await bulk.mutateAsync({
        taskIds: selectedIds,
        action: 'update_status',
        status,
      });
      report(res, 'updated');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete tasks',
      message: `Delete ${selectedIds.length} selected task${
        selectedIds.length === 1 ? '' : 's'
      }? This cannot be undone.`,
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      const res = await bulk.mutateAsync({
        taskIds: selectedIds,
        action: 'delete',
      });
      report(res, 'deleted');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/40">
      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
        {selectedIds.length} selected
      </span>
      <Select
        value=""
        disabled={bulk.isPending}
        onChange={(e) => handleStatus(e.target.value)}
        className="py-1 text-xs"
      >
        <option value="">Set status…</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </Select>
      <button
        onClick={handleDelete}
        disabled={bulk.isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950/40"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
      <button
        onClick={onDone}
        disabled={bulk.isPending}
        className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:hover:text-slate-300"
      >
        Clear
      </button>
      {bulk.isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
      )}
    </div>
  );
}

function StatusDropdown({ task }: { task: TaskDto }) {
  const updateStatus = useUpdateTaskStatus();
  const isUpdating = updateStatus.isPending;

  const handleChange = (status: string) => {
    if (status === task.status) return;
    updateStatus.mutate(
      { id: task.id, status },
      { onError: (err) => toast.error(apiErrorMessage(err)) },
    );
  };

  return (
    <div
      className="inline-flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Select
        // While updating, show the value the user picked, not the stale one.
        value={isUpdating ? (updateStatus.variables?.status ?? task.status) : task.status}
        disabled={isUpdating}
        onChange={(e) => handleChange(e.target.value)}
        className={cn(
          'py-1 text-xs transition-opacity',
          isUpdating && 'opacity-60',
        )}
      >
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </Select>
      {isUpdating && (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-indigo-500"
          aria-label="Updating status"
        />
      )}
    </div>
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
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Drop selections whose tasks have left the current page (filter / paging /
  // refetch) so bulk actions never target stale rows.
  const taskIdKey = tasks.map((t) => t.id).join(',');
  useEffect(() => {
    setRowSelection((prev) => {
      const visible = new Set(tasks.map((t) => t.id));
      const next: RowSelectionState = {};
      for (const id of Object.keys(prev)) {
        if (visible.has(id)) next[id] = prev[id];
      }
      return next;
    });
  }, [taskIdKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const columns = useMemo<ColumnDef<TaskDto>[]>(() => {
    const cols: ColumnDef<TaskDto>[] = [];

    if (canManage) {
      cols.push({
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <RowCheckbox
            label="Select all tasks"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={(c) => table.toggleAllRowsSelected(c)}
          />
        ),
        cell: ({ row }) => (
          <RowCheckbox
            label={`Select task ${row.original.title}`}
            checked={row.getIsSelected()}
            onChange={(c) => row.toggleSelected(c)}
          />
        ),
      });
    }

    cols.push(
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
    );

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
    state: { sorting, rowSelection },
    enableRowSelection: canManage,
    getRowId: (task) => task.id,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  return (
    <>
      {canManage && selectedIds.length > 0 && (
        <div className="mb-3">
          <BulkToolbar
            selectedIds={selectedIds}
            onDone={() => setRowSelection({})}
          />
        </div>
      )}
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
