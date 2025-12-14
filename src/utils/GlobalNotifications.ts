import { wsService } from 'src/services/websocket';
import { getCurrentUser } from 'src/utils/auth';
import { useChannels } from 'src/utils/channels';
import { useRouter } from 'vue-router';
import type { MessageData } from 'src/services/models';

let isSetup = false;

export function useGlobalNotifications() {
  const router = useRouter();
  const { channels } = useChannels();

  function showBrowserNotification(data: MessageData) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Get channel name
    const channel = channels.value.find((ch) => String(ch.id) === String(data.channelId));
    const channelName = channel?.name || `channel-${data.channelId}`;

    const notification = new Notification(`${data.user.nickname} in #${channelName}`, {
      body: data.text.substring(0, 100),
      icon: '/icons/favicon-128x128.png',
      tag: `channel-${data.channelId}`,
    });

    notification.onclick = () => {
      window.focus();
      void router.push(`/channel/${data.channelId}`);
      notification.close();
    };
  }

  function globalNotificationHandler(data: MessageData) {
    //console.log('Global message received:', data);

    const currentUser = getCurrentUser();
    // Use document.visibilityState instead of $q.appVisible (which doesn't work outside components)
    const isAppVisible = document.visibilityState === 'visible';
    const isFromOtherUser = String(data.userId) !== String(currentUser?.id);
    const isMentioned = data.mentionedUserIds?.includes(Number(currentUser?.id));

    if (!isAppVisible && isFromOtherUser && currentUser) {
      const shouldNotify = currentUser.notifyOnMentionOnly ? isMentioned : true;

      if (shouldNotify) {
        showBrowserNotification(data);
      } else {
        //console.log('Notification blocked by user settings (mention-only mode)');
      }
    } else {
      // console.log('Notification not shown. Reasons:', {
      //   isAppVisible,
      //   isFromOtherUser,
      //   hasUser: !!currentUser,
      // });
    }
  }

  function setupGlobalNotifications() {
    if (isSetup) {
      //console.log('Global notifications already set up, skipping');
      return;
    }

    // console.log('Setting up global notifications listener');
    // console.log('WebSocket connected:', wsService.isConnected());
    // console.log('Socket object exists:', !!wsService.socket);

    // Remove any existing listener first to prevent duplicates
    wsService.socket?.off('message:new', globalNotificationHandler);

    // Add the listener
    wsService.onMessage(globalNotificationHandler);

    //console.log('Global notification handler registered');
    isSetup = true;
  }

  function resetGlobalNotifications() {
    //console.log('Resetting global notifications');
    isSetup = false;
  }

  return {
    setupGlobalNotifications,
    resetGlobalNotifications,
  };
}
