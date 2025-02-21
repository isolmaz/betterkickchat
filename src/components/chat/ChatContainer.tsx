import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { chatService } from '../../services/chat/chatService';
import { ChatMessage as ChatMessageType, ChatroomState } from '../../services/api/types';

const Container = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
}));

const MessageList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const LoadingContainer = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});

interface Props {
  channelName: string;
  onError?: (error: Error) => void;
}

export const ChatContainer: React.FC<Props> = ({ channelName, onError }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [chatroomState, setChatroomState] = useState<ChatroomState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const connectToChat = async () => {
      try {
        await chatService.connectToChannel(channelName);
        setIsConnecting(false);
      } catch (error) {
        console.error('Failed to connect to chat:', error);
        onError?.(error as Error);
        setIsConnecting(false);
      }
    };

    const messageHandler = (message: ChatMessageType) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const stateHandler = (state: ChatroomState) => {
      setChatroomState(state);
    };

    // Subscribe to chat events
    const unsubscribeMessage = chatService.onMessage(messageHandler);
    const unsubscribeState = chatService.onStateChange(stateHandler);

    // Connect to chat
    connectToChat();

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeState();
      chatService.disconnect();
    };
  }, [channelName, onError]);

  const handleSendMessage = async (content: string) => {
    try {
      await chatService.sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      onError?.(error as Error);
    }
  };

  const handleUsernameClick = (username: string) => {
    // Implement user profile view or actions
    console.log('Username clicked:', username);
  };

  if (isConnecting) {
    return (
      <Container>
        <LoadingContainer>
          <CircularProgress />
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      {chatroomState?.slow_mode && (
        <Typography variant="caption" color="warning.main" sx={{ p: 1 }}>
          Slow mode is enabled ({chatroomState.message_interval}s)
        </Typography>
      )}
      <MessageList>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onUsernameClick={handleUsernameClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </MessageList>
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isConnecting}
        placeholder={
          chatroomState?.subscribers_mode
            ? 'Only subscribers can chat...'
            : 'Type a message...'
        }
      />
    </Container>
  );
}; 