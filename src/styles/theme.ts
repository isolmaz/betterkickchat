import { createTheme, Theme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    customColors: {
      chatBackground: string;
      messageHover: string;
      usernamePrimary: string;
      usernameSecondary: string;
      timestamp: string;
      border: string;
    };
  }
  interface PaletteOptions {
    customColors: {
      chatBackground: string;
      messageHover: string;
      usernamePrimary: string;
      usernameSecondary: string;
      timestamp: string;
      border: string;
    };
  }
}

const baseTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00CCBB',
      light: '#33D6C7',
      dark: '#008E82',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#9146FF',
      light: '#A76BFF',
      dark: '#6531B2',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    customColors: {
      chatBackground: '#1E1E1E',
      messageHover: '#2A2A2A',
      usernamePrimary: '#00CCBB',
      usernameSecondary: '#9146FF',
      timestamp: '#666666',
      border: '#333333',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.8125rem',
    },
    caption: {
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          // Theme colors
          '--primary': '#00CCBB',
          '--primary-light': '#33D6C7',
          '--primary-dark': '#008E82',
          '--secondary': '#9146FF',
          '--background': '#121212',
          '--surface': '#1E1E1E',
          '--border': '#333333',
          '--text-primary': '#FFFFFF',
          '--text-secondary': '#B0B0B0',
          '--message-hover': '#2A2A2A',
          '--username-primary': '#00CCBB',
          '--username-secondary': '#9146FF',
          '--input-background': '#2A2A2A',
          '--warning-background': 'rgba(255, 152, 0, 0.1)',
          '--warning-text': '#FF9800',
        },
        body: {
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          scrollbarColor: '#666666 #1E1E1E',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#666666',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            borderRadius: 8,
            backgroundColor: '#1E1E1E',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#333333',
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export const theme: Theme = baseTheme; 