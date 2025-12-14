<template>
  <q-page class="channel-page">
    <!-- Channel Header -->
    <div class="channel-header">
      <div class="channel-title">
        <q-icon v-if="selectedChannel?.isPrivate" name="lock" size="18px" class="channel-lock" />
        <span v-else class="channel-hash">#</span>

        {{ channelName }}
      </div>

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

    <!-- Offline Mode Banner -->
    <transition name="slide-down">
      <div v-if="isOfflineMode" class="offline-banner">
        <q-icon name="cloud_off" size="20px" class="offline-icon" />
        <span class="offline-text">Offline Mode - Viewing cached messages</span>
      </div>
    </transition>

    <!-- Main content area -->
    <div class="channel-content">
      <!-- Chat area -->
      <div class="chat-area-wrapper">
        <q-scroll-area ref="scrollAreaRef" class="chat-main" @scroll="handleScroll">
          <!-- Loading indicator -->
          <div v-if="isLoading" class="loading-older">
            <q-spinner color="primary" size="32px" />
            <span class="loading-text">Loading older messages...</span>
          </div>

          <ChatArea
            :all-messages="allMessages"
            :current-user-nickname="currentUserNickname"
            :current-user-id="currentUser?.id ? Number(currentUser.id) : undefined"
          />
        </q-scroll-area>

        <!-- Typing Indicator -->
        <div v-if="typingUsers.length > 0" class="typing-indicator-container">
          <q-icon name="edit" color="primary" size="16px" class="typing-icon" />
          <span class="typing-text">
            <strong class="typing-nickname-link" @click="showTypingPreview">{{
              typingUsersText
            }}</strong>
            {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
          </span>
        </div>

        <!-- Typing Preview Dialog -->
        <q-dialog v-model="showTypingDialog">
          <q-card style="min-width: 400px">
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">{{ selectedTypingUser?.nickName }} is typing...</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section>
              <div class="typing-preview">
                <q-icon name="edit" color="primary" size="24px" />
                <div class="preview-text">
                  {{ selectedTypingUser?.typingText || 'Nothing yet...' }}
                  <span class="blinking-cursor">|</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-dialog>

        <CommandLine
          class="chat-input"
          :current-user-id="currentUser?.id"
          @send-message="addMessage"
          @command="handleCommand"
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, Notify } from 'quasar';
import ChatArea from 'src/components/ChatArea.vue';
import CommandLine from 'src/components/CommandLine.vue';
import MembersList from 'src/components/MembersList.vue';
import type { Member, Command, TypingData } from 'src/services/models';
import { getCurrentUser } from 'src/utils/auth';
import { useChannels } from 'src/utils/channels';
import { apiService } from 'src/services/api';
import { wsService } from 'src/services/websocket';
import { executeCommand } from 'src/utils/commands';
import { useChannelMessages } from 'src/utils/ChannelMessages';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// Get loadChannels from useChannels composable
const { loadChannels, channels } = useChannels();

// Reactive user state
const showMembersPanel = ref(true);
const members = ref<{ [key: string]: Member[] }>({});

const channelId = computed(() => route.params.id as string);
const selectedChannel = computed(() => channels.value.find((ch) => ch.id === channelId.value));

const channelName = computed(() => {
  return selectedChannel.value ? selectedChannel.value.name : `channel-${channelId.value}`;
});

const currentUser = computed(() => getCurrentUser());
const currentUserNickname = computed(() => currentUser.value?.nickName || '');
const currentUserId = computed(() => currentUser.value?.id);

// Use messages composable
const {
  messages,
  isLoading,
  isUserAtBottom,
  scrollAreaRef,
  loadAllMessages,
  addMessage,
  scrollToBottom,
  handleScroll,
  setupMessageListeners,
  clearMessages,
  loadMessagesFromCache,
} = useChannelMessages(channelId, channelName, currentUserId);

// Track if we're in offline mode
const isOfflineMode = ref(false);

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

function handleCommand(command: Command) {
  void executeCommand(command, channelId, members, showMembersPanel, router);
}

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

// Typing preview dialog
const showTypingDialog = ref(false);
const selectedTypingUser = ref<{ id: string; nickName: string; typingText?: string } | null>(null);

function showTypingPreview() {
  // Only show preview if there's exactly one user typing
  if (typingUsers.value.length === 1) {
    selectedTypingUser.value = typingUsers.value[0]!;
    showTypingDialog.value = true;
  }
}

