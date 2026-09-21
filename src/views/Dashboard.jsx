import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

import useHodhodakStore, {
  selectLevelPercent,
  seedsForNextLevel,
} from '../store/useHodhodakStore.ts';

const SUBJECTS = [
  { key: 'persian', title: 'فارسی', emoji: '📖', color: '#FF8A3D' },
  { key: 'math', title: 'ریاضی', emoji: '🔢', color: '#38BDF8' },
  { key: 'science', title: 'علوم', emoji: '🔬', color: '#4ADE80' },
  { key: 'quran', title: 'قرآن', emoji: '🌙', color: '#FACC15' },
];

export default function Dashboard() {
  const name = useHodhodakStore((s) => s.profile.name);
  const level = useHodhodakStore((s) => s.gamification.level);
  const levelProgress = useHodhodakStore((s) => s.gamification.levelProgress);
  const percent = useHodhodakStore(selectLevelPercent);

  const needed = seedsForNextLevel(level);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* ---------- Welcome section with the Hodhodak mascot ---------- */}
      <Card
        sx={{
          borderRadius: 6,
          background: 'linear-gradient(135deg, #FFE3CC 0%, #FFF8F0 60%, #D8F1FE 100%)',
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            gap: 3,
            p: { xs: 3, md: 4 },
          }}
        >
          <Box
            component="img"
            src="./icons/icon.svg"
            alt="هدهدک، راهنمای تو"
            sx={{
              width: { xs: 140, md: 180 },
              height: 'auto',
              flexShrink: 0,
              filter: 'drop-shadow(0 6px 0 rgba(0,0,0,0.08))',
            }}
          />
          <Box sx={{ textAlign: { xs: 'center', sm: 'right' }, flexGrow: 1 }}>
            <Typography variant="h3" color="primary" gutterBottom>
              سلام{name ? ` ${name}` : ''}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              هدهدک منتظرته! بیا با هم دانه جمع کنیم و یاد بگیریم.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowRoundedIcon sx={{ fontSize: 32 }} />}
              aria-label="شروع درس امروز"
              sx={{
                minHeight: 72, // big, easy touch target
                px: 5,
                fontSize: '1.35rem',
                borderRadius: 999,
              }}
            >
              شروع درس امروز
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ---------- Level progress ---------- */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h4">سطح {level.toLocaleString('fa-IR')}</Typography>
            <Typography variant="body1" color="text.secondary">
              {levelProgress.toLocaleString('fa-IR')} از {needed.toLocaleString('fa-IR')} دانه 🌰
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={percent}
            aria-label={`پیشرفت سطح: ${percent} درصد`}
            sx={{
              height: 20,
              borderRadius: 999,
              bgcolor: '#FFE3CC',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                background: 'linear-gradient(90deg, #FF8A3D, #38BDF8)',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* ---------- Subjects ---------- */}
      <Typography variant="h4" sx={{ mt: 1 }}>
        چی یاد بگیریم؟
      </Typography>
      <Grid container spacing={2.5}>
        {SUBJECTS.map((subject) => (
          <Grid key={subject.key} size={{ xs: 6, md: 3 }}>
            <Card sx={{ borderColor: subject.color, borderWidth: 3 }}>
              <CardActionArea
                aria-label={`درس ${subject.title}`}
                sx={{
                  // whole card is one ≥120px touch target
                  minHeight: { xs: 140, md: 160 },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ fontSize: { xs: 56, md: 64 }, lineHeight: 1 }} aria-hidden>
                    {subject.emoji}
                  </Box>
                  <Typography variant="h4" sx={{ mt: 1.5, color: subject.color }}>
                    {subject.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
