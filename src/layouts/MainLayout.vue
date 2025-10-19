<template>
  <q-layout view="lHh Lpr lFf" style="height: 100vh">
    <!--header above chat area-->
    <q-header elevated class="bg-grey-9">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title class="absolute-center">Discord Copy</q-toolbar-title>
        <div>Text</div>
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
            />
          </q-list>
        </q-scroll-area>
        <div class="drawer-userbar-container">
          <UserBar />
        </div>
      </div>
    </q-drawer>

    <!--center area where are chat-->
    <q-page-container class="bg-primary full-height">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UserBar from 'src/components/UserBar.vue';
import { useRouter } from 'vue-router';
import ChannelComponent from 'src/components/ChannelComponent.vue';

type Channel = {
  id: string;
  name: string;
  messageFile: string;
};

const leftDrawerOpen = ref(false);
const channels = ref<Channel[]>([]);
const router = useRouter();
const selectedChannel = ref<Channel | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('/src/assets/test-data/mock-channels.json');
    const data = await response.json();
    channels.value = data.channels;
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

function toggleLeftDrawer() {
  if (leftDrawerOpen.value === false) {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  }
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
</style>
