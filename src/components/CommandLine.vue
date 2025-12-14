<template>
  <div class="command-line-wrapper">
    <div class="input-container" :style="{ maxHeight: maxInputHeight + 'px' }">
      <q-input
        ref="inputRef"
        outlined
        v-model="text"
        placeholder="Message #channel"
        color="accent"
        dark
        class="chat-input"
        @keyup.enter.exact="sendMessage"
        type="textarea"
        autogrow
        dense
      >
        <template v-slot:append>
          <q-btn
            round
            dense
            flat
            color="accent"
            @click="sendMessage"
            icon="send"
            :disable="!text.trim()"
            size="sm"
            class="send-btn"
          />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { wsService } from 'src/services/websocket';

const props = defineProps<{
  currentUserId?: string | undefined;
}>();

const route = useRoute();
const text = ref('');
const emit = defineEmits(['send-message', 'command']);

// Calculate max height as 50% of chat messages area
const chatMainHeight = ref(0);
const maxInputHeight = computed(() => {
  // Max 50% of chat-main height, but also limit to reasonable values
  if (chatMainHeight.value > 0) {
    const maxFromChat = Math.floor(chatMainHeight.value * 0.5);
    // Don't exceed 400px even if 50% is larger
    return Math.min(maxFromChat, 400);
  }
  return 200; // Fallback
});

// Update chat area height on mount and resize
onMounted(() => {
  updateChatHeight();
  window.addEventListener('resize', updateChatHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateChatHeight);
});

function updateChatHeight() {
  // Find the chat-main element (scroll area with messages only)
  const chatMain = document.querySelector('.chat-main');
  if (chatMain) {
    chatMainHeight.value = chatMain.clientHeight;
  }
}

watch(text, (newText) => {
  const channelId = (route.params.id as string) || 'general';
  const userId = props.currentUserId;

  if (!userId) return;

  if (newText.trim()) {
    wsService.updateTyping(channelId, newText);
  } else {
    wsService.stopTyping(channelId);
  }
});

function sendMessage() {
  if (text.value.trim()) {
    const messageText = text.value.trim();

    if (messageText.startsWith('/')) {
      const parts = messageText.slice(1).split(' ');
      const command = parts[0]?.toLowerCase() || '';
      const args = parts.slice(1);

      emit('command', { name: command, args });
    } else {
      emit('send-message', messageText);
    }

    text.value = '';

    const channelId = (route.params.id as string) || 'general';
    wsService.stopTyping(channelId);
  }
}
</script>

<style scoped>
.command-line-wrapper {
  padding: 0 16px 24px 16px;
  background: transparent;
}

.input-container {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Custom scrollbar for input container */
.input-container::-webkit-scrollbar {
  width: 6px;
}

.input-container::-webkit-scrollbar-track {
  background: transparent;
}

.input-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.input-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-input {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.chat-input :deep(.q-field__control) {
  background: #40444b;
  border-radius: 8px;
  min-height: 44px;
  padding: 0 12px;
  align-items: flex-end;
}

.chat-input :deep(.q-field__control):before {
  border: none;
}

.chat-input :deep(.q-field__control):after {
  border: none;
}

.chat-input :deep(.q-field__control):hover {
  background: #464a52;
}

.chat-input :deep(.q-field__control--focused) {
  background: #40444b;
}

.chat-input :deep(.q-field__native) {
  color: #dcddde;
  font-size: 15px;
  padding: 11px 0;
  resize: none;
  overflow: visible;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}

.chat-input :deep(.q-field__native::placeholder) {
  color: #6d7075;
  opacity: 1;
}

.chat-input :deep(.q-field__append) {
  padding-left: 8px;
  padding-bottom: 8px;
  align-self: flex-end;
}

.send-btn {
  flex-shrink: 0;
}

/* Tablet breakpoint */
@media (max-width: 1024px) {
  .command-line-wrapper {
    padding: 0 12px 20px 12px;
  }

  .chat-input :deep(.q-field__control) {
    min-height: 42px;
  }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .command-line-wrapper {
    padding: 0 8px 16px 8px;
  }

  .chat-input :deep(.q-field__control) {
    min-height: 40px;
    border-radius: 6px;
  }

  .chat-input :deep(.q-field__native) {
    font-size: 14px;
    padding: 10px 0;
  }

  .chat-input :deep(.q-field__native::placeholder) {
    font-size: 14px;
  }

  .chat-input :deep(.q-btn) {
    transform: scale(0.9);
  }
}

/* Small mobile */
@media (max-width: 480px) {
  .command-line-wrapper {
    padding: 0 6px 12px 6px;
  }

  .chat-input :deep(.q-field__control) {
    padding: 0 8px;
  }
}
</style>
