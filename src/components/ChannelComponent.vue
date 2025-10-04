<template>
  <q-expansion-item
    expand-separator
    :label="channel.name"
    header-class="text-white"
    default-opened
  >
    <q-list>
      <ChatComponent v-for="chat in channel.chats" :key="chat.id" :chat="chat" />
    </q-list>
  </q-expansion-item>
</template>

<script setup lang="ts">
import ChatComponent from './ChatComponent.vue';
import { defineProps } from 'vue';

//eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  channel: {
    id: string;
    name: string;
    chats: { 
      id: string; 
      name: string; 
      messageFile: string 
    }[];
  };
}>();
</script>