import React, { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Box, Alert, Snackbar } from '@mui/material';
import { theme } from '../styles/theme';
import { ChatContainer } from '../components/chat/ChatContainer';
import { kickApi } from '../services/api/kickApi';

const POPUP_WIDTH = 400;
const POPUP_HEIGHT = 600;

export const Popup: React.FC = () => {
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the current tab URL to extract channel name
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab.url) return;

      const url = new URL(currentTab.url);
      if (url.hostname === 'kick.com') {
        const channelName = url.pathname.split('/')[1];
        if (channelName) {
          try {
            // Verify the channel exists
            await kickApi.getChannel(channelName);
            setCurrentChannel(channelName);
          } catch (error) {
            setError('Channel not found');
          }
        }
      } else {
        setError('Not on Kick.com');
      }
    });
  }, []);

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
        }}
      >
        {currentChannel ? (
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
            {error || 'Loading...'}
          </Box>
        )}
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