// Update selected typing user in real-time when they continue typing
watch(
  typingUsers,
  (newTypingUsers) => {
    if (selectedTypingUser.value && showTypingDialog.value) {
      const updated = newTypingUsers.find((u) => u.id === selectedTypingUser.value?.id);
      if (updated) {
        selectedTypingUser.value = updated;
      } else {
        // User stopped typing - close dialog
        showTypingDialog.value = false;
        selectedTypingUser.value = null;
      }
    }
  },
  { deep: true },
);

// Function to initialize WebSocket-related functionality
function initializeWebSocketFeatures() {
  const channelIdNum = Number(channelId.value);

  if (!isNaN(channelIdNum) && wsService.isConnected()) {
    //console.log('Initializing WebSocket features for channel:', channelId.value);

    // Join channel room
    wsService.joinChannel(channelId.value);

    // Setup status change listener
    wsService.onUserStatusChanged((data) => {
      //console.log('User status changed:', data);

      const channelMembers = members.value[channelId.value];
      if (channelMembers) {
        const member = channelMembers.find((m) => m.id === String(data.userId));
        if (member) {
          member.status = data.status;
        }
      }
    });

    // Setup all listeners
    setupMembersListeners();
    setupTypingListeners();
    setupMessageListeners();

    //console.log('WebSocket features initialized');
  }
}

// Listen for WebSocket reconnection
async function handleWebSocketReconnect() {
  //console.log('WebSocket reconnected - reinitializing features and reloading data');
  isOfflineMode.value = false;

  // Only reload if we're on a channel page
  if (!channelId.value) {
    console.log('Not on a channel page, skipping reload');
    return;
  }

  try {
    const channelIdNum = Number(channelId.value);
    if (isNaN(channelIdNum)) {
      console.error('Invalid channelId on reconnect:', channelId.value);
      return;
    }

    // Reload members
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

    // Reinitialize WebSocket features
    initializeWebSocketFeatures();

    // Reload messages (fresh from server, replacing cache)
    await loadAllMessages();
  } catch (error) {
    console.error('Error reloading data after reconnect:', error);
  }
}

