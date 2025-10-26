import type { Member } from 'src/components/models';
import mockMembersData from 'src/assets/test-data/mock-members.json';

type MembersData = {
  [channelId: string]: Array<{
    id: string;
    firstName: string;
    lastName: string;
    nickName: string;
    email: string;
    status: 'online' | 'DND' | 'offline';
    isTyping: boolean;
    typingText: string;
  }>;
};

const STORAGE_KEY = 'currentUser';
const USERS_STORAGE_KEY = 'users';

function loadMockUsers(): Member[] {
  const membersData = mockMembersData as MembersData;
  const usersMap = new Map<string, Member>();

  Object.entries(membersData).forEach(([channelId, members]) => {
    members.forEach((member) => {
      if (usersMap.has(member.id)) {
        const existingUser = usersMap.get(member.id)!;
        if (!existingUser.channels.includes(channelId)) {
          existingUser.channels.push(channelId);
        }
      } else {
        usersMap.set(member.id, {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          nickName: member.nickName,
          email: member.email,
          status: member.status,
          isTyping: member.isTyping,
          typingText: member.typingText,
          password: member.nickName,
          channels: [channelId],
        });
      }
    });
  });

  return Array.from(usersMap.values());
}

export function initMockUsers(): void {
  const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!existingUsers) {
    const mockUsers = loadMockUsers();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
  } else {
    try {
      const users = JSON.parse(existingUsers) as Member[];
      const mockUsers = loadMockUsers();
      const existingEmails = new Set(users.map((u) => u.email));
      const newMockUsers = mockUsers.filter((mu) => !existingEmails.has(mu.email));

      if (newMockUsers.length > 0) {
        users.push(...newMockUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Failed to merge mock users:', e);
    }
  }
}

export function getCurrentUser(): Member | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Member;
  } catch {
    console.error('Failed to parse current user from localStorage');
    return null;
  }
}

export function isUserInChannel(channelId: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  return user.channels.includes(channelId);
}

export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function reloadMockUsers(): void {
  const mockUsers = loadMockUsers();
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
}

if (typeof window !== 'undefined') {
  (
    window as unknown as {
      getCurrentUser: typeof getCurrentUser;
      reloadMockUsers: typeof reloadMockUsers;
    }
  ).getCurrentUser = getCurrentUser;
  (
    window as unknown as {
      getCurrentUser: typeof getCurrentUser;
      reloadMockUsers: typeof reloadMockUsers;
    }
  ).reloadMockUsers = reloadMockUsers;
}
