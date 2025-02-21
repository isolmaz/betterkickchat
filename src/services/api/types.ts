export interface KickUser {
  id: number;
  username: string;
  email?: string;
  profile_pic?: string;
  bio?: string;
  verified: boolean;
  following_count: number;
  followers_count: number;
  created_at: string;
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