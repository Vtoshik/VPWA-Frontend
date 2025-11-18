<template>
  <div class="command-line-wrapper">
    <q-input
      outlined
      v-model="text"
      placeholder="Message #channel"
      color="accent"
      dark
      class="chat-input"
      @keyup.enter="sendMessage"
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
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { wsService } from 'src/services/websocket';

const props = defineProps<{
  currentUserId?: string | undefined;
}>();

const route = useRoute();
const text = ref('');
const emit = defineEmits(['send-message', 'command']);

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

.chat-input {
  width: 100%;
}

.chat-input :deep(.q-field__control) {
  background: #40444b;
  border-radius: 8px;
  min-height: 44px;
  padding: 0 12px;
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
}

.chat-input :deep(.q-field__native::placeholder) {
  color: #6d7075;
  opacity: 1;
}

.chat-input :deep(.q-field__append) {
  padding-left: 8px;
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
