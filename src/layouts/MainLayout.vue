<template>
  <q-layout view="lHh Lpr lFf" style="height: 100vh">
    <!--left side bar - channels list-->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      class="bg-secondary left-drawer"
      :width="260"
      :breakpoint="767"
      content-class="drawer-content"
    >
      <div class="drawer-inner bg-secondary">
        <div class="drawer-header-section">
          <div class="drawer-header-wrapper">
            <div class="drawer-header">Channels</div>
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
        <q-scroll-area class="drawer-scroll">
          <q-list class="channels-list">
            <ChannelComponent
              v-for="channel in availableChannels"
              :key="channel.id"
              :channel="channel"
              :is-selected="selectedChannel?.id === channel.id"
              :is-invited="currentUser?.pendingInvitations?.includes(channel.id) ?? false"
              @channel-selected="handleChannelSelected"
              @channel-left="loadChannels"
            />
          </q-list>
        </q-scroll-area>
        <div class="drawer-userbar-container">
          <UserBar />
        </div>
      </div>
    </q-drawer>

    <!--main content area - channel page-->
    <q-page-container class="full-height">
      <router-view />
    </q-page-container>

    <!-- Create Channel Dialog -->
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
import { ref, onMounted, computed, watch } from 'vue';
import { Notify } from 'quasar';
import UserBar from 'src/components/UserBar.vue';
import { useRouter } from 'vue-router';
import ChannelComponent from 'src/components/ChannelComponent.vue';
import type { Channel } from 'src/components/models.ts';
import { useCurrentUser } from 'src/utils/useCurrentUser';
import { createChannel, getAllChannels } from 'src/utils/channels';

const leftDrawerOpen = ref(false);
const channels = ref<Channel[]>([]);
const router = useRouter();
const selectedChannel = ref<Channel | null>(null);

// Create channel dialog state
const showCreateChannelDialog = ref(false);
const newChannelName = ref('');
const newChannelIsPrivate = ref(false);

// Use reactive user state
const { currentUser, userChannels, refreshUser, acceptChannelInvitation, joinChannel } =
  useCurrentUser();

const availableChannels = computed(() => {
  if (!currentUser.value) return [];

  const userChannelIds = userChannels.value;
  const pendingInvitations = currentUser.value.pendingInvitations || [];

  const allChannels = channels.value.filter(
    (channel) => userChannelIds.includes(channel.id) || pendingInvitations.includes(channel.id),
  );

  return allChannels.sort((a, b) => {
    const aIsInvited = pendingInvitations.includes(a.id);
    const bIsInvited = pendingInvitations.includes(b.id);

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
    loadChannels();
  },
);

onMounted(() => {
  try {
    refreshUser();

    if (!currentUser.value) {
      console.warn('No authenticated user, redirecting to login');
      void router.push('/auth/login');
      return;
    }

    // Load channels from localStorage or fallback to mock data
    loadChannels();
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
        query: { file: selectedChannel.value.messageFile },
      });
    } else {
      console.warn('No channels available for current user');
      void router.push('/');
    }
  } catch (error) {
    console.error('Error loading channels:', error);
  }
});

function handleChannelSelected(channel: Channel) {
  selectedChannel.value = channel;

  if (currentUser.value?.pendingInvitations?.includes(channel.id)) {
    acceptChannelInvitation(currentUser.value.id, channel.id);
  }
}

function handleCreateChannel() {
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

  const result = createChannel(newChannelName.value, newChannelIsPrivate.value);

  if (result.success && result.channel) {
    const success = joinChannel(currentUser.value.id, result.channel.id);

    if (success) {
      channels.value = getAllChannels();

      Notify.create({
        type: 'positive',
        message: result.message,
        position: 'top',
      });

      // Reset dialog
      showCreateChannelDialog.value = false;
      newChannelName.value = '';
      newChannelIsPrivate.value = false;

      void router.push({
        path: `/channel/${result.channel.id}`,
        query: { file: result.channel.messageFile },
      });
    } else {
      Notify.create({
        type: 'negative',
        message: 'Failed to join the created channel',
        position: 'top',
      });
    }
  } else {
    Notify.create({
      type: 'negative',
      message: result.message,
      position: 'top',
    });
  }
}

function loadChannels() {
  channels.value = getAllChannels();
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
}

.drawer-scroll {
  flex: 1 1 auto;
  min-height: 0;
}

.drawer-userbar-container {
  flex: 0 0 auto;
  padding: 8px;
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

/* Create Channel Dialog */
.create-channel-card {
  min-width: 400px;
  background: #313338;
  color: #f2f3f5;
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
</style>
