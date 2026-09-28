import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';

import compressImage, { ImageCompressionError } from '../utils/compressImage';
import { PRESET_AVATARS, resolveAvatar } from './avatars';

export interface AvatarPickerModalProps {
  open: boolean;
  onClose: () => void;
  currentAvatar?: string;
  onSave: (avatarBase64OrKey: string) => void;
}

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

const getCameraErrorMessage = (error: unknown): string => {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'اجازهٔ استفاده از دوربین داده نشد. از تنظیمات مرورگر، دسترسی دوربین را فعال کنید.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'دوربینی روی این دستگاه پیدا نشد.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'دوربین توسط برنامهٔ دیگری در حال استفاده است.';
    }
  }
  return 'راه‌اندازی دوربین ممکن نشد. اتصال دوربین و مجوز مرورگر را بررسی کنید.';
};

const getImageErrorMessage = (error: unknown): string =>
  error instanceof ImageCompressionError
    ? error.message
    : 'پردازش تصویر انجام نشد؛ لطفاً تصویر دیگری انتخاب کنید.';

const captureVideoFrame = (video: HTMLVideoElement): Promise<Blob> => {
  if (!video.videoWidth || !video.videoHeight) {
    return Promise.reject(new ImageCompressionError('تصویر دوربین هنوز آماده نیست.'));
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    return Promise.reject(new ImageCompressionError('ثبت تصویر در این مرورگر ممکن نیست.'));
  }

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new ImageCompressionError('ثبت تصویر دوربین انجام نشد.')),
      'image/jpeg',
      0.92,
    );
  });
};

