<template>
  <q-page class="channel-page">
    <!-- Channel Header -->
    <div class="channel-header">
      <div class="channel-title"><span class="channel-hash">#</span>{{ channelName }}</div>
      <q-btn
        flat
        dense
        round
        icon="group"
        aria-label="Toggle Members"
        @click="toggleMembersPanel"
        class="header-btn"
      />
    </div>

    <!-- Main content area -->
    <div class="channel-content">
      <!-- Chat area -->
      <div class="chat-area-wrapper">
        <q-scroll-area ref="scrollAreaRef" class="chat-main" @scroll="handleScroll">
          <!-- Loading indicator -->
          <div v-if="isLoading" class="loading-older">
            <q-spinner color="primary" size="24px" />
            <span class="loading-text">Loading messages...</span>
          </div>

          <ChatArea
            :message-file="messageFile"
            :all-messages="allMessages"
            :current-user-nickname="currentUserNickname"
            :current-user-id="currentUser?.id ? Number(currentUser.id) : undefined"
            @update-messages="messages = $event"
          />
        </q-scroll-area>

        <!-- Typing Indicator -->
        <div v-if="typingUsers.length > 0" class="typing-indicator-container">
          <q-icon name="edit" color="primary" size="16px" class="typing-icon" />
          <span class="typing-text">
            <strong>{{ typingUsersText }}</strong>
            {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
          </span>
        </div>

        <CommandLine
          class="chat-input"
          :current-user-id="currentUser?.id"
          @send-message="addMessage"
          @command="executeCommand"
        />
      </div>

      <!-- Members panel -->
      <transition name="slide-left">
        <div v-if="showMembersPanel" class="members-panel">
          <MembersList :members="channelMembers" />
        </div>
      </transition>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { QScrollArea, Notify } from 'quasar';
import ChatArea from 'src/components/ChatArea.vue';
import CommandLine from 'src/components/CommandLine.vue';
import MembersList from 'src/components/MembersList.vue';
import type { Message, Member, Command } from 'src/components/models';
import { getCurrentUser } from 'src/utils/auth';
import { useChannels } from 'src/utils/useChannels';
import { apiService } from 'src/services/api';
import type { TypingData } from 'src/services/websocket';
import { wsService } from 'src/services/websocket';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// Reactive user state
const showMembersPanel = ref(true);
const messages = ref<Message[]>([]);
const members = ref<{ [key: string]: Member[] }>({});
const scrollAreaRef = ref<QScrollArea | null>(null);

// Infinite scroll state
const isLoading = ref(false);
const hasMoreMessages = ref(false);
const MESSAGE_LIMIT = 20;
const isUserAtBottom = ref(true);

const channelId = computed(() => (route.params.id as string) || 'general');
const messageFile = computed(() => (route.query.file as string) || '');

const { channels } = useChannels();

const selectedChannel = computed(() =>
  channels.value.find(ch => ch.id === channelId.value)
);

const channelName = computed(() => {
  return selectedChannel.value
    ? selectedChannel.value.name
    : `channel-${channelId.value}`;
});
const channelMembers = computed(() => {
  const membersInChannel = members.value[channelId.value] || [];

  if (currentUser.value) {
    const currentUserInList = membersInChannel.find(
      (member) => member.id === currentUser.value?.id,
    );

    if (!currentUserInList) {
      return [...membersInChannel, currentUser.value];
    }
  }

  return membersInChannel;
});
const allMessages = computed(() => messages.value);

const currentUser = computed(() => getCurrentUser());
const currentUserNickname = computed(() => currentUser.value?.nickName || '');

// Typing users tracking
const typingUsers = ref<{ id: string; nickName: string; typingText?: string }[]>([]);
const typingUsersText = computed(() => {
  if (typingUsers.value.length === 0) return '';
  if (typingUsers.value.length === 1) return typingUsers.value[0]?.nickName || '';
  if (typingUsers.value.length === 2) {
    return `${typingUsers.value[0]?.nickName} and ${typingUsers.value[1]?.nickName}`;
  }
  return `${typingUsers.value[0]?.nickName} and ${typingUsers.value.length - 1} others`;
});

onMounted(async () => {
  try {
    const channelIdNum = Number(channelId.value);

    // Join the channel room on WebSocket
    if (!isNaN(channelIdNum)) {
      console.log('Joining WebSocket channel room:', channelId.value);
      wsService.joinChannel(channelId.value);
    }

    const response = await apiService.getChannelMembers(channelIdNum);

    members.value[channelId.value] = response.members.map(
      (m): Member => ({
        id: String(m.userId),
        firstName: '',
        lastName: '',
        nickName: m.nickname,
        email: '',
        password: '',
        status: m.status,
        channels: [channelId.value],
      }),
    );

    await loadAllMessages();
    setupMembersListeners();
    setupTypingListeners();
    setupMessageListeners();
  } catch (error) {
    console.error('Error loading members:', error);
  }
});

onMounted(() => {
  if ($q.screen.lt.md) {
    showMembersPanel.value = false;
  }
});

watch(
  () => $q.screen.width,
  () => {
    if ($q.screen.lt.md) {
      showMembersPanel.value = false;
    }
  }
);


onBeforeUnmount(() => {
  // Leave the channel room when component unmounts
  const channelIdNum = Number(channelId.value);
  if (!isNaN(channelIdNum)) {
    console.log('Leaving WebSocket channel room:', channelId.value);
    wsService.leaveChannel(channelId.value);
  }
});

function setupMembersListeners() {
  wsService.onUserJoinedChannel(async (data) => {
    if (data.channelId !== channelId.value) return;

    const channelIdNum = Number(channelId.value);

    // Завантажуємо оновлений список учасників
    const response = await apiService.getChannelMembers(channelIdNum);

    members.value[channelId.value] = response.members.map(
      (m): Member => ({
        id: String(m.userId),
        firstName: '',
        lastName: '',
        nickName: m.nickname,
        email: '',
        password: '',
        status: m.status,
        channels: [channelId.value],
      }),
    );
  });

  wsService.onUserLeftChannel((data) => {
    if (data.channelId === channelId.value) {
      const channelMembers = members.value[channelId.value];
      if (!channelMembers) return;

      const index = channelMembers.findIndex((m) => m.id === String(data.userId));
      if (index !== -1) {
        channelMembers.splice(index, 1);
      }
    }
  });
}

function setupTypingListeners() {
  wsService.onUserTyping((data: TypingData) => {
    if (data.channelId === channelId.value && data.userId !== currentUser.value?.id) {
      const existingIndex = typingUsers.value.findIndex((u) => u.id === data.userId);

      if (existingIndex !== -1) {
        typingUsers.value[existingIndex]!.typingText = data.text;
      } else {
        typingUsers.value.push({
          id: data.userId,
          nickName: data.nickname,
          typingText: data.text,
        });
      }
    }
  });

  wsService.onUserStoppedTyping((data) => {
    if (data.channelId === channelId.value) {
      const index = typingUsers.value.findIndex((u) => u.id === data.userId);
      if (index !== -1) {
        typingUsers.value.splice(index, 1);
      }
    }
  });
}

function setupMessageListeners() {
  // Remove any existing listeners first to avoid duplicates
  wsService.socket?.off('message:new');

  console.log('Setting up message listeners for channel:', channelId.value);

  wsService.onMessage((data) => {
    console.log('Received message via WebSocket:', data);
    console.log('Current channelId:', channelId.value);
    console.log('Message channelId:', data.channelId);

    // Only add message if it's for this channel
    if (String(data.channelId) === channelId.value) {
      const newMessage: Message = {
        name: data.user.nickname,
        text: [data.text],
        stamp: new Date(data.sendAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sent: String(data.userId) === currentUser.value?.id,
        isCommand: false,
        channelId: String(data.channelId),
        mentionedUserIds: data.mentionedUserIds || [],
      };

      console.log('Adding message to channel:', newMessage);
      messages.value.push(newMessage);
      console.log('Total messages now:', messages.value.length);

      // Show notification based on user settings
      const isMentioned =
        data.mentionedUserIds &&
        currentUser.value?.id &&
        data.mentionedUserIds.includes(Number(currentUser.value.id));

      // Check if message is not from current user
      const isFromOtherUser = String(data.userId) !== currentUser.value?.id;

      if (isFromOtherUser && currentUser.value) {
        // If user wants notifications only for mentions
        if (currentUser.value.notifyOnMentionOnly) {
          if (isMentioned) {
            Notify.create({
              type: 'info',
              message: `${data.user.nickname} mentioned you in #${channelName.value}`,
              position: 'top-right',
              timeout: 3000,
            });
          }
        } else {
          // Show notification for all messages
          Notify.create({
            type: 'info',
            message: isMentioned
              ? `${data.user.nickname} mentioned you in #${channelName.value}`
              : `New message from ${data.user.nickname} in #${channelName.value}`,
            position: 'top-right',
            timeout: 3000,
          });
        }
      }

      if (isUserAtBottom.value) {
        scrollToBottom();
      }
    } else {
      console.log('Message is for different channel, ignoring');
    }
  });
}

async function loadAllMessages() {
  // Skip loading if channelId is not a valid number
  const channelIdNum = Number(channelId.value);
  if (isNaN(channelIdNum)) {
    console.log('Skipping message load - channelId is not a number:', channelId.value);
    messages.value = [];
    return;
  }

  try {
    // Load messages from backend
    const response = await apiService.getChannelMessages(channelIdNum, 1, 100);
    console.log('Loaded messages from backend:', response.data.length, 'messages');

    // Convert backend messages to frontend format
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
    hasMoreMessages.value = response.meta.current_page < response.meta.last_page;
  } catch (error) {
    console.error('Error loading messages:', error);
    messages.value = [];
  }
}

function toggleMembersPanel() {
  showMembersPanel.value = !showMembersPanel.value;
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

  if (verticalPosition < 50 && !isLoading.value && hasMoreMessages.value) {
    void loadOlderMessages();
  }
}

async function loadOlderMessages() {
  if (isLoading.value || !hasMoreMessages.value) return;

  isLoading.value = true;

  try {
    const channelIdNum = Number(channelId.value);
    if (isNaN(channelIdNum)) return;

    const scrollTarget = scrollAreaRef.value?.getScrollTarget();
    const oldScrollHeight = scrollTarget?.scrollHeight || 0;

    // Calculate next page to load
    const currentPage = Math.floor(messages.value.length / MESSAGE_LIMIT) + 1;
    const nextPage = currentPage + 1;

    // Load next page of messages
    const response = await apiService.getChannelMessages(channelIdNum, nextPage, MESSAGE_LIMIT);

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
      hasMoreMessages.value = response.meta.current_page < response.meta.last_page;
    } else {
      hasMoreMessages.value = false;
    }

    await nextTick();
    if (scrollTarget) {
      const newScrollHeight = scrollTarget.scrollHeight;
      const scrollDiff = newScrollHeight - oldScrollHeight;
      scrollAreaRef.value?.setScrollPosition('vertical', scrollDiff, 0);
    }
  } catch (error) {
    console.error('Error loading older messages:', error);
  } finally {
    isLoading.value = false;
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
    // Send message to backend
    const response = await apiService.sendMessage(channelIdNum, text);
    console.log('Message sent successfully, response:', response);

    // The message will be received via WebSocket broadcast
    // So we don't need to manually add it here
    // Backend will broadcast it to all channel members including sender

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

async function executeCommand(command: Command) {
  const commandName = command.name.toLowerCase();
  const args = command.args;

  try {
    switch (command.name) {
      case 'list':
        showNotification('Members list displayed', 'info');
        showMembersPanel.value = true;
        break;
      case 'join': {
        const channelName = args[0];
        const isPrivate = args[1]?.toLowerCase() === 'private';

        if (!channelName) {
          showNotification('Usage: /join <channelName> [private]', 'warning');
          return;
        }

        const { joinChannel: join, createChannel } = useChannels();

        try {
          // Try to join existing channel first
          const channel = await join(channelName);
          if (channel) {
            showNotification(`Joined channel #${channel.name}`, 'positive');
            void router.push(`/channel/${channel.id}`);
          }
        } catch (err) {
          const error = err as { response?: { data?: { message?: string } } };

          // If channel doesn't exist and user specified 'private', create it
          if (
            error.response?.data?.message?.includes('not found') ||
            error.response?.data?.message?.includes('does not exist')
          ) {
            if (isPrivate) {
              // Create private channel
              try {
                const newChannel = await createChannel(channelName, true);
                if (newChannel) {
                  showNotification(
                    `Created and joined private channel #${channelName}`,
                    'positive',
                  );
                  void router.push(`/channel/${newChannel.id}`);
                }
              } catch (createErr) {
                const createError = createErr as { response?: { data?: { message?: string } } };
                showNotification(
                  createError.response?.data?.message || 'Failed to create channel',
                  'negative',
                );
              }
            } else {
              showNotification(
                error.response?.data?.message ||
                  'Channel not found. Use "/join <name> private" to create a new private channel.',
                'negative',
              );
            }
          } else {
            showNotification(error.response?.data?.message || 'Failed to join channel', 'negative');
          }
        }
        break;
      }
      case 'quit': {
        const { deleteChannel } = useChannels();
        const quitChannelId = Number(channelId.value);

        await deleteChannel(quitChannelId);
        showNotification('Channel deleted', 'positive');
        void router.push('/');
        break;
      }
      case 'cancel': {
        const { leaveChannel } = useChannels();
        const cancelChannelId = Number(channelId.value);

        await leaveChannel(cancelChannelId);
        showNotification('Left channel', 'positive');
        void router.push('/');
        break;
      }
      case 'kick': {
        const kickNickname = args[0];
        if (!kickNickname) {
          showNotification('Usage: /kick <nickname>', 'warning');
          return;
        }

        const kickChannelId = Number(channelId.value);
        const kickResponse = await apiService.kickFromChannelByNickname(
          kickChannelId,
          kickNickname,
        );
        showNotification(kickResponse.message, 'positive');
        break;
      }
      case 'revoke': {
        const revokeNickname = args[0];
        if (!revokeNickname) {
          showNotification('Usage: /revoke <nickname>', 'warning');
          return;
        }

        // Revoke is same as kick for removing user from channel
        // But in private channels, admin can use /invite to restore access
        const revokeChannelId = Number(channelId.value);
        const revokeResponse = await apiService.kickFromChannelByNickname(
          revokeChannelId,
          revokeNickname,
        );
        showNotification(
          `Revoked access for ${revokeNickname}: ${revokeResponse.message}`,
          'positive',
        );
        break;
      }
      case 'invite': {
        const inviteNickname = args[0];
        if (!inviteNickname) {
          showNotification('Usage: /invite <nickname>', 'warning');
          return;
        }

        const inviteChannelId = Number(channelId.value);

        await apiService.inviteToChannelByNickname(inviteChannelId, inviteNickname);
        showNotification(`Invited ${inviteNickname} to channel`, 'positive');

        // 🔥 Автоматично оновлюємо список учасників без перезавантаження
        const response = await apiService.getChannelMembers(inviteChannelId);

        members.value[channelId.value] = response.members.map(m => ({
          id: String(m.userId),
          firstName: "",
          lastName: "",
          nickName: m.nickname,
          email: "",
          password: "",
          status: m.status,
          channels: [channelId.value],
        }));

        break;
      }
      default:
        showNotification(`Unknown command: /${commandName}`, 'warning');
    }
  } catch (err) {
    const error = err as { response?: { data?: { message?: string } } };
    showNotification(
      error.response?.data?.message || `Failed to execute command: /${commandName}`,
      'negative',
    );
  }
}

function showNotification(message: string, type: 'positive' | 'negative' | 'warning' | 'info') {
  Notify.create({ type, message, position: 'top' });
}

// Clear messages and typing indicators when switching channels
watch(channelId, async (newChannelId, oldChannelId) => {
  // Leave old channel room
  if (oldChannelId && !isNaN(Number(oldChannelId))) {
    console.log('Leaving old channel room:', oldChannelId);
    wsService.leaveChannel(oldChannelId);
  }

  // Join new channel room
  if (newChannelId && !isNaN(Number(newChannelId))) {
    console.log('Joining new channel room:', newChannelId);
    wsService.joinChannel(newChannelId);
  }

  messages.value = [];
  typingUsers.value = [];
  await loadAllMessages();
  scrollToBottom(true);
});

// Scroll down with new message
watch(
  messages,
  () => {
    if (isUserAtBottom.value) {
      scrollToBottom(true);
    }
  },
  { flush: 'post' },
);
</script>

<style scoped>
.channel-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

/* Channel Header */
.channel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  min-height: 48px;
  background: #313338;
  box-shadow:
    0 1px 0 rgba(4, 4, 5, 0.2),
    0 1.5px 0 rgba(6, 6, 7, 0.05),
    0 2px 0 rgba(4, 4, 5, 0.05);
  border-bottom: 1px solid #26282c;
}

.channel-title {
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
  letter-spacing: 0.02em;
}

.channel-hash {
  color: #80848e;
  margin-right: 4px;
  font-weight: 500;
}

.header-btn {
  color: #b5bac1;
  transition: color 0.2s ease;
}

.header-btn:hover {
  color: #dbdee1;
  background: rgba(79, 84, 92, 0.16);
}

/* Mobile header */
@media (max-width: 767px) {
  .channel-header {
    padding: 0 12px;
    min-height: 44px;
  }

  .channel-title {
    font-size: 15px;
  }
}

/* Channel Content */
.channel-content {
  flex: 1 1 auto;
  display: flex;
  overflow: hidden;
  background: #36393f;
}

/* Chat Area */
.chat-area-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-main {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chat-input {
  flex: 0 0 auto;
  background: transparent;
}

/* Typing Indicator */
.typing-indicator-container {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(79, 84, 92, 0.2);
  border-top: 1px solid rgba(79, 84, 92, 0.3);
  animation: fadeIn 0.2s ease-in;
}

.typing-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

.typing-text {
  color: #b5bac1;
  font-size: 13px;
  font-style: italic;
}

.typing-text strong {
  color: #dcddde;
  font-weight: 600;
  font-style: normal;
}

/* Mobile typing indicator */
@media (max-width: 767px) {
  .typing-indicator-container {
    padding: 6px 12px;
    gap: 6px;
  }

  .typing-text {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .typing-icon {
    flex-shrink: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Loading Indicator */
.loading-older {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: rgba(79, 84, 92, 0.08);
  border-radius: 8px;
  margin: 16px;
}

.loading-text {
  color: #b5bac1;
  font-size: 14px;
  font-weight: 500;
}

/* Members Panel */
.members-panel {
  flex: 0 0 280px;
  width: 280px;
  background: #2f3136;
  border-left: 1px solid #1e1f22;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Tablet breakpoint */
@media (max-width: 1024px) {
  .members-panel {
    flex: 0 0 240px;
    width: 240px;
  }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .members-panel {
    position: fixed;
    top: 48px;
    right: 0;
    bottom: 0;
    width: 85%;
    max-width: 320px;
    z-index: 1000;
  }

  .channel-header {
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

/* Slide animation */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.chat-main::-webkit-scrollbar {
  width: 0 !important;
}

.chat-main {
  scrollbar-width: none !important; /* Firefox */
}

/* Ховаємо Quasar кастомний скролбар */
.chat-main .q-scrollarea__thumb {
  opacity: 0 !important;
}

.chat-main .q-scrollarea__track {
  opacity: 0 !important;
}

</style>
