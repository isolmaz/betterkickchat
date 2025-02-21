import React, { useState, KeyboardEvent } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import { Send as SendIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius * 2,
  },
}));

interface Props {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<Props> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <InputContainer>
      <IconButton
        color="primary"
        aria-label="choose emoji"
        disabled={disabled}
      >
        <EmojiIcon />
      </IconButton>
      <StyledTextField
        fullWidth
        multiline
        maxRows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        size="small"
        InputProps={{
          endAdornment: (
            <IconButton
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              color="primary"
            >
              <SendIcon />
            </IconButton>
          ),
        }}
      />
    </InputContainer>
  );
}; 