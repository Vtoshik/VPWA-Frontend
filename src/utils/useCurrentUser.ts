import { ref, computed } from 'vue';
import type { Member } from 'src/components/models';
import {
  getCurrentUser,
  addUserToChannel,
  removeUserFromChannel,
  acceptInvitation,
} from 'src/utils/auth';

const currentUser = ref<Member | null>(null);
const updateTrigger = ref(0);

export function useCurrentUser() {
  function refreshUser(): void {
    currentUser.value = getCurrentUser();
    updateTrigger.value++;
  }

  function joinChannel(userId: string, channelId: string): boolean {
    const success = addUserToChannel(userId, channelId);
    if (success) {
      refreshUser();
    }
    return success;
  }

  function leaveChannel(userId: string, channelId: string): boolean {
    const success = removeUserFromChannel(userId, channelId);
    if (success) {
      refreshUser();
    }
    return success;
  }

  function acceptChannelInvitation(userId: string, channelId: string): boolean {
    const success = acceptInvitation(userId, channelId);
    if (success) {
      refreshUser();
    }
    return success;
  }

  function addChannelToUser(channelId: string): void {
    if (!currentUser.value) return;

    if (!currentUser.value.channels.includes(channelId)) {
      currentUser.value.channels.push(channelId);
      // Update localStorage
      localStorage.setItem('current_user', JSON.stringify(currentUser.value));
    }
  }

  function removeChannelFromUser(channelId: string): void {
    if (!currentUser.value) return;

    const index = currentUser.value.channels.indexOf(channelId);
    if (index !== -1) {
      currentUser.value.channels.splice(index, 1);
      // Update localStorage
      localStorage.setItem('current_user', JSON.stringify(currentUser.value));
    }
  }

  const userChannels = computed(() => currentUser.value?.channels ?? []);
  const isInChannel = computed(() => (channelId: string) => {
    return userChannels.value.includes(channelId);
  });

  if (!currentUser.value) {
    refreshUser();
  }

  return {
    currentUser,
    userChannels,
    isInChannel,
    refreshUser,
    joinChannel,
    leaveChannel,
    acceptChannelInvitation,
    addChannelToUser,
    removeChannelFromUser,
  };
}
