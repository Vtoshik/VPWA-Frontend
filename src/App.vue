<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { initMockUsers } from 'src/utils/mockAuth';

// Initialize mock users on app mount
onMounted(() => {
  initMockUsers();
});
</script>
