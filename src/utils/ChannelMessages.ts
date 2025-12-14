import { ref, nextTick } from 'vue';
import type { Ref } from 'vue';
import { apiService } from 'src/services/api';
import { wsService } from 'src/services/websocket';
import { getCurrentUser } from 'src/utils/auth';
import type { Message, MessageData } from 'src/services/models';
import type { QScrollArea } from 'quasar';
import { Notify } from 'quasar';
import { cacheChannelMessages, loadCachedMessages } from 'src/utils/messageCache';

const MESSAGE_LIMIT = 50;

export function useChannelMessages(
  channelId: Ref<string>,
  channelName: Ref<string>,
  currentUserId: Ref<string | undefined>,
) {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const hasMoreMessages = ref(false);
  const currentLoadedPage = ref(1);
  const isUserAtBottom = ref(true);
  const scrollAreaRef = ref<QScrollArea | null>(null);

  async function loadAllMessages() {
    const channelIdNum = Number(channelId.value);
    if (isNaN(channelIdNum)) {
      console.log('Skipping message load - channelId is not a number:', channelId.value);
      messages.value = [];
      return;
    }

    try {
      const response = await apiService.getChannelMessages(channelIdNum, 1, MESSAGE_LIMIT);
      console.log('Loaded messages from backend:', response.data.length, 'messages');
      console.log('Pagination info:', response.meta);

      messages.value = response.data
        .map((msg) => ({
          name: msg.user.nickname,
          text: [msg.text],
          stamp: new Date(msg.sendAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          sent: msg.userId === Number(getCurrentUser()?.id),
          isCommand: false,
          channelId: String(msg.channelId),
          mentionedUserIds: msg.mentionedUserIds || [],
        }))
        .reverse();

      console.log('Converted messages:', messages.value.length);

      // Backend uses camelCase for pagination fields
      const currentPage = response.meta.currentPage;
      const lastPage = response.meta.lastPage;

      console.log('Checking pagination:', {
        currentPage: currentPage,
        lastPage: lastPage,
        comparison: currentPage < lastPage,
      });

      const hasMore = currentPage < lastPage;
      hasMoreMessages.value = hasMore;
      currentLoadedPage.value = currentPage;
      console.log('Has more messages?', hasMore);

      // Cache messages after successful load
      cacheChannelMessages(channelId.value, messages.value);
    } catch (error) {
      console.error('Error loading messages:', error);
      messages.value = [];
      currentLoadedPage.value = 1;
    }
  }

  async function loadOlderMessages() {
    if (isLoading.value || !hasMoreMessages.value) {
      console.log('Skipping load:', {
        isLoading: isLoading.value,
        hasMore: hasMoreMessages.value,
      });
      return;
    }

    console.log('⬆Loading older messages...');
    isLoading.value = true;

    try {
      const channelIdNum = Number(channelId.value);
      if (isNaN(channelIdNum)) return;

      const scrollTarget = scrollAreaRef.value?.getScrollTarget();
      const oldScrollHeight = scrollTarget?.scrollHeight || 0;

      const nextPage = currentLoadedPage.value + 1;

      console.log(
        'Loading page:',
        nextPage,
        'Current loaded page:',
        currentLoadedPage.value,
        'Total messages:',
        messages.value.length,
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await apiService.getChannelMessages(channelIdNum, nextPage, MESSAGE_LIMIT);
      console.log('Loaded', response.data.length, 'older messages');

      if (response.data.length > 0) {
        const olderMessages = response.data
          .map((msg) => ({
            name: msg.user.nickname,
            text: [msg.text],
            stamp: new Date(msg.sendAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            sent: msg.userId === Number(getCurrentUser()?.id),
            isCommand: false,
            channelId: String(msg.channelId),
            mentionedUserIds: msg.mentionedUserIds || [],
          }))
          .reverse();

        messages.value = [...olderMessages, ...messages.value];
        console.log('Total messages now:', messages.value.length);

        const currentPage = response.meta.currentPage;
        const lastPage = response.meta.lastPage;
        console.log('Has more?', currentPage < lastPage);

        hasMoreMessages.value = currentPage < lastPage;
        currentLoadedPage.value = currentPage;
      } else {
        console.log('No more messages to load');
        hasMoreMessages.value = false;
      }

      await nextTick();
      if (scrollTarget) {
        const newScrollHeight = scrollTarget.scrollHeight;
        const scrollDiff = newScrollHeight - oldScrollHeight;
        scrollAreaRef.value?.setScrollPosition('vertical', scrollDiff, 0);
        console.log('Restored scroll position, diff:', scrollDiff);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      isLoading.value = false;
      console.log('Loading complete');
    }
  }

  async function addMessage(text: string) {
    const channelIdNum = Number(channelId.value);
    if (isNaN(channelIdNum)) {
      console.error('Cannot send message - channelId is not a number:', channelId.value);
      Notify.create({
        type: 'negative',
        message: 'Invalid channel',
      });
      return;
    }

    try {
      console.log('Sending message to backend:', text, 'channelId:', channelIdNum);
      const response = await apiService.sendMessage(channelIdNum, text);
      console.log('Message sent successfully, response:', response);

      if (isUserAtBottom.value) {
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Notify.create({
        type: 'negative',
        message: 'Failed to send message',
      });
    }
  }

  function scrollToBottom(instant = false) {
    void nextTick(() => {
      if (scrollAreaRef.value) {
        const scrollTarget = scrollAreaRef.value.getScrollTarget();
        const scrollHeight = scrollTarget.scrollHeight;
        const duration = instant ? 0 : 300;
        scrollAreaRef.value.setScrollPosition('vertical', scrollHeight, duration);
      }
    });
  }

  function handleScroll(info: {
    verticalPosition: number;
    verticalSize: number;
    verticalContainerSize: number;
  }) {
    const { verticalPosition, verticalSize, verticalContainerSize } = info;
    const scrollBottom = verticalSize - verticalPosition - verticalContainerSize;
    isUserAtBottom.value = scrollBottom < 100;

    if (verticalPosition < 100 && !isLoading.value && hasMoreMessages.value) {
      console.log('Near top, triggering load. Position:', verticalPosition);
      void loadOlderMessages();
    }
  }

  // Named handlers so we can remove only these specific listeners
  function handleNewMessage(data: MessageData) {
    if (String(data.channelId) !== channelId.value) {
      return;
    }

    const newMessage: Message = {
      name: data.user.nickname,
      text: [data.text],
      stamp: new Date(data.sendAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sent: String(data.userId) === currentUserId.value,
      isCommand: false,
      channelId: String(data.channelId),
      mentionedUserIds: data.mentionedUserIds || [],
    };

    messages.value.push(newMessage);

    // Browser notifications are now handled globally in MainLayout
    // This keeps the message display logic clean and focused

    if (isUserAtBottom.value) {
      scrollToBottom();
    }
  }

  function handleSilentMessage(data: MessageData) {
    if (String(data.channelId) !== channelId.value) return;

    const newMessage: Message = {
      name: data.user.nickname,
      text: [data.text],
      stamp: new Date(data.sendAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sent: String(data.userId) === currentUserId.value,
      isCommand: false,
      channelId: String(data.channelId),
      mentionedUserIds: data.mentionedUserIds || [],
    };
    messages.value.push(newMessage);

    if (isUserAtBottom.value) {
      scrollToBottom();
    }
  }

  function setupMessageListeners() {
    // Remove only OUR specific handlers, not all message:new listeners
    wsService.socket?.off('message:new', handleNewMessage);
    wsService.socket?.off('message:new:silent', handleSilentMessage);

    // Re-register our handlers
    wsService.onMessage(handleNewMessage);
    wsService.onMessageSilent(handleSilentMessage);
  }

  function clearMessages() {
    messages.value = [];
    currentLoadedPage.value = 1;
  }

  function loadMessagesFromCache() {
    const cached = loadCachedMessages(channelId.value);
    if (cached && cached.length > 0) {
      console.log(`Loading ${cached.length} messages from cache for channel ${channelId.value}`);
      messages.value = cached;
      return true;
    }
    return false;
  }

  return {
    messages,
    isLoading,
    hasMoreMessages,
    isUserAtBottom,
    scrollAreaRef,
    loadAllMessages,
    loadOlderMessages,
    addMessage,
    scrollToBottom,
    handleScroll,
    setupMessageListeners,
    clearMessages,
    loadMessagesFromCache,
  };
}
