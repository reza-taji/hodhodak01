import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Drawer from '@mui/material/Drawer';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';

import useHodhodakStore from '../store/useHodhodakStore.ts';
import Dashboard from '../views/Dashboard.jsx';
import PracticeView from '../views/PracticeView.jsx';
import BackupManager from '../components/BackupManager.tsx';

/** Compact rail width for 1024×768 — leaves ~920px for content. */
const RAIL_WIDTH = 96;
/** Reserved space so content never hides under the bottom nav. */
const BOTTOM_NAV_HEIGHT = 80;

const NAV_ITEMS = [
  { key: 'home', label: 'خانه', icon: <HomeRoundedIcon /> },
  { key: 'lessons', label: 'درس‌ها', icon: <MenuBookRoundedIcon /> },
  { key: 'rewards', label: 'جایزه‌ها', icon: <EmojiEventsRoundedIcon /> },
  { key: 'settings', label: 'تنظیمات', icon: <SettingsRoundedIcon /> },
];

function PlaceholderView({ title }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" color="text.secondary">
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        به‌زودی اینجا پر از بازی و یادگیری می‌شود! 🐦
      </Typography>
    </Box>
  );
}

export default function MainLayout() {
  const theme = useTheme();
  // Below 900px → bottom navigation; at 1024×768 (md and up) → compact sidebar
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [view, setView] = useState('home');

  const seeds = useHodhodakStore((s) => s.gamification.seeds);
  const level = useHodhodakStore((s) => s.gamification.level);
  const audioEnabled = useHodhodakStore((s) => s.settings.audioEnabled);
  const toggleAudio = useHodhodakStore((s) => s.toggleAudio);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      {/* ---------- Top App Bar ---------- */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: '3px solid',
          borderColor: 'divider',
          // keep clear of the rail on large screens
          width: isSmallScreen ? '100%' : `calc(100% - ${RAIL_WIDTH}px)`,
          mr: isSmallScreen ? 0 : `${RAIL_WIDTH}px`,
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 72, md: 80 } }}>
          <Box
            component="img"
            src="./icons/icon.svg"
            alt="هدهدک"
            sx={{ width: 48, height: 48 }}
          />
          <Typography variant="h4" color="primary" sx={{ fontWeight: 800, flexGrow: 1 }}>
            هدهدک
          </Typography>

          {/* Seed score — the child's treasure, always visible */}
          <Chip
            icon={<span style={{ fontSize: 22, paddingInlineStart: 8 }}>🌰</span>}
            label={seeds.toLocaleString('fa-IR')}
            color="primary"
            aria-label={`${seeds} دانه`}
            sx={{
              height: 48,
              fontSize: '1.25rem',
              fontWeight: 800,
              borderRadius: 999,
              px: 1,
            }}
          />
          <Chip
            label={`سطح ${level.toLocaleString('fa-IR')}`}
            color="secondary"
            sx={{ height: 48, fontSize: '1.05rem', fontWeight: 700, borderRadius: 999 }}
          />

          <IconButton
            onClick={toggleAudio}
            aria-label={audioEnabled ? 'خاموش کردن صدا' : 'روشن کردن صدا'}
            sx={{ width: 56, height: 56 }}
          >
            {audioEnabled ? (
              <VolumeUpRoundedIcon sx={{ fontSize: 32 }} />
            ) : (
              <VolumeOffRoundedIcon sx={{ fontSize: 32 }} />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ---------- Navigation: rail on ≥900px, bottom bar below ---------- */}
      {isSmallScreen ? (
        <BottomNavigation
          value={view}
          onChange={(_, newView) => setView(newView)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: BOTTOM_NAV_HEIGHT,
            borderTop: '3px solid',
            borderColor: 'divider',
            zIndex: theme.zIndex.appBar,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 72,
              py: 1,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '1rem',
              fontWeight: 700,
              mt: 0.5,
            },
            '& .MuiSvgIcon-root': { fontSize: 32 },
          }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.key}
              value={item.key}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      ) : (
        <Drawer
          variant="permanent"
          anchor="left" /* flips to the right edge automatically in RTL */
          sx={{
            width: RAIL_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: RAIL_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              borderInlineEnd: '3px solid',
              borderColor: 'divider',
              pt: '96px', // clear the app bar
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, px: 1 }}>
            {NAV_ITEMS.map((item) => {
              const selected = view === item.key;
              return (
                <IconButton
                  key={item.key}
                  onClick={() => setView(item.key)}
                  aria-label={item.label}
                  aria-current={selected ? 'page' : undefined}
                  sx={{
                    // 80×80 — generous touch target for small hands
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    borderRadius: 4,
                    flexDirection: 'column',
                    gap: 0.25,
                    color: selected ? 'primary.contrastText' : 'text.secondary',
                    bgcolor: selected ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: selected ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ '& .MuiSvgIcon-root': { fontSize: 34 } }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                    {item.label}
                  </Typography>
                </IconButton>
              );
            })}
          </Box>
        </Drawer>
      )}

      {/* ---------- Content ---------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: '84px', md: '92px' }, // clear fixed app bar
          pb: isSmallScreen ? `${BOTTOM_NAV_HEIGHT + 16}px` : 4,
          px: { xs: 2, md: 4 },
          maxWidth: 1100,
          mx: 'auto',
          width: '100%',
        }}
      >
        {view === 'home' && <Dashboard />}
        {view === 'lessons' && <PracticeView />}
        {view === 'rewards' && <PlaceholderView title="جایزه‌ها" />}
        {view === 'settings' && <BackupManager />}
      </Box>
    </Box>
  );
}
