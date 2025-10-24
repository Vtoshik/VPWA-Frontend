import type { CurrentUser } from 'src/components/models';

const CURRENT_USER_ID = 'user2';

const MOCK_USERS: Record<string, CurrentUser> = {
  user1: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    nickName: 'johnd',
    email: 'john.doe@example.com',
    status: 'online',
    channels: ['general', 'dev', 'test'],
  },
  user2: {
    id: 'user2',
    firstName: 'Jane',
    lastName: 'Smith',
    nickName: 'janes',
    email: 'jane.smith@example.com',
    status: 'online',
    channels: ['general', 'dev', 'test'],
  },
  user3: {
    id: 'user3',
    firstName: 'Bob',
    lastName: 'Wilson',
    nickName: 'bobw',
    email: 'bob.wilson@example.com',
    status: 'DND',
    channels: ['general'],
  },
  user4: {
    id: 'user5',
    firstName: 'Edward',
    lastName: 'Tech',
    nickName: 'edtech',
    email: 'ed.tech@example.com',
    status: 'online',
    channels: ['dev'],
  },
  user5: {
    id: 'user7',
    firstName: 'Mike',
    lastName: 'Tester',
    nickName: 'miket',
    email: 'mike.test@example.com',
    status: 'DND',
    channels: ['test'],
  },
};

const STORAGE_KEY = 'currentUser';

export function initMockUser(): CurrentUser {
  const user = MOCK_USERS[CURRENT_USER_ID];

  if (!user) {
    throw new Error(`Mock user with id "${CURRENT_USER_ID}" not found`);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentUser(): CurrentUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as CurrentUser;
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
  console.log('🚪 User logged out');
}

if (typeof window !== 'undefined') {
  (window as unknown as { getCurrentUser: typeof getCurrentUser }).getCurrentUser = getCurrentUser;
}

