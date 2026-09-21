import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { keyframes } from '@mui/material/styles';

import LetterCanvas from '../components/LetterCanvas.jsx';
import useHodhodakStore from '../store/useHodhodakStore.ts';
import { playSuccess, playTryAgain } from '../utils/sounds.js';

// The Persian alphabet, in teaching order ( easiest joins first )
const LETTERS = ['ا', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د'];
const SEEDS_PER_LETTER = 5;
const CELEBRATION_MS = 2600;

/* Mascot celebration dance: jump + wiggle */
const hop = keyframes`
  0%   { transform: translateY(0)    rotate(0deg)  scale(1); }
  25%  { transform: translateY(-28px) rotate(-6deg) scale(1.06); }
  50%  { transform: translateY(0)    rotate(0deg)  scale(1); }
  75%  { transform: translateY(-20px) rotate(6deg)  scale(1.05); }
  100% { transform: translateY(0)    rotate(0deg)  scale(1); }
`;

/* Speech bubble pop-in */
const popIn = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

/** Floating 🌰 that flies up when seeds are awarded */
const seedFly = keyframes`
  0%   { transform: translateY(0) scale(0.6); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translateY(-90px) scale(1.3); opacity: 0; }
`;

export default function PracticeView() {
  const [letterIndex, setLetterIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const timerRef = useRef(null);

  const audioEnabled = useHodhodakStore((s) => s.settings.audioEnabled);
  const addSeeds = useHodhodakStore((s) => s.addSeeds);
  const recordAnswer = useHodhodakStore((s) => s.recordAnswer);

  const letter = LETTERS[letterIndex];

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleComplete = () => {
    if (celebrating) return; // ignore double-taps mid-celebration
    recordAnswer(true);

    // 1) Audio feedback
    playSuccess(audioEnabled);
    // 2) Award seeds (handles level-ups; result available if we want a bigger party)
    addSeeds(SEEDS_PER_LETTER);
    // 3) Mascot celebration state
    setCelebrating(true);

    timerRef.current = setTimeout(() => {
      setCelebrating(false);
      setLetterIndex((i) => (i + 1) % LETTERS.length); // next letter, canvas remounts via key
    }, CELEBRATION_MS);
  };

  const handleTryAgain = () => {
    recordAnswer(false);
    playTryAgain(audioEnabled);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" color="primary" gutterBottom>
          حرف «{letter}» را بنویس
        </Typography>
        <Typography variant="body1" color="text.secondary">
          با انگشت یا ماوس روی حرف روشن خط بکش 🎨
        </Typography>
      </Box>

      {/* Remount per letter → fresh canvas, fresh ink */}
      <LetterCanvas
        key={letter}
        letter={letter}
        onComplete={handleComplete}
        onTryAgain={handleTryAgain}
      />

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        {LETTERS.map((l, i) => (
          <Chip
            key={l}
            label={l}
            onClick={() => !celebrating && setLetterIndex(i)}
            color={i === letterIndex ? 'primary' : 'default'}
            variant={i < letterIndex ? 'filled' : i === letterIndex ? 'filled' : 'outlined'}
            sx={{
              height: 48,
              minWidth: 48,
              fontSize: '1.3rem',
              fontWeight: 700,
              opacity: i < letterIndex ? 0.6 : 1,
            }}
          />
        ))}
      </Box>

      {/* ---------- Mascot celebration overlay ---------- */}
      {celebrating && (
        <Box
          role="alert"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: (theme) => theme.zIndex.modal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 248, 240, 0.85)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <Card
            sx={{
              borderRadius: 8,
              px: 5,
              py: 4,
              textAlign: 'center',
              animation: `${popIn} 0.45s ease-out`,
            }}
          >
            <CardContent>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Box
                  component="img"
                  src="/icons/icon.svg"
                  alt="هدهدک خوشحال است"
                  sx={{
                    width: 180,
                    height: 'auto',
                    animation: `${hop} 0.8s ease-in-out infinite`,
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: -20,
                    fontSize: 40,
                    animation: `${seedFly} 1.4s ease-out forwards`,
                  }}
                >
                  🌰
                </Box>
              </Box>
              <Typography variant="h2" color="primary" sx={{ mt: 2 }}>
                آفرین! 🎉
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {SEEDS_PER_LETTER.toLocaleString('fa-IR')} دانه گرفتی!
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}
