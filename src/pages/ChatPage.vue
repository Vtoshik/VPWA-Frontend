<template>
  <q-page class="chat-page">
    <div class="chat-col">
      <q-scroll-area class="chat-main">
        <ChatArea :message-file="messageFile" @update-messages="messages = $event" />
      </q-scroll-area>
      <CommandLine class="chat-input" @send-message="addMessage" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import ChatArea from 'src/components/ChatArea.vue';
import CommandLine from 'src/components/CommandLine.vue';

type Message = {
  name: string;
  text: string[];
  stamp: string;
  sent?: boolean;
};

const route = useRoute();
const messageFile = computed(
  () => (route.query.file as string) || '/src/assets/test-data/mock-messages.json',
);
const messages = ref<Message[]>([]);

function addMessage(text: string) {
  const newMessage: Message = {
    name: 'me',
    text: [text],
    stamp: new Date().toLocaleTimeString(),
    sent: true,
  };
  messages.value.push(newMessage);
  localStorage.setItem(messageFile.value, JSON.stringify(messages.value));
  console.log('New message saved to localStorage for:', messageFile.value, newMessage);
}
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
  width: 100%;
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
