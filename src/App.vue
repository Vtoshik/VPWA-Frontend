<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useChannels } from './utils/useChannels';
import { wsService } from 'src/services/websocket';
import { getCurrentUser } from 'src/utils/auth';

onMounted(async () => {
  const user = getCurrentUser();

  if (user) {
    const token = localStorage.getItem('auth_token');
    if (token && !wsService.isConnected()) {
      wsService.connect(token);
    }

    const { loadChannels, setupSocketListeners } = useChannels();
    await loadChannels();

    setupSocketListeners();
  }
});
</script>
