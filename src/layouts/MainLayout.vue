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
          <div class="drawer-header">Channels</div>
        </div>
        <q-scroll-area class="drawer-scroll">
          <q-list class="channels-list">
            <ChannelComponent
              v-for="channel in availableChannels"
              :key="channel.id"
              :channel="channel"
              :is-selected="selectedChannel?.id === channel.id"
              @channel-selected="handleChannelSelected"
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import UserBar from 'src/components/UserBar.vue';
import { useRouter } from 'vue-router';
import ChannelComponent from 'src/components/ChannelComponent.vue';
import type { Channel, CurrentUser } from 'src/components/models.ts';
import { initMockUser } from 'src/utils/mockAuth';

const leftDrawerOpen = ref(false);
const channels = ref<Channel[]>([]);
const router = useRouter();
const selectedChannel = ref<Channel | null>(null);
const currentUser = ref<CurrentUser | null>(null);

const availableChannels = computed(() => {
  if (!currentUser.value) return [];
  return channels.value.filter((channel) => currentUser.value!.channels.includes(channel.id));
});

onMounted(async () => {
  try {
    currentUser.value = initMockUser();

    const channelsResponse = await fetch('/src/assets/test-data/mock-channels.json');
    const channelsData = await channelsResponse.json();
    channels.value = channelsData.channels;

    if (availableChannels.value.length > 0) {
      selectedChannel.value = availableChannels.value[0] as Channel;
      void router.push({
        path: `/channel/${selectedChannel.value.id}`,
        query: { file: selectedChannel.value.messageFile },
      });
    } else {
      console.warn('No channels available for current user');
    }
  } catch (error) {
    console.error('Error loading channels:', error);
  }
});

function handleChannelSelected(channel: Channel) {
  selectedChannel.value = channel;
}
</script>

<style scoped>
/* Drawer styles */
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

.drawer-header {
  padding: 12px 16px 8px 16px;
  color: #949ba4;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
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
</style>
