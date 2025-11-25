<template>
  <div class="chat-wrapper">
    <div class="chat-scroll">
      <div class="chat-messages">
        <q-chat-message
          v-for="(message, index) in displayMessages"
          :key="message.stamp + message.name + index"
          :name="message.name"
          :text="message.text"
          :stamp="message.stamp"
          :sent="message.sent"
          :bg-color="getMessageBgColor(message)"
          text-color="white"
          :class="{ 'mentioned-message': isMentionedInMessage(message) }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import type { Message } from 'src/components/models.ts';

const props = defineProps<{
  messageFile: string;
  allMessages?: Message[];
  currentUserNickname?: string;
}>();

const emits = defineEmits(['update-messages']);
const messages = ref<Message[]>([]);
const displayMessages = computed(() => props.allMessages || messages.value);

function isMentionedInMessage(message: Message): boolean {
  if (!props.currentUserNickname || !message.mentionedUsers) return false;
  return message.mentionedUsers.includes(props.currentUserNickname);
}

function getMessageBgColor(message: Message): string {
  if (isMentionedInMessage(message)) {
    return 'orange-9';
  }
  if (message.isCommand) {
    return 'info';
  }
  return message.sent ? 'accent' : 'grey-8';
}

async function loadMessages(file: string) {
  // If no file specified or using allMessages prop, skip loading
  if (!file || props.allMessages) {
    messages.value = [];
    return;
  }

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
    messages.value = [];
  }
}

watch(() => props.messageFile, loadMessages);

watch(
  messages,
  (newMessages) => {
    emits('update-messages', newMessages);
    if (props.messageFile) {
      localStorage.setItem(props.messageFile, JSON.stringify(newMessages));
    }
  },
  { deep: true },
);

onMounted(() => {
  if (props.messageFile && !props.allMessages) {
    void loadMessages(props.messageFile);
  }
});
</script>

<style scoped>
.chat-messages {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.chat-wrapper {
  height: 100%;
  width: 100%;
  overflow: hidden; /* блокує зайвий скрол */
}

.chat-scroll {
  height: 100%;
  width: 100%;
  overflow-y: auto;     /* Справжній скрол тут */
  overflow-x: hidden;   /* не дозволяємо горизонтальний */
  padding-right: 8px;   /* трохи щоб не обрізати */
}

/* Ховаємо потворні нативні скроллбари */
.chat-scroll::-webkit-scrollbar {
  width: 6px;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 5px;
}

.chat-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.mentioned-message :deep(.q-message-text) {
  border-left: 4px solid #ff9800;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  animation: pulse-mention 0.6s ease-out;
}

@media (max-width: 1024px) {
  .chat-messages {
    padding: 12px;
    gap: 14px;
  }
}

@media (max-width: 767px) {
  .chat-messages {
    padding: 8px;
    gap: 12px;
  }

  .chat-messages :deep(.q-message-text) {
    font-size: 14px;
    padding: 10px 12px;
  }

  .chat-messages :deep(.q-message-name) {
    font-size: 13px;
    margin-bottom: 4px;
  }

  .chat-messages :deep(.q-message-stamp) {
    font-size: 11px;
  }
}

@keyframes pulse-mention {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  100% {
    box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
  }
}

.q-footer {
  overflow: hidden !important;
}

.q-page-container {
  overflow-x: hidden !important;
}


</style>
