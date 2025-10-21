<template>
  <q-layout view="lHh Lpr lFf" style="height: 100vh">
    <!--header above chat area-->
    <q-header elevated class="bg-grey-9">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="absolute-center"> #{{ currentChannelName }} </q-toolbar-title>
        <q-btn flat dense round icon="group" aria-label="Members" @click="toggleRightDrawer" />
      </q-toolbar>
    </q-header>

    <!--left side bar-->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      class="bg-secondary"
      :width="260"
      :breakpoint="767"
      bordered
      content-class="drawer-content"
    >
      <div class="drawer-inner bg-secondary">
        <div class="drawer-header">Channels</div>
        <q-scroll-area class="drawer-scroll">
          <q-list>
            <ChannelComponent
              v-for="channel in channels"
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

    <!--right side bar - members-->
    <q-drawer
      v-model="rightDrawerOpen"
      side="right"
      :width="280"
      :breakpoint="767"
      bordered
      class="members-drawer"
    >
      <MembersList :members="currentMembers" />
    </q-drawer>

    <!--center area where are chat-->
    <q-page-container class="bg-primary full-height">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import UserBar from 'src/components/UserBar.vue';
import { useRouter, useRoute } from 'vue-router';
import ChannelComponent from 'src/components/ChannelComponent.vue';
import MembersList from 'src/components/MembersList.vue';
import type { Member } from 'src/components/MembersList.vue';

type Channel = {
  id: string;
  name: string;
  messageFile: string;
};

type MembersData = {
  [channelId: string]: Member[];
};

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const channels = ref<Channel[]>([]);
const router = useRouter();
const route = useRoute();
const selectedChannel = ref<Channel | null>(null);
const members = ref<MembersData>({});

const currentChannelId = computed(() => (route.params.id as string) || 'general');
const currentChannelName = computed(
  () => channels.value.find((ch) => ch.id === currentChannelId.value)?.name || 'Channel',
);
const currentMembers = computed(() => members.value[currentChannelId.value] || []);

onMounted(async () => {
  try {
    const channelsResponse = await fetch('/src/assets/test-data/mock-channels.json');
    const channelsData = await channelsResponse.json();
    channels.value = channelsData.channels;

    const membersResponse = await fetch('/src/assets/test-data/mock-members.json');
    members.value = await membersResponse.json();

    if (channels.value.length > 0) {
      selectedChannel.value = channels.value[0] as Channel;
      void router.push({
        path: `/channel/${selectedChannel.value.id}`,
        query: { file: selectedChannel.value.messageFile },
      });
    }
  } catch (error) {
    console.error('Error loading channels:', error);
  }
});

watch(
  currentChannelId,
  () => {
    const interval = setInterval(() => {
      const typingKey = `typing:${currentChannelId.value}`;
      const typingData = localStorage.getItem(typingKey);
      const channelMembers = members.value[currentChannelId.value];
      if (typingData && channelMembers) {
        try {
          const parsed = JSON.parse(typingData);
          members.value[currentChannelId.value] = channelMembers.map((member) => {
            const typing = parsed[member.id];
            if (typing) {
              return { ...member, isTyping: true, typingText: typing };
            }
            return { ...member, isTyping: false, typingText: '' };
          });
        } catch {
          // Ignore parsing errors
        }
      }
    }, 500);

    return () => clearInterval(interval);
  },
  { immediate: true },
);

function toggleLeftDrawer() {
  if (leftDrawerOpen.value === false) {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  }
}

function toggleRightDrawer() {
  rightDrawerOpen.value = !rightDrawerOpen.value;
}

function handleChannelSelected(channel: Channel) {
  selectedChannel.value = channel;
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

.drawer-header {
  padding: 16px 16px 8px 16px;
  color: white;
  font-weight: 500;
  letter-spacing: 0.5px;
  z-index: 2;
}

.full-height {
  height: 100%;
  min-height: 0;
}

.members-drawer {
  background: #2f3136;
}
</style>
