export type Message = {
  name: string;
  text: string[];
  stamp: string;
  sent?: boolean;
  isCommand?: boolean;
  isLocal?: boolean;
  channelId?: string;
  mentionedUsers?: string[];
};

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  status: 'online' | 'DND' | 'offline';
  isTyping: boolean;
  typingText: string;
};

export type Channel = {
  id: string;
  name: string;
  messageFile: string;
  isPrivate: boolean;
};

export type MembersData = {
  [channelId: string]: Member[];
};

export type Command = {
  name: string;
  args: string[];
};

export type CurrentUser = {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  status: 'online' | 'DND' | 'offline';
  channels: string[];
};
