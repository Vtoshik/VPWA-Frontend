export type Message = {
  name: string;
  text: string[];
  stamp: string;
  sent?: boolean;
  isCommand?: boolean;
  isLocal?: boolean;
  channelId?: string;
  mentionedUserIds?: number[];
};

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  status: 'online' | 'DND' | 'offline';
  isTyping?: boolean;
  typingText?: string;
  password: string;
  channels: string[];
  pendingInvitations?: string[];
  notifyOnMentionOnly?: boolean;
};

export interface ChannelData {
  id: number;
  name: string;
  adminId: number;
  isPrivate: boolean;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

// Frontend representation with string id (from route params)
export interface Channel {
  id: string;
  name: string;
  adminId: number;
  isPrivate: boolean;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export type ChannelsData = {
  channels: ChannelData[];
};

export type MembersData = {
  [channelId: string]: Member[];
};

export type Command = {
  name: string;
  args: string[];
};

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
  firstname?: string;
  lastname?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    firstname: string | null;
    lastname: string | null;
    status: 'online' | 'DND' | 'offline';
    notifyOnMentionOnly: boolean;
  };
  token: string;
}

export interface UserResponse {
  user: {
    id: number;
    email: string;
    nickname: string;
    firstname: string | null;
    lastname: string | null;
    status: 'online' | 'DND' | 'offline';
    notifyOnMentionOnly: boolean;
  };
}

export interface UserStatusData {
  userId: string;
  status: 'online' | 'DND' | 'offline';
}

export interface ChannelMember {
  userId: number;
  nickname: string;
  status: 'online' | 'DND' | 'offline';
  joinedAt: string;
}

export interface CreateChannelRequest {
  name: string;
  isPrivate?: boolean;
}

export interface InviteKickRequest {
  userId: number;
}

export interface InviteKickResponse {
  message: string;
  success: boolean;
}

export interface MessageResponse {
  id: number;
  channelId: number;
  userId: number;
  text: string;
  sendAt: string;
  user: {
    id: number;
    nickname: string;
    email: string;
    status: 'online' | 'DND' | 'offline';
  };
  mentionedUserIds?: number[];
}

export interface InviteResponse {
  id: number;
  channelId: number;
  userId: number;
  status: string;
  createdAt: string;
}

export interface UserUpdateResponse {
  message: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    status: 'online' | 'DND' | 'offline';
    notifyOnMentionOnly: boolean;
  };
}

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
}

export interface TypingData {
  userId: string;
  channelId: string;
  nickname: string;
  text: string;
}

export interface MessageData {
  id: number;
  channelId: number;
  userId: number;
  text: string;
  sendAt: string;
  user: {
    id: number;
    nickname: string;
    email: string;
    status: 'online' | 'DND' | 'offline';
  };
  mentionedUserIds?: number[];
}
