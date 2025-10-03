<template>
    <q-item clickable class="user-bar" style="min-width: 240px; background-color: #2f3136; border-radius: 12px; padding: 8px;">
    <q-avatar size="40px" rounded>
      <img src="https://cdn.quasar.dev/img/avatar.png">
    </q-avatar>
    <q-item-section class="user-info" style="margin-left: 12px; color: white;">
      <div class="user-name">Username#1234</div>
      <div class="user-status" style="font-size: 12px; color: #b9bbbe;">Online</div>
    </q-item-section>
    <q-btn flat dense round icon="settings" aria-label="Settings" style="color: white;" />
  </q-item>
</template>

<script setup lang="ts">

</script>

<style scoped>
.user-bar{
    display: flex;
    align-items: center;
    cursor: pointer;
}

.user-info{
    flex-grow: 1;
}

</style>