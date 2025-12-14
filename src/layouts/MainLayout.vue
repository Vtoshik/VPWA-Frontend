<template>
  <q-layout view="lHh Lpr lFf" style="height: 100vh">
    <!-- LEFT SIDEBAR -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      class="bg-secondary left-drawer"
      :width="drawerWidth"
      :breakpoint="767"
      content-class="drawer-content"
    >
      <div class="drawer-inner bg-secondary">
        <div class="drawer-header-section">
          <div class="drawer-header-wrapper">
            <!-- TITLE -->
            <div class="drawer-header">Channels</div>

            <!-- HIDE DRAWER BUTTON -->
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="chevron_left"
              class="hide-drawer-btn"
              @click="leftDrawerOpen = false"
              aria-label="Hide sidebar"
            >
              <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
                Hide sidebar
              </q-tooltip>
            </q-btn>

            <!-- CREATE CHANNEL BUTTON -->
            <q-btn
              flat
              dense
              round
              size="sm"
              icon="add"
              class="create-channel-btn"
              @click="showCreateChannelDialog = true"
              aria-label="Create channel"
            >
              <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
                Create channel
              </q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- CHANNELS LIST -->
        <q-scroll-area class="drawer-scroll">
          <q-list class="channels-list">
            <ChannelComponent
              v-for="channel in availableChannels"
              :key="channel.id"
              :channel="channel"
              :is-selected="selectedChannel?.id === channel.id"
              :is-invited="invitations.some((inv) => String(inv.channelId) === channel.id)"
              @channel-selected="handleChannelSelected"
              @channel-left="loadChannels"
            />
          </q-list>
        </q-scroll-area>

        <!-- USER BAR -->
        <div class="drawer-userbar-container">
          <UserBar />
        </div>
      </div>

      <!-- RESIZE HANDLE -->
      <div class="resize-handle" @mousedown="startResize">
        <div class="resize-handle-line"></div>
      </div>
    </q-drawer>

    <!-- FLOATING OPEN-BUTTON -->
    <q-btn
      v-if="!leftDrawerOpen"
      class="open-drawer-btn"
      round
      color="primary"
      icon="menu"
      size="md"
      @click="leftDrawerOpen = true"
    />

    <!-- MAIN PAGE CONTENT -->
    <q-page-container class="full-height">
      <router-view />
    </q-page-container>

    <!-- CREATE CHANNEL DIALOG -->
    <q-dialog v-model="showCreateChannelDialog">
      <q-card class="create-channel-card">
        <q-card-section class="dialog-header">
          <div class="text-h6">Create Channel</div>
        </q-card-section>

        <q-card-section class="dialog-content">
          <q-input
            v-model="newChannelName"
            label="Channel Name"
            outlined
            dense
            autofocus
            :rules="[(val) => !!val || 'Channel name is required']"
            @keyup.enter="handleCreateChannel"
          />

          <q-checkbox
            v-model="newChannelIsPrivate"
            label="Private Channel"
            color="primary"
            class="private-checkbox"
          />

          <div class="channel-type-hint">
            {{
              newChannelIsPrivate ? 'Only invited members can join' : 'Anyone can join this channel'
            }}
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-actions">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Create"
            color="primary"
            class="create-btn"
            @click="handleCreateChannel"
            :disable="!newChannelName.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { Notify } from 'quasar';
import UserBar from 'src/components/UserBar.vue';
import { useRouter } from 'vue-router';
import ChannelComponent from 'src/components/ChannelComponent.vue';
import type { Channel, ApiError } from 'src/services/models';
import { useCurrentUser } from 'src/utils/CurrentUser';
import { useChannels } from 'src/utils/channels';
import { useGlobalNotifications } from 'src/utils/GlobalNotifications';
const leftDrawerOpen = ref(false);
const {
  channels,
  invitations,
  createChannel: createNewChannel,
  loadChannels,
  loadInvitations,
} = useChannels();
const { setupGlobalNotifications } = useGlobalNotifications();
const router = useRouter();
const selectedChannel = ref<Channel | null>(null);

// Create channel dialog state
const showCreateChannelDialog = ref(false);
const newChannelName = ref('');
const newChannelIsPrivate = ref(false);

// Resizable drawer state
const drawerWidth = ref(260);
const isResizing = ref(false);
const MIN_DRAWER_WIDTH = 200;
const MAX_DRAWER_WIDTH = 400;

// Use reactive user state
const { currentUser, userChannels, refreshUser } = useCurrentUser();

