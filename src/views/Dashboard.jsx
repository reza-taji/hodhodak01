import { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import useHodhodakStore, {
  selectLevelPercent,
  seedsForNextLevel,
} from '../store/useHodhodakStore.js';
import AvatarPickerModal from '../components/AvatarPickerModal.tsx';
import { resolveAvatar } from '../components/avatars.ts';

const SUBJECTS = [
  { key: 'persian', title: 'فارسی', emoji: '📖', color: '#FF8A3D' },
  { key: 'math', title: 'ریاضی', emoji: '🔢', color: '#38BDF8' },
  { key: 'science', title: 'علوم', emoji: '🔬', color: '#4ADE80' },
  { key: 'quran', title: 'قرآن', emoji: '🌙', color: '#FACC15' },
];

export default function Dashboard() {
  const name = useHodhodakStore((s) => s.profile.name);
  const avatarId = useHodhodakStore((s) => s.profile.avatarId);
  const setProfile = useHodhodakStore((s) => s.setProfile);
  const activeStudentId = useHodhodakStore((s) => s.activeStudentId);
  const updateStudent = useHodhodakStore((s) => s.updateStudent);
  const level = useHodhodakStore((s) => s.gamification.level);
  const levelProgress = useHodhodakStore((s) => s.gamification.levelProgress);
  const percent = useHodhodakStore(selectLevelPercent);

  const [pickerOpen, setPickerOpen] = useState(false);

  const needed = seedsForNextLevel(level);
  const avatar = resolveAvatar(avatarId);

  const handleSaveAvatar = (avatarBase64OrKey) => {
    // Keep the student entity and profile in sync — updateStudent mirrors
    // changes into profile for the active student automatically.
    const updated = updateStudent(activeStudentId, { avatar: avatarBase64OrKey });
    if (!updated) setProfile({ avatarId: avatarBase64OrKey });
  };

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
          {/* Student avatar — tap to change */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={avatar.src}
              alt={name || 'تصویر دانش‌آموز'}
              onClick={() => setPickerOpen(true)}
              component="button"
              aria-label="تغییر تصویر دانش‌آموز"
              sx={{
                width: { xs: 140, md: 160 },
                height: { xs: 140, md: 160 },
                fontSize: { xs: 80, md: 90 },
                bgcolor: avatar.bgcolor || '#FFE0B2',
                border: '4px solid #FF8A3D',
                cursor: 'pointer',
              }}
            >
              {avatar.text}
            </Avatar>
            <Avatar
              component="button"
              onClick={() => setPickerOpen(true)}
              aria-hidden
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 44,
                height: 44,
                bgcolor: 'secondary.main',
                border: '3px solid #FFF8F0',
                cursor: 'pointer',
              }}
            >
              <EditRoundedIcon sx={{ fontSize: 24 }} />
            </Avatar>
          </Box>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {SUBJECTS.map((subject) => (
          <Card key={subject.key} sx={{ borderColor: subject.color, borderWidth: 3 }}>
            <Box
              component={Card}
              aria-label={`درس ${subject.title}`}
              onClick={undefined}
              sx={{
                minHeight: { xs: 140, md: 160 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
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
            </Box>
          </Card>
        ))}
      </Box>

      <AvatarPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentAvatar={avatarId}
        onSave={handleSaveAvatar}
      />
    </Box>
  );
}
