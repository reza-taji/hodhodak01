import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'حذف',
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      dir="rtl"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <DialogTitle id="confirm-dialog-title" fontWeight={800}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-message">{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancel} sx={{ minHeight: 48 }}>انصراف</Button>
        <Button onClick={onConfirm} color="error" variant="contained" sx={{ minHeight: 48 }}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
