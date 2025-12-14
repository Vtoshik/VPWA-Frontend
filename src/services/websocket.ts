import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from 'src/services/api';
import type { Member } from 'src/services/models';
import type { TypingData, MessageData, ChannelData } from 'src/services/models';

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
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;

      // Emit custom event that can be listened to
      window.dispatchEvent(new CustomEvent('websocket:connected'));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      window.dispatchEvent(new CustomEvent('websocket:disconnected', { detail: reason }));
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

  onChannelKick(
    callback: (data: { channelId: number; channelName: string; kickedBy: string }) => void,
  ): void {
    this.socket?.on('channel:kick', callback);
  }

  onChannelRevoke(
    callback: (data: { channelId: number; channelName: string; revokedBy: string }) => void,
  ): void {
    this.socket?.on('channel:revoke', callback);
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
  onUserStatusChanged(
    callback: (data: { userId: string; status: 'online' | 'DND' | 'offline' }) => void,
  ) {
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
    const channelIdNum = Number(channelId);
    if (isNaN(channelIdNum)) {
      console.error('❌ Attempted to join channel with invalid ID:', channelId);
      return;
    }
    console.log('✅ Joining channel:', channelId);
    this.socket?.emit('channel:join', { channelId: channelIdNum });
  }

  leaveChannel(channelId: string): void {
    const channelIdNum = Number(channelId);
    if (isNaN(channelIdNum)) {
      console.error('❌ Attempted to leave channel with invalid ID:', channelId);
      return;
    }
    console.log('✅ Leaving channel:', channelId);
    this.socket?.emit('channel:leave', { channelId: channelIdNum });
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
    // Backend expects lowercase 'dnd', not 'DND'
    const backendStatus = status === 'DND' ? 'dnd' : status;
    this.socket?.emit('user:status-update', { status: backendStatus });
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

  onMessageSilent(callback: (data: MessageData) => void) {
    this.socket?.on('message:new:silent', callback);
  }
}

export const wsService = new WebSocketService();
