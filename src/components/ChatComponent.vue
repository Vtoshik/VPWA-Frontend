<template>
  <q-item clickable class="text-white" @click="selectChat(chat)">
    <q-item-section>
      <q-item-label>{{ chat.name }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { defineProps } from 'vue';

const props = defineProps<{
  chat: { 
    id: string; 
    name: string; 
    messageFile: string 
  };
}>();

const router = useRouter();

function selectChat(chat: { id: string; name: string; messageFile: string }) {
  console.log('Selected chat:', props.chat.name); // Example usage
  void router.push({ path: `/chat/${chat.id}`, query: { file: chat.messageFile } });
}
</script>