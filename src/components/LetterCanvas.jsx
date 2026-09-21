import { useRef, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const BRUSH_COLOR = '#38BDF8'; // sky-blue ink
const BRUSH_SIZE = 26; // thick marker — forgiving for small hands
/** Minimum fraction of canvas pixels the child must ink before "done" counts. */
const MIN_COVERAGE = 0.015;

/**
 * Letter-tracing canvas.
 * The guide letter lives in the DOM *behind* a transparent canvas, so the
 * canvas holds ONLY the child's ink — which makes the coverage check trivial
 * and lets us restyle/reposition the guide with plain CSS.
 *
 * Uses Pointer Events → one code path for mouse, touch and stylus.
 */
export default function LetterCanvas({ letter, onComplete, onTryAgain }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hint, setHint] = useState('');

  /* Keep the canvas bitmap matched to its CSS size × devicePixelRatio,
     so strokes stay crisp on any screen (including the 1024×768 G580). */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Preserve existing ink across resizes
      const snapshot = canvas.width > 0 ? canvas.toDataURL() : null;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = BRUSH_COLOR;
      ctx.lineWidth = BRUSH_SIZE;
      if (snapshot) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, width, height);
        img.src = snapshot;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture(e.pointerId); // keeps drawing if finger drifts off-canvas
    drawingRef.current = true;
    setHint('');
    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // a dot for taps, so quick dabs also leave ink
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHint('');
  }, []);

  /** Fraction of pixels the child has inked (canvas contains only their strokes). */
  const inkCoverage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let inked = 0;
    for (let i = 3; i < data.length; i += 16) {
      // sample every 4th pixel's alpha — fast enough, accurate enough
      if (data[i] > 0) inked++;
    }
    return inked / (data.length / 16);
  };

  const handleDone = () => {
    if (inkCoverage() >= MIN_COVERAGE) {
      onComplete?.();
    } else {
      setHint('اول روی حرف را با انگشتت خط بکش! ✏️');
      onTryAgain?.();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Canvas area — fixed 4:3-ish box that fits 1024×768 with room for buttons */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 320, md: 400 },
          borderRadius: 6,
          border: '4px dashed #FFB37A',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Guide letter (behind the ink layer) */}
        <Typography
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: { xs: 200, md: 280 },
            fontWeight: 800,
            color: '#FFE3CC',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          {letter}
        </Typography>

        <Box
          component="canvas"
          ref={canvasRef}
          role="img"
          aria-label={`بوم نقاشی برای تمرین حرف ${letter}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            touchAction: 'none', // stop scroll/zoom gestures while drawing
            cursor: 'crosshair',
          }}
        />
      </Box>

      {hint && (
        <Typography variant="body1" color="warning.dark" textAlign="center" role="status">
          {hint}
        </Typography>
      )}

      {/* Controls — 72px touch targets */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={clearCanvas}
          startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 28 }} />}
          sx={{ minHeight: 72, px: 4, fontSize: '1.2rem', borderWidth: 3 }}
        >
          پاک کن
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleDone}
          startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 28 }} />}
          sx={{ minHeight: 72, px: 5, fontSize: '1.25rem' }}
        >
          نوشتم!
        </Button>
      </Box>
    </Box>
  );
}
