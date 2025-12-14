import type { Member } from 'src/services/models';
import { apiService } from 'src/services/api';
import { wsService } from 'src/services/websocket';
import type { AuthResponse } from 'src/services/models';

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

function convertBackendUserToMember(backendUser: AuthResponse['user']): Member {
  return {
    id: String(backendUser.id),
    firstName: backendUser.firstname || '',
    lastName: backendUser.lastname || '',
    nickName: backendUser.nickname,
    email: backendUser.email,
    status: backendUser.status,
    channels: [],
    password: '',
    isTyping: false,
    typingText: '',
    pendingInvitations: [],
    notifyOnMentionOnly: backendUser.notifyOnMentionOnly || false,
  };
}

export function setCurrentUser(user: Member): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): Member | null {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;

  try {
    const user = JSON.parse(stored);
    return {
      id: String(user.id),
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: user.nickName,
      email: user.email,
      status: user.status || 'online',
      channels: user.channels || [],
      password: user.password || '',
      isTyping: user.isTyping,
      typingText: user.typingText,
      pendingInvitations: user.pendingInvitations,
      notifyOnMentionOnly: user.notifyOnMentionOnly || false,
    };
  } catch {
    console.error('Failed to parse current user from localStorage');
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null && apiService.isAuthenticated();
}

export async function login(email: string, password: string): Promise<Member> {
  const response = await apiService.login({ email, password });
  const member = convertBackendUserToMember(response.user);

  try {
    const channelsResponse = await apiService.getChannels();
    member.channels = channelsResponse.channels.map((ch) => String(ch.id));
  } catch (error) {
    console.error('Failed to load user channels:', error);
    member.channels = [];
  }

  setCurrentUser(member);

  // Only connect WebSocket if user is not offline
  if (member.status !== 'offline') {
    //console.log(`User status is ${member.status} - connecting WebSocket`);
    wsService.connect(response.token);
  } else {
    console.log('User status is offline - WebSocket will not connect');
  }

  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  return member;
}

export async function register(
  email: string,
  password: string,
  nickname: string,
  firstname?: string,
  lastname?: string,
): Promise<Member> {
  const registerData: {
    email: string;
    password: string;
    nickname: string;
    firstname?: string;
    lastname?: string;
  } = {
    email,
    password,
    nickname,
  };

  if (firstname) registerData.firstname = firstname;
  if (lastname) registerData.lastname = lastname;

  const response = await apiService.register(registerData);
  const member = convertBackendUserToMember(response.user);
  setCurrentUser(member);

  wsService.connect(response.token);

  return member;
}

export async function logout(): Promise<void> {
  // Disconnect WebSocket and clear local data first
  wsService.disconnect();
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem('auth_token');

  try {
    await apiService.logout();
  } catch {
    //console.log('Backend logout skipped (already logged out locally)');
  }
}

export function isUserInChannel(channelId: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  return user.channels.includes(channelId);
}

export function getAllUsers(): Member[] {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as Member[];
  } catch {
    console.error('Failed to parse users from localStorage');
    return [];
  }
}

export function addUserToChannel(userId: string, channelId: string): boolean {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as Member[];
  const currentUser = getCurrentUser();

  if (!currentUser) return false;

  const userIndex = users.findIndex((u) => String(u.id) === userId);
  if (userIndex !== -1) {
    const user = users[userIndex];
    if (user && !user.channels.includes(channelId)) {
      user.channels.push(channelId);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      if (userId === currentUser.id) {
        currentUser.channels.push(channelId);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      }

      return true;
    }
  }

  return false;
}

export function acceptInvitation(userId: string, channelId: string): boolean {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as Member[];
  const currentUser = getCurrentUser();

  if (!currentUser) return false;

  const userIndex = users.findIndex((u) => String(u.id) === userId);
  if (userIndex !== -1) {
    const user = users[userIndex];
    if (user?.pendingInvitations?.includes(channelId)) {
      user.pendingInvitations = user.pendingInvitations.filter((id) => id !== channelId);

      if (!user.channels.includes(channelId)) {
        user.channels.push(channelId);
      }

      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      if (userId === currentUser.id) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      }

      return true;
    }
  }

  return false;
}

export function removeUserFromChannel(userId: string, channelId: string): boolean {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as Member[];
  const currentUser = getCurrentUser();

  if (!currentUser) return false;

  const userIndex = users.findIndex((u) => String(u.id) === userId);
  if (userIndex !== -1) {
    const user = users[userIndex];
    if (user) {
      const channelIndex = user.channels.indexOf(channelId);
      if (channelIndex !== -1) {
        user.channels.splice(channelIndex, 1);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        if (userId === currentUser.id) {
          const currentChannelIndex = currentUser.channels.indexOf(channelId);
          if (currentChannelIndex !== -1) {
            currentUser.channels.splice(currentChannelIndex, 1);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          }
        }

        return true;
      }
    }
  }

  return false;
}
