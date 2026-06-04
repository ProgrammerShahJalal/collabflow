import { useConfirmStore } from '@/stores/confirm.store';
import { Button, Modal } from './ui';

export function ConfirmDialog() {
  const { open, options, handleConfirm, handleCancel } = useConfirmStore();
  if (!open || !options) return null;

  const {
    title = 'Are you sure?',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
  } = options;

  return (
    <Modal title={title} onClose={handleCancel}>
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm} autoFocus>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
