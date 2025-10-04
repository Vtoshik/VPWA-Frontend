<template>
  <div class="chat-messages">
    <q-chat-message
      v-for="message in messages"
      :key="message.stamp + message.name"
      :name="message.name"
      :text="message.text"
      :stamp="message.stamp"
      :sent="message.sent"
      bg-color="white"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, watch } from 'vue';

type Message = {
  name: string;
  text: string[];
  stamp: string;
  sent?: boolean;
};

const props = defineProps<{
  messageFile: string;
}>();

const messages = ref<Message[]>([]);

async function loadMessages(file: string) {
  try {
    const response = await fetch(file);
    messages.value = await response.json();
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

onMounted(() => loadMessages(props.messageFile));
watch(() => props.messageFile, loadMessages);
</script>

<style scoped>
.chat-messages {
  max-width: 550px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>