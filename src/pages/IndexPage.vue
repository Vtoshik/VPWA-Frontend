<template>
  <q-page class="chat-page">
    <div class="chat-col">
      <div class="welcome-message">
        <h5 class="text-white text-center">Welcome to Discord Copy!</h5>
        <p class="text-grey-5 text-center">Please select a chat from the sidebar to start messaging.</p>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">

</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #26282b;
  overflow: hidden;
}

.chat-col {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  justify-content: center;
  align-items: center;
}

.welcome-message {
  text-align: center;
  max-width: 600px;
}

.invitations-section {
  width: 100%;
}

.invitation-card {
  background: #2f3136;
  color: white;
}
</style>