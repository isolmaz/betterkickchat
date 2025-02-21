import React from 'react';
import { ChatMessage as ChatMessageType } from '../../services/api/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge, Box, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

const MessageContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const UserBadge = styled(Badge)(({ theme }) => ({
  marginRight: theme.spacing(1),
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    padding: '0 4px',
  },
}));

const Username = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.primary.main,
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const MessageContent = styled(Typography)({
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  '& img.emote': {
    verticalAlign: 'middle',
    margin: '0 2px',
    height: '24px',
  },
});

interface Props {
  message: ChatMessageType;
  onUsernameClick?: (username: string) => void;
}

export const ChatMessage: React.FC<Props> = ({ message, onUsernameClick }) => {
  const { sender, content, created_at, metadata } = message;

  const renderContent = () => {
    if (!metadata?.emotes?.length) {
      return content;
    }

    let renderedContent = content;
    metadata.emotes.forEach(emote => {
      const emoteRegex = new RegExp(emote.name, 'g');
      renderedContent = renderedContent.replace(
        emoteRegex,
        `<img src="${emote.url}" alt="${emote.name}" class="emote" />`
      );
    });

    return (
      <span dangerouslySetInnerHTML={{ __html: renderedContent }} />
    );
  };

  const handleUsernameClick = () => {
    onUsernameClick?.(sender.username);
  };

  return (
    <MessageContainer>
      <Box display="flex" alignItems="center">
        {metadata?.badges?.map((badge, index) => (
          <Tooltip key={index} title={badge.text}>
            <UserBadge color="primary" variant="dot" />
          </Tooltip>
        ))}
        <Username variant="body2" onClick={handleUsernameClick}>
          {sender.username}
        </Username>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </Typography>
      </Box>
      <MessageContent variant="body2">
        {renderContent()}
      </MessageContent>
    </MessageContainer>
  );
}; 