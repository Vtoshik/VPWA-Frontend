<template>
  <q-page class="chat-page">
    <div class="chat-col">
      <q-scroll-area class="chat-main">
        <ChatArea :message-file="messageFile" />
      </q-scroll-area>
      <CommandLine class="chat-input" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import ChatArea from 'src/components/ChatArea.vue';
import CommandLine from 'src/components/CommandLine.vue';

const route = useRoute();
const messageFile = computed(() => route.query.file as string || '/src/assets/test-data/mock-messages.json');
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
}

.chat-main {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.chat-input {
  flex: 0 0 auto;
  padding-bottom: 16px;
  background: transparent;
}
</style>