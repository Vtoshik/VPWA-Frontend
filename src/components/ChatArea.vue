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
import { ref, watch, defineProps, defineEmits, onMounted } from 'vue';

type Message = {
  name: string;
  text: string[];
  stamp: string;
  sent?: boolean;
};

const props = defineProps<{
  messageFile: string;
}>();

const emits = defineEmits(['update-messages']);
const messages = ref<Message[]>([]);

async function loadMessages(file: string) {
  try {
    const storedMessages = localStorage.getItem(file);
    if (storedMessages) {
      messages.value = JSON.parse(storedMessages);
    } else {
      const response = await fetch(file);
      messages.value = await response.json();
    }
  } catch (err) {
    console.error('Error loading messages:', err);
  }
}

watch(() => props.messageFile, loadMessages);

watch(
  messages,
  (newMessages) => {
    emits('update-messages', newMessages);
    localStorage.setItem(props.messageFile, JSON.stringify(newMessages));
  },
  { deep: true },
);

onMounted(() => loadMessages(props.messageFile));
</script>

<style scoped>
.chat-messages {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}
</style>