const availableChannels = computed(() => {
  if (!currentUser.value) return [];

  const userChannelIds = userChannels.value;

  // Get invited channel IDs from API invitations
  const invitedChannelIds = invitations.value.map((inv) => String(inv.channelId));

  // console.log('Computing availableChannels:', {
  //   userChannelIds,
  //   invitedChannelIds,
  //   allChannels: channels.value.map((ch) => ({ id: ch.id, name: ch.name })),
  // });

  // Include user's channels and invited channels
  const allChannels = channels.value.filter(
    (channel) => userChannelIds.includes(channel.id) || invitedChannelIds.includes(channel.id),
  );

  // console.log(
  //   'Filtered channels:',
  //   allChannels.map((ch) => ({ id: ch.id, name: ch.name })),
  // );

  // Sort: invited channels first, then regular channels
  return allChannels.sort((a, b) => {
    const aIsInvited = invitedChannelIds.includes(a.id);
    const bIsInvited = invitedChannelIds.includes(b.id);

    if (aIsInvited && !bIsInvited) return -1;
    if (!aIsInvited && bIsInvited) return 1;
    return 0;
  });
});

// Watch for route changes to reload channels
watch(
  () => router.currentRoute.value.params.id,
  () => {
    // Reload channels when navigating to a different channel
    void loadChannels();
  },
);

// Handle WebSocket reconnection
async function handleWebSocketReconnect() {
  console.log('WebSocket reconnected - reloading channels and invitations');
  setupGlobalNotifications();
  await loadChannels();
  await loadInvitations();
}

onMounted(() => {
  try {
    refreshUser();

    if (!currentUser.value) {
      console.warn('No authenticated user, redirecting to login');
      void router.push('/auth/login');
      return;
    }

    // Listen for WebSocket reconnection to reload data and setup notifications
    window.addEventListener('websocket:connected', () => void handleWebSocketReconnect());

    // Load drawer width from localStorage
    const savedWidth = localStorage.getItem('drawerWidth');
    if (savedWidth) {
      drawerWidth.value = parseInt(savedWidth, 10);
    }

    // Load channels from localStorage or fallback to mock data
    void loadChannels();
    const currentChannelId = router.currentRoute.value.params.id as string;

    if (currentChannelId) {
      const currentChannel = availableChannels.value.find((ch) => ch.id === currentChannelId);
      if (currentChannel) {
        selectedChannel.value = currentChannel;
        return;
      }
    }

    if (availableChannels.value.length > 0) {
      selectedChannel.value = availableChannels.value[0] as Channel;
      void router.push({
        path: `/channel/${selectedChannel.value.id}`,
      });
    } else {
      //console.warn('No channels available for current user');
      void router.push('/');
    }
  } catch (error) {
    console.error('Error loading channels:', error);
  }
});

onBeforeUnmount(() => {
  // Remove WebSocket reconnection listener
  window.removeEventListener('websocket:connected', () => void handleWebSocketReconnect());
});

function handleChannelSelected(channel: Channel) {
  selectedChannel.value = channel;

  // Check if this is an invited channel
  const invitation = invitations.value.find((inv) => String(inv.channelId) === channel.id);

  if (invitation) {
    // Don't navigate yet - user needs to accept/decline first
    // We'll handle this in the ChannelComponent
    return;
  }
}

async function handleCreateChannel() {
  if (!newChannelName.value.trim()) {
    Notify.create({
      type: 'negative',
      message: 'Channel name is required',
      position: 'top',
    });
    return;
  }

  if (!currentUser.value) {
    Notify.create({
      type: 'negative',
      message: 'User not logged in',
      position: 'top',
    });
    return;
  }

  try {
    const newChannel = await createNewChannel(newChannelName.value, newChannelIsPrivate.value);

    if (!newChannel) {
      Notify.create({
        type: 'negative',
        message: 'Failed to create channel',
        position: 'top',
      });
      return;
    }

    Notify.create({
      type: 'positive',
      message: `Successfully created channel: ${newChannel.name}`,
      position: 'top',
    });

    // Reset dialog
    showCreateChannelDialog.value = false;
    newChannelName.value = '';
    newChannelIsPrivate.value = false;

    // Redirect to new channel
    void router.push({
      path: `/channel/${newChannel.id}`,
    });
  } catch (err) {
    const error = err as ApiError;
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || 'An error occurred while creating the channel',
      position: 'top',
    });
  }
}

// Resizable drawer functions
function startResize(event: MouseEvent) {
  isResizing.value = true;
  event.preventDefault();
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value) return;

  const newWidth = event.clientX;
  if (newWidth >= MIN_DRAWER_WIDTH && newWidth <= MAX_DRAWER_WIDTH) {
    drawerWidth.value = newWidth;
  }
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  // Save to localStorage
  localStorage.setItem('drawerWidth', drawerWidth.value.toString());
}
</script>