export default function AvatarPickerModal({
  open,
  onClose,
  currentAvatar,
  onSave,
}: AvatarPickerModalProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const imageRequestRef = useRef(0);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar ?? '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraRetryKey, setCameraRetryKey] = useState(0);

  const preview = resolveAvatar(selectedAvatar);

  const stopCamera = () => {
    cameraRequestRef.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (open) {
      setSelectedAvatar(currentAvatar ?? '');
      setErrorMessage(null);
      setProcessing(false);
      setActiveTab(0);
    } else {
      stopCamera();
      imageRequestRef.current += 1;
    }
  }, [open]);

  useEffect(() => {
    if (!open || activeTab !== 2) {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    const requestId = ++cameraRequestRef.current;
    const startCamera = async () => {
      setErrorMessage(null);
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage('این مرورگر یا اتصال غیرامن از دوربین پشتیبانی نمی‌کند.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
        });
        if (cancelled || cameraRequestRef.current !== requestId) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (!videoRef.current) throw new Error('Video element unavailable');
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!cancelled && cameraRequestRef.current === requestId) setCameraReady(true);
      } catch (error) {
        if (!cancelled && cameraRequestRef.current === requestId) {
          stopCamera();
          setErrorMessage(getCameraErrorMessage(error));
        }
      }
    };

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [activeTab, cameraRetryKey, open]);

  const processImage = async (file: File | Blob) => {
    if (file.size > MAX_SOURCE_BYTES) {
      setErrorMessage('حجم تصویر اولیه بیشتر از ۱۵ مگابایت است.');
      return;
    }
    setProcessing(true);
    setErrorMessage(null);
    const requestId = ++imageRequestRef.current;
    try {
      const avatar = await compressImage(file);
      if (imageRequestRef.current === requestId) setSelectedAvatar(avatar);
    } catch (error) {
      if (imageRequestRef.current === requestId) setErrorMessage(getImageErrorMessage(error));
    } finally {
      if (imageRequestRef.current === requestId) setProcessing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void processImage(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processImage(file);
  };

  const handleCapture = async () => {
    if (!videoRef.current || !cameraReady) return;
    setProcessing(true);
    setErrorMessage(null);
    const requestId = ++imageRequestRef.current;
    try {
      const frame = await captureVideoFrame(videoRef.current);
      const avatar = await compressImage(frame);
      if (imageRequestRef.current === requestId) setSelectedAvatar(avatar);
    } catch (error) {
      if (imageRequestRef.current === requestId) setErrorMessage(getImageErrorMessage(error));
    } finally {
      if (imageRequestRef.current === requestId) setProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    imageRequestRef.current += 1;
    onClose();
  };

  const handleSave = () => {
    if (!selectedAvatar) return;
    stopCamera();
    imageRequestRef.current += 1;
    onSave(selectedAvatar);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      aria-labelledby="avatar-picker-title"
      PaperProps={{ sx: { borderRadius: 4, minHeight: { sm: 620 } } }}
    >
      <DialogTitle id="avatar-picker-title" sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={preview.src}
            sx={{ width: 64, height: 64, bgcolor: preview.bgcolor ?? '#FFE0B2', fontSize: 36 }}
          >
            {preview.text}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" fontWeight={800}>
              انتخاب تصویر دانش‌آموز
            </Typography>
            <Typography variant="body2" color="text.secondary">
              یک آواتار آماده انتخاب کنید یا تصویر خودتان را بسازید.
            </Typography>
          </Box>
          <IconButton onClick={handleClose} aria-label="بستن" sx={{ width: 48, height: 48 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Tabs
        value={activeTab}
        onChange={(_, value: number) => {
          setActiveTab(value);
          setErrorMessage(null);
        }}
        variant="fullWidth"
        aria-label="روش انتخاب آواتار"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 60 }}
      >
        <Tab label="آواتارهای آماده" sx={{ minHeight: 60, fontWeight: 700 }} />
        <Tab label="بارگذاری فایل" sx={{ minHeight: 60, fontWeight: 700 }} />
        <Tab label="دوربین و عکس زنده" sx={{ minHeight: 60, fontWeight: 700 }} />
      </Tabs>

      <DialogContent sx={{ pt: 3 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {errorMessage}
          </Alert>
        )}

        {activeTab === 0 && (
          <Box
            role="group"
            aria-label="آواتارهای آماده"
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))',
              gap: 2,
            }}
          >
            {PRESET_AVATARS.map((preset) => {
              const selected = selectedAvatar === preset.key;
              return (
                <IconButton
                  key={preset.key}
                  aria-pressed={selected}
                  aria-label={preset.label}
                  onClick={() => setSelectedAvatar(preset.key)}
                  sx={{
                    minWidth: 104,
                    minHeight: 116,
                    borderRadius: 4,
                    border: '3px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: preset.background,
                    flexDirection: 'column',
                    gap: 0.5,
                    position: 'relative',
                    '&:hover': { bgcolor: alpha(preset.background, 0.8) },
                  }}
                >
                  <Box component="span" sx={{ fontSize: 52, lineHeight: 1 }}>
                    {preset.emoji}
                  </Box>
                  <Typography component="span" fontWeight={700} color="text.primary">
                    {preset.label}
                  </Typography>
                  {selected && (
                    <CheckCircleRoundedIcon
                      color="primary"
                      sx={{ position: 'absolute', top: 6, left: 6 }}
                    />
                  )}
                </IconButton>
              );
            })}
          </Box>
        )}

        {activeTab === 1 && (
          <Stack spacing={3} alignItems="center">
            <Box
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              sx={{
                width: '100%',
                minHeight: 280,
                border: '4px dashed',
                borderColor: dragActive ? 'primary.main' : 'divider',
                bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.08) : 'background.default',
                borderRadius: 5,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                p: 3,
              }}
            >
              <Stack spacing={1.5} alignItems="center">
                {processing ? (
                  <CircularProgress size={56} />
                ) : (
                  <CloudUploadRoundedIcon color="primary" sx={{ fontSize: 72 }} />
                )}
                <Typography variant="h6" fontWeight={800}>
                  تصویر را اینجا رها کنید
                </Typography>
                <Typography color="text.secondary">یا برای انتخاب فایل ضربه بزنید</Typography>
                <Typography variant="caption" color="text.secondary">
                  JPG، PNG، WebP یا HEIC قابل پشتیبانی مرورگر — حداکثر ۱۵ مگابایت
                </Typography>
              </Stack>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={2.5} alignItems="center">
            <Box
              sx={{
                width: 'min(100%, 560px)',
                aspectRatio: '4 / 3',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 5,
                bgcolor: '#111827',
                border: '3px solid',
                borderColor: cameraReady ? 'secondary.main' : 'divider',
              }}
            >
              <Box
                component="video"
                ref={videoRef}
                muted
                playsInline
                autoPlay
                aria-label="پیش‌نمایش دوربین"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
              {!cameraReady && !errorMessage && (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                  }}
                >
                  <CircularProgress color="inherit" />
                </Box>
              )}
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  width: 'min(68%, 320px)',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: '5px solid rgba(255,255,255,0.95)',
                  boxShadow: '0 0 0 999px rgba(0,0,0,0.28)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap" justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<PhotoCameraRoundedIcon />}
                onClick={handleCapture}
                disabled={!cameraReady || processing}
                sx={{ minHeight: 56, borderRadius: 3, px: 4 }}
              >
                گرفتن عکس
              </Button>
              {errorMessage && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ReplayRoundedIcon />}
                  onClick={() => setCameraRetryKey((value) => value + 1)}
                  sx={{ minHeight: 56, borderRadius: 3 }}
                >
                  تلاش دوباره
                </Button>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button onClick={handleClose} sx={{ minHeight: 48, px: 3 }}>
          انصراف
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!selectedAvatar || processing}
          startIcon={<CameraAltRoundedIcon />}
          sx={{ minHeight: 52, px: 4, borderRadius: 3, fontWeight: 800 }}
        >
          ذخیرهٔ آواتار
        </Button>
      </DialogActions>
    </Dialog>
  );
}
