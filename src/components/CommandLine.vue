<template>
  <div class="q-pa-md">
    <div class="q-gutter-md">
      <q-input
        rounded
        standout
        v-model="text"
        label="Write to chat..."
        label-color="white"
        @keyup.enter="sendMessage"
      >
        <template v-slot:append>
          <q-btn round dense @click="sendMessage" icon="send" />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, watch, defineProps } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  currentUserId?: string;
}>();

const route = useRoute();
const text = ref('');
const emit = defineEmits(['send-message']);

watch(text, (newText) => {
  const channelId = (route.params.id as string) || 'general';
  const userId = props.currentUserId || 'user1';
  const typingKey = `typing:${channelId}`;

  if (newText.trim()) {
    const existing = localStorage.getItem(typingKey);
    const typingData = existing ? JSON.parse(existing) : {};
    typingData[userId] = newText;
    localStorage.setItem(typingKey, JSON.stringify(typingData));
  } else {
    const existing = localStorage.getItem(typingKey);
    if (existing) {
      const typingData = JSON.parse(existing);
      delete typingData[userId];
      if (Object.keys(typingData).length === 0) {
        localStorage.removeItem(typingKey);
      } else {
        localStorage.setItem(typingKey, JSON.stringify(typingData));
      }
    }
  }
});

function sendMessage() {
  if (text.value.trim()) {
    emit('send-message', text.value);
    text.value = '';

    const channelId = (route.params.id as string) || 'general';
    const userId = props.currentUserId || 'user1';
    const typingKey = `typing:${channelId}`;
    const existing = localStorage.getItem(typingKey);
    if (existing) {
      const typingData = JSON.parse(existing);
      delete typingData[userId];
      if (Object.keys(typingData).length === 0) {
        localStorage.removeItem(typingKey);
      } else {
        localStorage.setItem(typingKey, JSON.stringify(typingData));
      }
    }
  }
}
</script>

<style scoped>
.q-gutter-md {
  width: 100%;
}
</style>
