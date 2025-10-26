import { computed } from 'vue';
import { useCurrentUser } from './useCurrentUser';
import { Notify } from 'quasar';

export function useUserStatus() {
  const { currentUser } = useCurrentUser();

  const userStatus = computed(() => currentUser.value?.status || 'offline');
  const isDND = computed(() => userStatus.value === 'DND');
  const isOffline = computed(() => userStatus.value === 'offline');
  const isOnline = computed(() => userStatus.value === 'online');

  function shouldShowNotification(): boolean {
    return !isDND.value;
  }

  function shouldReceiveMessages(): boolean {
    return !isOffline.value;
  }

  function showNotificationIfAllowed(
    message: string,
    type: 'positive' | 'negative' | 'warning' | 'info' = 'info',
  ) {
    if (shouldShowNotification()) {
      Notify.create({
        type,
        message,
        position: 'top',
      });
    }
  }

  function receiveMessage(channelId: string, message: string, senderName: string): boolean {
    if (!shouldReceiveMessages()) {
      console.log(`Message blocked - user is ${userStatus.value}`);
      return false;
    }

    if (shouldShowNotification()) {
      showNotificationIfAllowed(`New message from ${senderName} in channel`, 'info');
    }

    return true;
  }

  return {
    userStatus,
    isDND,
    isOffline,
    isOnline,
    shouldShowNotification,
    shouldReceiveMessages,
    showNotificationIfAllowed,
    receiveMessage,
  };
}
