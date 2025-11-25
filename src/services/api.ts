import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  wsURL: import.meta.env.VITE_WS_URL || 'http://localhost:3333',
  endpoints: {
    auth: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      me: '/api/auth/me',
    },
  },
};

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

export interface ChannelData {
  id: number;
  name: string;
  adminId: number;
  isPrivate: boolean;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
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

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: Error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: Error & { response?: { status: number } }) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      },
    );
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
      API_CONFIG.endpoints.auth.register,
      data,
    );
    this.setToken(response.data.token);
    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.axiosInstance.post(
      API_CONFIG.endpoints.auth.login,
      data,
    );
    this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(API_CONFIG.endpoints.auth.logout);
    } finally {
      this.clearToken();
    }
  }

  async me(): Promise<UserResponse> {
    const response: AxiosResponse<UserResponse> = await this.axiosInstance.get(
      API_CONFIG.endpoints.auth.me,
    );
    return response.data;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  async getChannels(): Promise<{ channels: ChannelData[] }> {
    const response = await this.axiosInstance.get<{ channels: ChannelData[] }>('/api/channels');
    return response.data;
  }

  async createChannel(data: CreateChannelRequest): Promise<{ channel: ChannelData }> {
    const response = await this.axiosInstance.post<{ channel: ChannelData }>('/api/channels', data);
    return response.data;
  }

  async joinChannel(data: { name: string }): Promise<{ channel: ChannelData; message: string }> {
    const response = await this.axiosInstance.post<{ channel: ChannelData; message: string }>(
      '/api/channels/join',
      data,
    );
    return response.data;
  }

  async deleteChannel(channelId: number): Promise<{ message: string }> {
    const response = await this.axiosInstance.delete<{ message: string }>(
      `/api/channels/${channelId}`,
    );
    return response.data;
  }

  async leaveChannel(channelId: number): Promise<{ message: string }> {
    const response = await this.axiosInstance.post<{ message: string }>(
      `/api/channels/${channelId}/leave`,
    );
    return response.data;
  }

  async inviteToChannel(channelId: number, data: InviteKickRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/channels/${channelId}/invite`, data);
    return response.data;
  }

  async kickFromChannel(channelId: number, data: InviteKickRequest): Promise<any> {
    const response = await this.axiosInstance.post(`/api/channels/${channelId}/kick`, data);
    return response.data;
  }

  async getChannelMembers(channelId: number): Promise<{ members: ChannelMember[] }> {
    const response = await this.axiosInstance.get<{ members: ChannelMember[] }>(
      `/api/channels/${channelId}/members`,
    );
    return response.data;
  }

  // Maybe for future for finding users
  // async searchUserByNickname(nickname: string): Promise<{ id: number; nickname: string } | null> {
  //   const response = await this.axiosInstance.get(`/api/users/search`, {
  //     params: { nickname },
  //   });
  //   return response.data.user;
  // }

  async getChannelMessages(
    channelId: number,
    page = 1,
    limit = 50,
  ): Promise<{
    meta: { total: number; per_page: number; current_page: number; last_page: number };
    data: Array<{
      id: number;
      userId: number;
      channelId: number;
      text: string;
      sendAt: string;
      user: {
        id: number;
        nickname: string;
        email: string;
        status: 'online' | 'DND' | 'offline';
      };
    }>;
  }> {
    const response = await this.axiosInstance.get(`/api/channels/${channelId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  }

  async sendMessage(channelId: number, text: string): Promise<{ message: any }> {
    const response = await this.axiosInstance.post('/api/messages', {
      channelId,
      text,
    });
    return response.data;
  }

  async inviteToChannelByNickname(
    channelId: number,
    nickname: string,
  ): Promise<{ invite: any; message?: string }> {
    const response = await this.axiosInstance.post(`/api/channels/${channelId}/invite`, {
      nickname,
    });
    return response.data;
  }

  async kickFromChannelByNickname(
    channelId: number,
    nickname: string,
  ): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/channels/${channelId}/kick`, {
      nickname,
    });
    return response.data;
  }

  async getInvitations(): Promise<{
    invites: Array<{
      id: number;
      channelId: number;
      channelName: string;
      fromUserId: number;
      fromNickname: string;
      status: string;
      createdAt: string;
    }>;
  }> {
    const response = await this.axiosInstance.get('/api/invites');
    return response.data;
  }

  async acceptInvitation(inviteId: number): Promise<{ message: string; channel?: ChannelData }> {
    const response = await this.axiosInstance.post(`/api/invites/${inviteId}/accept`);
    return response.data;
  }

  async rejectInvitation(inviteId: number): Promise<{ message: string }> {
    const response = await this.axiosInstance.post(`/api/invites/${inviteId}/reject`);
    return response.data;
  }
}

export const apiService = new ApiService();
