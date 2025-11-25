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

export type Channel = {
  id: string;
  name: string;
  messageFile?: string;
  isPrivate: boolean;
  adminId?: number;
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ChannelsData = {
  channels: Channel[];
};

export type MembersData = {
  [channelId: string]: Member[];
};

export type Command = {
  name: string;
  args: string[];
};
