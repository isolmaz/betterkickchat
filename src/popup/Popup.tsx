import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Alert, Snackbar, CircularProgress, Typography, Button, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { theme } from '../styles/theme';
import ChatContainer from '../components/chat/ChatContainer';
import { kickApi } from '../services/api/kickApi';
import { authService } from '../services/auth/authService';

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 600;

export const Popup: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const checkAuthAndChannel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check authentication first
      const isAuthed = await authService.isAuthenticated();
      setIsAuthenticated(isAuthed);

      // Get current tab info
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab?.url) {
        setError('Unable to access current tab');
        return;
      }

      const url = new URL(currentTab.url);
      if (url.hostname !== 'kick.com') {
        setError('Please visit a Kick.com channel to use this extension');
        return;
      }

      const channelName = url.pathname.split('/')[1];
      if (!channelName) {
        setError('No channel found in URL');
        return;
      }

      const exists = await kickApi.checkChannelExists(channelName);
      if (!exists) {
        setError('Channel not found');
        return;
      }

      setCurrentChannel(channelName);
    } catch (error) {
      console.error('Error checking channel:', error);
      setError('Failed to check channel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndChannel();
  }, []);

  const handleLogin = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);
      await authService.login();
      await checkAuthAndChannel(); // Recheck auth and channel after login
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to start login process');
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setCurrentChannel(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    }
  };

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          width: POPUP_WIDTH,
          height: POPUP_HEIGHT,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" color="primary">
            Better Kick Chat
          </Typography>
          {isAuthenticated && (
            <IconButton
              onClick={handleLogout}
              color="primary"
              size="small"
              title="Logout"
            >
              <LogoutIcon />
            </IconButton>
          )}
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {isLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                gap: 2,
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : !isAuthenticated ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                gap: 3,
                p: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                }}
              >
                <Typography variant="body1" color="text.secondary" align="center">
                  Please login with your Kick.com account to use this extension
                </Typography>
                {!isAuthenticating && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    size="large"
                  >
                    Login with Kick
                  </Button>
                )}
              </Box>
              <Box
                id="oauth-container"
                sx={{
                  flex: 1,
                  display: isAuthenticating ? 'block' : 'none',
                  overflow: 'hidden',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
            </Box>
          ) : currentChannel ? (
            <ChatContainer
              channelName={currentChannel}
              onError={handleError}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography color="error">
                {error || 'No channel selected'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Error Snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseError}
            severity="error"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}; 