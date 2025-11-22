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
  const token = localStorage.getItem('auth_token');

  if (user && token) {
    // Only reconnect if we have both user and valid token
    if (!wsService.isConnected()) {
      wsService.connect(token);
    }

    const { loadChannels, setupSocketListeners } = useChannels();
    await loadChannels();

    setupSocketListeners();
  } else if (wsService.isConnected()) {
    // Disconnect if no valid user/token
    wsService.disconnect();
  }
});
</script>
