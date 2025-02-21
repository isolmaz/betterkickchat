// Kick API Response Types
export interface KickResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// User Types
export interface KickUser {
  id: number;
  username: string;
  email: string;
  channel_id: number;
  bio: string | null;
  twitter: string | null;
  facebook: string | null;
  youtube: string | null;
  discord: string | null;
  tiktok: string | null;
  instagram: string | null;
  profile_pic: string;
  following_count: number;
  followers_count: number;
  subscriber_badges: any[];
  created_at: string;
}

// Channel Types
export interface KickChannel {
  id: number;
  user_id: number;
  slug: string;
  playback_url: string;
  vod_enabled: boolean;
  subscription_enabled: boolean;
  followers_count: number;
  subscriber_count: number;
  can_host: boolean;
  user: {
    id: number;
    username: string;
    profile_pic: string;
  };
  livestream: {
    id: number;
    channel_id: number;
    session_title: string;
    viewer_count: number;
    started_at: string;
    categories: KickCategory[];
  } | null;
}

export interface KickCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  banner: string;
  tags: string[];
  parent_category: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

// Chat Types
export interface KickChatMessage {
  id: string;
  channel_id: number;
  user_id: number;
  content: string;
  type: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    profile_pic: string;
    badges: any[];
  };
}

// OAuth Types
export interface KickOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface KickTokenIntrospection {
  active: boolean;
  scope: string[];
  client_id: string;
  username: string;
  exp: number;
}

// Event Types
export interface KickEvent {
  event: string;
  channel: string;
  data: any;
  time: string;
}

export interface KickEventSubscription {
  channel: string;
  events: string[];
  signature: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender: KickUser;
  type: 'message' | 'subscription' | 'follow' | 'gifted_subscription';
  metadata?: {
    emotes?: Array<{
      id: string;
      name: string;
      url: string;
    }>;
    badges?: Array<{
      type: string;
      text: string;
    }>;
  };
}

export interface Channel {
  id: number;
  user_id: number;
  slug: string;
  playback_url: string;
  name_updated_at?: string;
  subscription_enabled: boolean;
  followersCount: number;
  subscriber_badges: Array<{
    id: number;
    months: number;
    image_url: string;
  }>;
  livestream?: {
    id: number;
    title: string;
    thumbnail: string;
    viewer_count: number;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  };
}

export interface ChatroomState {
  id: number;
  channel_id: number;
  slow_mode: boolean;
  followers_mode: boolean;
  subscribers_mode: boolean;
  emotes_mode: boolean;
  message_interval: number;
  following_min_duration: number;
} 