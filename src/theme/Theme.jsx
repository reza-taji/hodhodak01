import { createTheme } from '@mui/material/styles';

/**
 * Hodhodak (هدهدک) theme — inspired by the Hoopoe bird:
 *  - Bright orange  → the Hoopoe's crest & body
 *  - Sky blue       → open-sky accents / secondary actions
 *  - Black & white  → the Hoopoe's striped wings (text & surfaces)
 *
 * Everything is rounded, large and high-contrast for 1st-graders.
 */
const theme = createTheme({
  direction: 'rtl',

  palette: {
    mode: 'light',
    primary: {
      main: '#FF8A3D', // hoopoe orange
      light: '#FFB37A',
      dark: '#E56A17',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#38BDF8', // sky blue
      light: '#7DD3FC',
      dark: '#0284C7',
      contrastText: '#102A43',
    },
    background: {
      default: '#FFF8F0', // warm cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2933', // soft black (wing stripes)
      secondary: '#52606D',
    },
    success: { main: '#4ADE80' },
    warning: { main: '#FACC15' },
    error: { main: '#F87171' },
    info: { main: '#38BDF8' },
  },

  typography: {
    fontFamily: '"Vazirmatn Variable", "Vazirmatn", Tahoma, sans-serif',
    // Big, friendly type scale for young readers
    h1: { fontWeight: 800, fontSize: '2.5rem' },
    h2: { fontWeight: 800, fontSize: '2rem' },
    h3: { fontWeight: 700, fontSize: '1.6rem' },
    h4: { fontWeight: 700, fontSize: '1.35rem' },
    body1: { fontSize: '1.15rem', lineHeight: 1.9 },
    body2: { fontSize: '1.05rem', lineHeight: 1.8 },
    button: { fontWeight: 700, fontSize: '1.1rem', textTransform: 'none' },
  },

  shape: {
    borderRadius: 16, // soft, toy-like corners everywhere
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, // pill buttons
          paddingInline: 28,
          paddingBlock: 12,
          boxShadow: '0 4px 0 rgba(0,0,0,0.12)', // chunky "toy" shadow
          '&:active': {
            transform: 'translateY(2px)',
            boxShadow: '0 2px 0 rgba(0,0,0,0.12)',
          },
        },
      },
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: '3px solid #FFE3CC',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FFF8F0',
        },
      },
    },
  },
});

export default theme;