onMounted(async () => {
  try {
    const channelIdNum = Number(channelId.value);

    // Check if user is online before loading data
    const isOnline = wsService.isConnected();

    if (isOnline) {
      isOfflineMode.value = false;

      // Load members (only when online)
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

      // Initialize WebSocket features
      initializeWebSocketFeatures();

      // Load messages
      await loadAllMessages();
    } else {
      console.log('User is offline - loading cached messages');
      isOfflineMode.value = true;

      // Try to load cached messages
      const hasCache = loadMessagesFromCache();
      if (!hasCache) {
        console.log('No cached messages available for this channel');
      }
    }

    // Always listen for WebSocket reconnection events (even if offline now)
    window.addEventListener('websocket:connected', () => void handleWebSocketReconnect());

    // Listen for kick/revoke events
    window.addEventListener('channel:kicked', handleKicked);
    window.addEventListener('channel:revoked', handleRevoked);
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
  },
);

watch(
  () => currentUser.value?.status,
  (newStatus, oldStatus) => {
    if (oldStatus === 'offline' && newStatus !== 'offline') {
      //console.log('User status changed from offline to', newStatus);
      // WebSocket reconnection will be handled by the global event listener
      // Just reload channels list
      void loadChannels();
    }
  },
);

// Store event handlers so we can properly remove them
const handleKicked = ((event: CustomEvent) => {
  const { channelId: kickedChannelId, channelName, kickedBy } = event.detail;
  if (kickedChannelId === channelId.value) {
    Notify.create({
      type: 'negative',
      message: `You were kicked from #${channelName} by ${kickedBy}`,
      position: 'top',
      timeout: 5000,
    });
    void router.push('/');
  }
}) as EventListener;

const handleRevoked = ((event: CustomEvent) => {
  const { channelId: revokedChannelId, channelName, revokedBy } = event.detail;
  if (revokedChannelId === channelId.value) {
    Notify.create({
      type: 'negative',
      message: `Your access to #${channelName} was revoked by ${revokedBy}`,
      position: 'top',
      timeout: 5000,
    });
    void router.push('/');
  }
}) as EventListener;

onBeforeUnmount(() => {
  // Remove WebSocket reconnect listener
  window.removeEventListener('websocket:connected', () => void handleWebSocketReconnect());

  // Remove kick/revoke event listeners
  window.removeEventListener('channel:kicked', handleKicked);
  window.removeEventListener('channel:revoked', handleRevoked);

  // Leave the channel room when component unmounts (only if WebSocket is connected)
  const channelIdNum = Number(channelId.value);
  if (!isNaN(channelIdNum) && wsService.isConnected()) {
    //console.log('Leaving WebSocket channel room:', channelId.value);
    wsService.leaveChannel(channelId.value);
  }
});

function setupMembersListeners() {
  //console.log('setupMembersListeners() called');

  wsService.onUserJoinedChannel((data) => {
    // console.log(
    //   'user:joined-channel event, channelId.value:',
    //   channelId.value,
    //   'event channelId:',
    //   data.channelId,
    // );

    if (!channelId.value || String(data.channelId) !== channelId.value) {
      //console.log('Skipping - channelId mismatch or undefined');
      return;
    }

    const channelIdNum = Number(channelId.value);
    if (isNaN(channelIdNum)) {
      //console.error('Invalid channelId:', channelId.value);
      return;
    }

    //console.log('Loading members for channel:', channelIdNum);
    void apiService.getChannelMembers(channelIdNum).then((response) => {
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
  });

  wsService.onUserLeftChannel((data) => {
    if (!channelId.value || String(data.channelId) !== channelId.value) {
      return;
    }

    const channelMembers = members.value[channelId.value];
    if (!channelMembers) {
      return;
    }

    const index = channelMembers.findIndex((m) => m.id === String(data.userId));
    if (index !== -1) {
      channelMembers.splice(index, 1);
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

      const list = members.value[channelId.value];
      if (list) {
        const member = list.find((m) => m.id === String(data.userId));
        if (member) {
          member.isTyping = true;
          member.typingText = data.text;
        }
      }
    }
  });

  wsService.onUserStoppedTyping((data) => {
    if (data.channelId === channelId.value) {
      // remove from typingUsers
      const index = typingUsers.value.findIndex((u) => u.id === data.userId);
      if (index !== -1) typingUsers.value.splice(index, 1);

      // clean members
      const list = members.value[channelId.value];
      if (list) {
        const member = list.find((m) => m.id === String(data.userId));
        if (member) {
          member.isTyping = false;
          member.typingText = '';
        }
      }
    }
  });
}

function toggleMembersPanel() {
  showMembersPanel.value = !showMembersPanel.value;
}

// Clear messages and typing indicators when switching channels
watch(channelId, async (newChannelId, oldChannelId) => {
  // Clear UI state first
  clearMessages();
  typingUsers.value = [];

  // Only interact with WebSocket and load messages if connected (user is online)
  if (wsService.isConnected()) {
    isOfflineMode.value = false;

    // Leave old channel room
    if (oldChannelId && !isNaN(Number(oldChannelId))) {
      //console.log('Leaving old channel room:', oldChannelId);
      wsService.leaveChannel(oldChannelId);
    }

    // Join new channel room
    if (newChannelId && !isNaN(Number(newChannelId))) {
      //console.log('Joining new channel room:', newChannelId);
      wsService.joinChannel(newChannelId);
    }

    // Load messages for the new channel
    await loadAllMessages();
    scrollToBottom(true);
  } else {
    //console.log('User is offline - loading cached messages');
    isOfflineMode.value = true;

    // Try to load cached messages for the new channel
    const hasCache = loadMessagesFromCache();
    if (!hasCache) {
      console.log('No cached messages available for channel:', newChannelId);
    }
  }
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

/* Offline Mode Banner */
.offline-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(250, 166, 26, 0.15);
  border-bottom: 2px solid rgba(250, 166, 26, 0.4);
  animation: fadeIn 0.3s ease-in;
}

.offline-icon {
  color: #faa61a;
  flex-shrink: 0;
}

.offline-text {
  color: #faa61a;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Mobile offline banner */
@media (max-width: 767px) {
  .offline-banner {
    padding: 8px 12px;
    gap: 8px;
  }

  .offline-text {
    font-size: 13px;
  }

  .offline-icon {
    font-size: 18px;
  }
}

/* Slide down animation for offline banner */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
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

.typing-nickname-link {
  cursor: pointer;
  transition: color 0.2s ease;
}

.typing-nickname-link:hover {
  color: #00b0ff;
  text-decoration: underline;
}

.typing-preview {
  background: #383a40;
  border-radius: 8px;
  padding: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-text {
  color: #dcddde;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.blinking-cursor {
  animation: blink 1s infinite;
  color: #3ba55d;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
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
  gap: 16px;
  padding: 20px;
  background: rgba(88, 101, 242, 0.15);
  border-radius: 12px;
  margin: 16px;
  border: 1px solid rgba(88, 101, 242, 0.3);
  animation: fadeIn 0.3s ease-in;
}

.loading-text {
  color: #dcddde;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.3px;
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

.channel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #f2f3f5;
}

.channel-lock {
  color: #b5bac1;
}

.channel-hash {
  color: #80848e;
}
</style>
