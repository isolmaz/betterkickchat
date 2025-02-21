export interface User {
  id: string;
  username: string;
  displayName: string;
  color: string;
  badges: Badge[];
}

export interface Badge {
  type: string;
  label: string;
}

export interface Emote {
  code: string;
  url: string;
  start: number;
  end: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  user: User;
  content: string;
  timestamp: number;
  isAction: boolean;
  isHighlighted: boolean;
  isDeleted: boolean;
  emotes: Emote[];
}

export interface Channel {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  settings: ChannelSettings;
}

export interface ChannelSettings {
  enabledFeatures: string[];
  customEmotes: boolean;
  theme?: string;
  filters: MessageFilter[];
}

export interface MessageFilter {
  id: string;
  type: 'user' | 'keyword' | 'regex';
  pattern: string;
  action: 'hide' | 'highlight' | 'notify';
  color?: string;
  isEnabled: boolean;
} 