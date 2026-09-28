import { type ChangeEvent, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import BackupRoundedIcon from '@mui/icons-material/BackupRounded';
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import ConfirmDialog from './ConfirmDialog';
import useHodhodakStore from '../store/useHodhodakStore';

import {
  applyImportedBackup,
  exportBackupData,
  getBackupErrorMessage,
  importBackupData,
  type BackupDocument,
  type ImportStrategy,
} from '../utils/backup';

interface NoticeState {
  severity: 'success' | 'error' | 'info';
  message: string;
}

export default function BackupManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupDocument | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const clearAllData = useHodhodakStore((state) => state.clearAllData);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportBackupData();
      setNotice({ severity: 'success', message: 'فایل پشتیبان با موفقیت ذخیره شد.' });
    } catch (error) {
      setNotice({ severity: 'error', message: getBackupErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const backup = await importBackupData(file);
      setPendingBackup(backup);
      setDialogOpen(true);
    } catch (error) {
      setNotice({ severity: 'error', message: getBackupErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const handleImport = (strategy: ImportStrategy) => {
    if (!pendingBackup) return;
    try {
      const result = applyImportedBackup(pendingBackup, strategy);
      const action = strategy === 'overwrite' ? 'بازیابی' : 'ادغام';
      setNotice({
        severity: 'success',
        message: `${action} انجام شد: ${result.classroomsAdded.toLocaleString('fa-IR')} کلاس و ${result.studentsAdded.toLocaleString('fa-IR')} دانش‌آموز پردازش شد.`,
      });
      setDialogOpen(false);
      setPendingBackup(null);
    } catch (error) {
      setNotice({ severity: 'error', message: getBackupErrorMessage(error) });
    }
  };

  return (
    <>
      <Paper
        component="section"
        aria-labelledby="backup-title"
        elevation={0}
        sx={{
          maxWidth: 760,
          mx: 'auto',
          p: { xs: 2.5, sm: 4 },
          border: '3px solid',
          borderColor: 'divider',
          borderRadius: 5,
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BackupRoundedIcon color="primary" sx={{ fontSize: 48 }} />
            <Box>
              <Typography id="backup-title" variant="h4" fontWeight={800}>
                پشتیبان‌گیری از اطلاعات
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                کلاس‌ها، آموزگاران و دانش‌آموزان را ذخیره یا بازیابی کنید.
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ fontSize: '1rem', borderRadius: 3 }}>
            فایل پشتیبان ممکن است شامل نام یا کد ملی باشد؛ آن را فقط در جای امن نگه دارید.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<FileDownloadRoundedIcon />}
              onClick={handleExport}
              disabled={busy}
              sx={{ minHeight: 56, flex: 1, fontSize: '1.05rem', borderRadius: 3 }}
            >
              دریافت فایل پشتیبان
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<FileUploadRoundedIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              sx={{ minHeight: 56, flex: 1, fontSize: '1.05rem', borderRadius: 3 }}
            >
              انتخاب فایل برای بازیابی
            </Button>
          </Stack>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            hidden
          />
          <Box sx={{ borderTop: '2px solid', borderColor: 'error.main', pt: 2 }}>
            <Typography variant="h5" color="error.main" fontWeight={800}>
              بخش خطر: بازنشانی برنامه
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>
              تمام کلاس‌ها، آموزگاران، دانش‌آموزان و پیشرفت ذخیره‌شده پاک می‌شوند.
            </Typography>
            <Button
              color="error"
              variant="outlined"
              size="large"
              startIcon={<DeleteForeverRoundedIcon />}
              onClick={() => setResetDialogOpen(true)}
              sx={{ minHeight: 56, borderRadius: 3 }}
            >
              پاک کردن همهٔ داده‌های برنامه
            </Button>
          </Box>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={resetDialogOpen}
        title="بازنشانی کامل هدهدک؟"
        message="هشدار: همهٔ داده‌های آفلاین شامل کلاس‌ها، آموزگاران، دانش‌آموزان، پیشرفت درس‌ها و امتیازها برای همیشه از این دستگاه پاک می‌شود. این کار قابل بازگشت نیست، مگر اینکه فایل پشتیبان داشته باشید."
        confirmLabel="بله، همهٔ داده‌ها پاک شوند"
        onCancel={() => setResetDialogOpen(false)}
        onConfirm={() => {
          clearAllData();
          setPendingBackup(null);
          setDialogOpen(false);
          setResetDialogOpen(false);
          setNotice({ severity: 'success', message: 'همهٔ داده‌های برنامه پاک شد.' });
        }}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="import-strategy-title"
      >
        <DialogTitle id="import-strategy-title" sx={{ fontWeight: 800 }}>
          روش بازیابی را انتخاب کنید
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Stack spacing={2}>
              <Alert severity="warning">
                <strong>جایگزینی کامل:</strong> تمام کلاس‌ها، آموزگاران و دانش‌آموزان فعلی حذف و
                با اطلاعات فایل جایگزین می‌شوند.
              </Alert>
              <Alert severity="info">
                <strong>ادغام و افزودن:</strong> اطلاعات جدید افزوده می‌شوند و شناسه‌های تکراری
                فعلی بدون تغییر باقی می‌مانند.
              </Alert>
            </Stack>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ minHeight: 48 }}>
            انصراف
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleImport('merge')}
            sx={{ minHeight: 48 }}
          >
            ادغام و افزودن
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleImport('overwrite')}
            sx={{ minHeight: 48 }}
          >
            جایگزینی کامل
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: '100%', fontSize: '1rem' }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