<style scoped>
.drawer-content {
  height: 100%;
  padding-bottom: 0;
}

.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.drawer-scroll {
  flex: 1 1 auto;
  min-height: 0;
}

.drawer-userbar-container {
  flex: 0 0 auto;
  padding: 8px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.drawer-header-section {
  flex: 0 0 auto;
  padding-bottom: 8px;
  margin-bottom: 4px;
}

.drawer-header-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px 16px;
}

.drawer-header {
  color: #949ba4;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  flex: 1;
}

.create-channel-btn {
  color: #949ba4;
  transition: all 0.2s ease;
}

.create-channel-btn:hover {
  color: #ffffff;
  background: rgba(79, 84, 92, 0.32);
}

.channels-list {
  padding: 0;
}

.full-height {
  height: 100%;
  min-height: 0;
}

.left-drawer {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  border-right: 1px solid #1e1f22;
}

/* Mobile drawer */
@media (max-width: 767px) {
  .left-drawer {
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.5);
  }

  .drawer-header-wrapper {
    padding: 10px 12px 6px 12px;
  }

  .drawer-header {
    font-size: 11px;
  }
}

/* Create Channel Dialog */
.create-channel-card {
  min-width: 400px;
  background: #313338;
  color: #f2f3f5;
}

/* Tablet breakpoint for dialog */
@media (max-width: 768px) {
  .create-channel-card {
    min-width: 320px;
    max-width: 90vw;
  }
}

/* Mobile breakpoint for dialog */
@media (max-width: 480px) {
  .create-channel-card {
    min-width: 280px;
    width: 95vw;
  }

  .dialog-header {
    padding: 12px 16px;
  }

  .dialog-content {
    padding: 16px;
  }

  .dialog-actions {
    padding: 10px 16px;
  }
}

.dialog-header {
  background: #2b2d31;
  color: #f2f3f5;
  padding: 16px 20px;
  border-bottom: 1px solid #1e1f22;
}

.dialog-content {
  padding: 20px;
  gap: 16px;
  display: flex;
  flex-direction: column;
}

.dialog-content :deep(.q-field__label) {
  color: #b5bac1;
}

.dialog-content :deep(.q-field__control) {
  color: #f2f3f5;
}

.dialog-content :deep(.q-field__native) {
  color: #f2f3f5;
}

.dialog-content :deep(.q-field__control:before) {
  border-color: #4e5058;
}

.dialog-content :deep(.q-field__control:hover:before) {
  border-color: #949ba4;
}

.private-checkbox {
  margin-top: 8px;
}

.channel-type-hint {
  color: #949ba4;
  font-size: 13px;
  margin-top: -8px;
  margin-left: 32px;
}

.dialog-actions {
  padding: 12px 20px;
  background: #2b2d31;
  border-top: 1px solid #1e1f22;
}

.create-btn {
  background-color: #5865f2;
  color: #ffffff;
  font-weight: 500;
  padding: 2px 16px;
}

.create-btn:hover {
  background-color: #4752c4;
}

.create-btn:disabled {
  background-color: #4e5058;
  color: #6d6f78;
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background-color: rgba(88, 101, 242, 0.1);
}

.resize-handle:active {
  background-color: rgba(88, 101, 242, 0.2);
}

.resize-handle-line {
  width: 2px;
  height: 40px;
  background-color: transparent;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.resize-handle:hover .resize-handle-line {
  background-color: #5865f2;
  height: 60px;
}

.resize-handle:active .resize-handle-line {
  background-color: #4752c4;
  height: 80px;
}

/* Hide resize handle on mobile */
@media (max-width: 767px) {
  .resize-handle {
    display: none;
  }
}
.open-drawer-btn {
  position: fixed;
  left: 12px;
  top: 10%;
  transform: translateY(-50%);
  z-index: 2000;
  opacity: 0.55;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition:
    opacity 0.2s ease,
    background 0.2s ease;
}

.open-drawer-btn:hover {
  opacity: 0.95;
  background: rgba(0, 0, 0, 0.55);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}

.q-splitter__separator {
  background: transparent !important;
}

.q-splitter--dark .q-splitter__separator {
  background: transparent !important;
}

/* Hide button inside drawer */
.hide-drawer-btn {
  color: #949ba4;
  margin-right: 6px;
  transition: all 0.2s ease;
}

.hide-drawer-btn:hover {
  color: #ffffff;
  background: rgba(79, 84, 92, 0.32);
}
</style>
