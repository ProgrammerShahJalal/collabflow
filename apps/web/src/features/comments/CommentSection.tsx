import { useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Pencil, Trash2, X } from 'lucide-react';
import type { CommentDto } from '@collabflow/shared';
import { Button, Card, Spinner, Textarea } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { fromNow } from '@/lib/utils';
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
  useUpdateComment,
} from './comments.api';

export function CommentSection({ taskId }: { taskId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useTaskComments(taskId);
  const createComment = useCreateComment(taskId);
  const [body, setBody] = useState('');

  const isElevated =
    user?.role === 'admin' || user?.role === 'project_manager';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await createComment.mutateAsync(trimmed);
      setBody('');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const comments = data?.data ?? [];

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-slate-400">
        <MessageSquare className="h-4 w-4" /> Comments
        {comments.length > 0 && (
          <span className="text-slate-400">({comments.length})</span>
        )}
      </h2>

      {isLoading ? (
        <Spinner />
      ) : comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <ul className="mb-4 space-y-4">
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              taskId={taskId}
              comment={comment}
              canModify={isElevated || comment.author.id === user?.id}
            />
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-2">
        <Textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={createComment.isPending}
            disabled={!body.trim()}
          >
            Comment
          </Button>
        </div>
      </form>
    </Card>
  );
}

function CommentRow({
  taskId,
  comment,
  canModify,
}: {
  taskId: string;
  comment: CommentDto;
  canModify: boolean;
}) {
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await updateComment.mutateAsync({ id: comment.id, body: trimmed });
      setEditing(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async () => {
    try {
      await deleteComment.mutateAsync(comment.id);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const edited = comment.updatedAt !== comment.createdAt;

  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
        {comment.author.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {comment.author.name}
          </span>
          <span className="text-xs text-slate-400">
            {fromNow(comment.createdAt)}
            {edited && ' · edited'}
          </span>
          {canModify && !editing && (
            <span className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(true);
                }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                aria-label="Edit comment"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleteComment.isPending}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={saveEdit}
                loading={updateComment.isPending}
                disabled={!draft.trim()}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
            {comment.body}
          </p>
        )}
      </div>
    </li>
  );
}
