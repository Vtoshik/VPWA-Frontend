import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from 'src/services/api';
import type { Member } from 'src/components/models';

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
  mentionedUsers?: string[];
}

export interface ChannelData {
  id: string;
  name: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: string;
}

export interface UserStatusData {
  userId: string;
  status: 'online' | 'DND' | 'offline';
}

class WebSocketService {
  socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): void {
    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    this.socket = io(API_CONFIG.wsURL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Log ALL incoming events for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log('WebSocket event received:', eventName, args);
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Channel events
  onChannelCreated(callback: (channel: ChannelData) => void): void {
    this.socket?.on('channel:created', callback);
  }

  onChannelDeleted(callback: (channelId: string) => void): void {
    this.socket?.on('channel:deleted', callback);
  }

  onChannelInvite(callback: (data: { channelId: string; channelName: string }) => void): void {
    this.socket?.on('channel:invite', callback);
  }

  onChannelKick(callback: (data: { channelId: string; userId: string }) => void): void {
    this.socket?.on('channel:kick', callback);
  }

  // Message events
  onMessage(callback: (message: MessageData) => void): void {
    this.socket?.on('message:new', callback);
  }

  onMessageHistory(callback: (messages: MessageData[]) => void): void {
    this.socket?.on('message:history', callback);
  }

  // Typing events
  onUserTyping(callback: (data: TypingData) => void): void {
    this.socket?.on('user:typing', callback);
  }

  onUserStoppedTyping(callback: (data: { userId: string; channelId: string }) => void): void {
    this.socket?.on('user:stopped-typing', callback);
  }

  // User status events
  onUserStatusChanged(callback: (data: UserStatusData) => void): void {
    this.socket?.on('user:status-changed', callback);
  }

  onUserJoinedChannel(callback: (data: { userId: string; channelId: string }) => void): void {
    this.socket?.on('user:joined-channel', callback);
  }

  onUserLeftChannel(callback: (data: { userId: string; channelId: string }) => void): void {
    this.socket?.on('user:left-channel', callback);
  }

  // Emit events
  joinChannel(channelId: string): void {
    this.socket?.emit('channel:join', { channelId });
  }

  leaveChannel(channelId: string): void {
    this.socket?.emit('channel:leave', { channelId });
  }

  createChannel(name: string, isPrivate: boolean): void {
    this.socket?.emit('channel:create', { name, isPrivate });
  }

  deleteChannel(channelId: string): void {
    this.socket?.emit('channel:delete', { channelId });
  }

  inviteToChannel(channelId: string, nickname: string): void {
    this.socket?.emit('channel:invite', { channelId, nickname });
  }

  kickFromChannel(channelId: string, nickname: string): void {
    this.socket?.emit('channel:kick', { channelId, nickname });
  }

  revokeFromChannel(channelId: string, nickname: string): void {
    this.socket?.emit('channel:revoke', { channelId, nickname });
  }

  sendMessage(channelId: string, text: string, mentionedUsers?: string[]): void {
    this.socket?.emit('message:send', { channelId, text, mentionedUsers });
  }

  loadMessageHistory(channelId: string, offset: number = 0, limit: number = 50): void {
    this.socket?.emit('message:load-history', { channelId, offset, limit });
  }

  updateTyping(channelId: string, text: string): void {
    this.socket?.emit('user:typing', { channelId, text });
  }

  stopTyping(channelId: string): void {
    this.socket?.emit('user:stopped-typing', { channelId });
  }

  updateStatus(status: 'online' | 'DND' | 'offline'): void {
    this.socket?.emit('user:status-update', { status });
  }

  listChannelMembers(channelId: string): void {
    this.socket?.emit('channel:list-members', { channelId });
  }

  onChannelMembers(callback: (data: { channelId: string; members: Member[] }) => void): void {
    this.socket?.on('channel:members', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: unknown[]) => void): void {
    this.socket?.off(event, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  acceptInvite(inviteId: number, channelId: number): void {
    this.socket?.emit('channel:accept-invite', { inviteId, channelId });
  }

  rejectInvite(inviteId: number): void {
    this.socket?.emit('channel:reject-invite', { inviteId });
  }
}

export const wsService = new WebSocketService();
