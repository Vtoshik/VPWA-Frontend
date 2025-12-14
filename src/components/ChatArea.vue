<template>
  <div class="chat-wrapper">
    <div class="chat-scroll">
      <div class="chat-messages">
        <div
          v-for="(message, index) in displayMessages"
          :key="message.stamp + index"
          class="discord-message"
          :class="{ highlight: isMentionedInMessage(message) }"
        >
          <!-- AVATAR -->
          <div class="avatar">
            <q-avatar size="40px" color="grey-7" text-color="white">
              {{ getInitials(message.name) }}
            </q-avatar>
          </div>

          <!-- CONTENT -->
          <div class="content">
            <div class="header">
              <span class="username">{{ message.name }}</span>
              <span class="timestamp">{{ message.stamp }}</span>
            </div>

            <div
              class="text"
              v-for="(line, i) in message.text"
              :key="i"
              v-html="renderMentions(line)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Message } from 'src/services/models';

const props = defineProps<{
  allMessages?: Message[];
  currentUserId: number | undefined;
}>();

const displayMessages = computed(() => props.allMessages ?? []);

function isMentionedInMessage(message: Message): boolean {
  if (!props.currentUserId || !message.mentionedUserIds) return false;
  return message.mentionedUserIds.includes(props.currentUserId);
}

function getInitials(name?: string): string {
  if (!name) return '?';

  const parts = name
    .trim()
    .split(' ')
    .filter((p) => p.length > 0);

  const first = parts[0]?.charAt(0);
  const second = parts[1]?.charAt(0);

  if (first && second) {
    return (first + second).toUpperCase();
  }

  if (first) {
    return first.toUpperCase();
  }

  return '?';
}

function renderMentions(text: string): string {
  return text.replace(
    /@(\w+)/g,
    '<span class="mention">@$1</span>',
  );
}
</script>

<style scoped>
.chat-wrapper {
  height: 100%;
  overflow: hidden;
}

.chat-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ===== MESSAGE ===== */
.discord-message {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.discord-message:hover {
  background: rgba(79, 84, 92, 0.25);
}

.discord-message.highlight {
  background: rgba(250, 166, 26, 0.15);
  border-left: 3px solid #faa61a;
}

/* ===== AVATAR ===== */
.avatar {
  flex-shrink: 0;
}

/* ===== CONTENT ===== */
.content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  color: #00a8fc;
  font-weight: 600;
  font-size: 14px;
}

.timestamp {
  font-size: 12px;
  color: #72767d;
}

.text {
  color: #dcddde;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

/* ===== MENTION ===== */
:deep(.mention) {
  color: #00a8fc;
  background: rgba(0, 168, 252, 0.15);
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
  cursor: pointer;
}

:deep(.mention):hover {
  background: rgba(0, 168, 252, 0.3);
}

/* SCROLLBAR */
.chat-scroll::-webkit-scrollbar {
  width: 6px;
}

.chat-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
</style>
