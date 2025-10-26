import type { Member } from 'src/components/models';
import mockMembersData from 'src/assets/test-data/mock-members.json';

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

type MemberFromJson = Omit<Member, 'channels'>;
type MembersDataFromJson = {
  [channelId: string]: MemberFromJson[];
};

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
      channels: user.channels || ['general'],
      password: user.password || '',
      isTyping: user.isTyping,
      typingText: user.typingText,
    };
  } catch {
    console.error('Failed to parse current user from localStorage');
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
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

function loadMockUsers(): Member[] {
  const membersData = mockMembersData as MembersDataFromJson;
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
          ...member,
          channels: [channelId],
        });
      }
    });
  });

  return Array.from(usersMap.values());
}

export function initMockUsers(): void {
  const existingUsers = localStorage.getItem(USERS_KEY);

  if (!existingUsers) {
    const mockUsers = loadMockUsers();
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  } else {
    try {
      const users = JSON.parse(existingUsers) as Member[];
      const mockUsers = loadMockUsers();
      const existingEmails = new Set(users.map((u) => u.email));
      const newMockUsers = mockUsers.filter((mu) => !existingEmails.has(mu.email));

      if (newMockUsers.length > 0) {
        users.push(...newMockUsers);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error('Failed to merge mock users:', e);
    }
  }
}

export function reloadMockUsers(): void {
  const mockUsers = loadMockUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
}

if (typeof window !== 'undefined') {
  (window as unknown as { getCurrentUser: typeof getCurrentUser }).getCurrentUser = getCurrentUser;
  (window as unknown as { reloadMockUsers: typeof reloadMockUsers }).reloadMockUsers =
    reloadMockUsers;
}
