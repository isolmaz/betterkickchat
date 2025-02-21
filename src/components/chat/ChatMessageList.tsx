import { KickChatMessage } from '../../services/api/types';

interface ChatMessageListProps {
  messages: KickChatMessage[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <div className="flex flex-col gap-2 p-4 overflow-y-auto h-[calc(100vh-120px)]">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-500">{message.sender.username}</span>
            <span className="text-gray-400 text-sm">
              {new Date(message.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-gray-200">{message.content}</div>
        </div>
      ))}
    </div>
  );
} 