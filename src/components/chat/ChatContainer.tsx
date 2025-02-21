import { useEffect, useState, useCallback } from 'react';
import { kickApi } from '../../services/api/kickApi';
import { KickChannel, KickChatMessage } from '../../services/api/types';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatSettings from './ChatSettings';
import { useSettings } from '../../hooks/useSettings';

interface ChatContainerProps {
  channelName: string;
  onError: (error: Error) => void;
}

export default function ChatContainer({ channelName, onError }: ChatContainerProps) {
  const [channel, setChannel] = useState<KickChannel | null>(null);
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<KickChatMessage[]>([]);
  const { settings, updateSettings } = useSettings();
  const [isConnected, setIsConnected] = useState(false);

  const connectToChat = useCallback((channelId: number) => {
    const ws = new WebSocket(`wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.0.2&flash=false`);
    
    ws.onopen = () => {
      console.log('Connected to chat websocket');
      ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { channel: `chatrooms.${channelId}.v2` }
      }));
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'App\\Events\\ChatMessageEvent') {
        const message = JSON.parse(data.data) as KickChatMessage;
        setMessages(prev => [...prev, message]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError(new Error('Chat connection error'));
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    setChatSocket(ws);
  }, [onError]);

  useEffect(() => {
    const loadChannel = async () => {
      try {
        const channel = await kickApi.getChannel(channelName);
        setChannel(channel);

        // Connect to chat if there's an active livestream
        if (channel.livestream) {
          connectToChat(channel.id);
        }
      } catch (error) {
        console.error('Error loading channel:', error);
        onError(error instanceof Error ? error : new Error('Failed to load channel'));
      }
    };

    if (channelName) {
      loadChannel();
    }

    return () => {
      if (chatSocket) {
        chatSocket.close();
      }
    };
  }, [channelName, connectToChat]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!channel) return;
    
    try {
      await kickApi.sendChatMessage(channel.id, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      onError(error instanceof Error ? error : new Error('Failed to send message'));
    }
  }, [channel, onError]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <ChatMessageList messages={messages} />
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={!isConnected || !channel}
      />
      <ChatSettings 
        settings={settings}
        onSettingsChange={updateSettings}
      />
    </div>
  );
} 