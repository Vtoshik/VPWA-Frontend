<template>
  <q-item clickable class="user-bar">
    <q-avatar size="40px" rounded>
      <img src="https://cdn.quasar.dev/img/avatar.png">
    </q-avatar>
    <q-item-section class="user-info">
      <div class="user-name">Username#1234</div>
      <div class="user-status">Online</div>
    </q-item-section>
    <q-btn flat dense round icon="settings" aria-label="Settings" class="settings-btn" />
  </q-item>
</template>

<script setup lang="ts">

</script>

<style scoped>
.user-bar {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: 240px;
  background: #1e1f22;
  border-radius: 8px;
  padding: 10px 8px;
  border: 2px solid #202225;
  transition: all 0.2s ease;
  margin: 0 4px;
}

.user-bar:hover {
  background: #232428;
  border-color: #2a2c31;
}

.user-info {
  flex-grow: 1;
  margin-left: 12px;
  color: white;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
}

.user-status {
  font-size: 12px;
  color: #b9bbbe;
  margin-top: 2px;
}

.settings-btn {
  color: #b9bbbe;
  transition: color 0.2s ease;
}

.settings-btn:hover {
  color: #ffffff;
}
</style>