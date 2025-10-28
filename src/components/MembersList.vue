<template>
  <div class="members-container">
    <div class="members-header">Members - {{ members.length }}</div>
    <q-scroll-area class="members-scroll">
      <q-list class="members-list">
        <q-item
          v-for="member in members"
          :key="member.id"
          clickable
          class="member-item"
          @click="showMemberDetails(member)"
        >
          <q-item-section avatar>
            <q-avatar :color="getAvatarColor(member.status)" text-color="white" size="40px">
              <span class="avatar-text">{{ member.firstName[0] }}{{ member.lastName[0] }}</span>
              <q-badge
                floating
                rounded
                :color="getStatusColor(member.status)"
                class="status-badge"
              />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="member-name">{{ member.nickName }}</q-item-label>
            <q-item-label caption class="member-full-name">
              {{ member.firstName }} {{ member.lastName }}
            </q-item-label>
            <!-- Typing indicator moved to chat area above command line -->
            <!-- <q-item-label v-if="member.isTyping" caption class="typing-indicator">
              <q-icon name="edit" size="12px" />
              typing...
            </q-item-label> -->
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>

    <q-dialog v-model="showPreviewDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedMember?.nickName }} is typing...</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="typing-preview">
            <q-icon name="edit" color="primary" size="24px" />
            <div class="preview-text">
              {{ selectedMember?.typingText || 'Nothing yet...' }}
              <span class="blinking-cursor">|</span>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Member } from 'src/components/models.ts';

const props = defineProps<{
  members: Member[];
}>();

const showPreviewDialog = ref(false);
const selectedMember = ref<Member | null>(null);

function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'positive';
    case 'DND':
      return 'warning';
    case 'offline':
      return 'grey-6';
    default:
      return 'grey-6';
  }
}

function getAvatarColor(status: string): string {
  switch (status) {
    case 'online':
      return 'primary';
    case 'DND':
      return 'orange';
    case 'offline':
      return 'grey-7';
    default:
      return 'grey-7';
  }
}

function showMemberDetails(member: Member) {
  if (member.isTyping) {
    selectedMember.value = member;
    showPreviewDialog.value = true;
  }
}

watch(
  () => props.members,
  (newMembers) => {
    if (selectedMember.value) {
      const updated = newMembers.find((m) => m.id === selectedMember.value?.id);
      if (updated) {
        selectedMember.value = updated;
      }
    }
  },
  { deep: true },
);
</script>

<style scoped>
.members-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #2f3136;
}

.members-header {
  padding: 16px;
  color: #b9bbbe;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #202225;
}

.members-scroll {
  flex: 1;
  height: calc(100vh - 60px);
}

.members-list {
  padding: 8px;
}

.member-item {
  border-radius: 8px;
  margin-bottom: 4px;
  padding: 8px;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: rgba(79, 84, 92, 0.3);
}

.avatar-text {
  font-weight: 600;
  font-size: 14px;
}

.status-badge {
  width: 12px;
  height: 12px;
  border: 2px solid #2f3136;
}

.member-name {
  color: #dcddde;
  font-weight: 500;
  font-size: 14px;
}

.member-full-name {
  color: #72767d;
  font-size: 12px;
}

.typing-indicator {
  color: #3ba55d;
  font-size: 11px;
  font-style: italic;
  margin-top: 2px;
}

.typing-preview {
  background: #383a40;
  border-radius: 8px;
  padding: 16px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-text {
  color: #dcddde;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.blinking-cursor {
  animation: blink 1s infinite;
  color: #3ba55d;
  font-weight: bold;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Tablet breakpoint */
@media (max-width: 1024px) {
  .members-header {
    padding: 12px;
    font-size: 11px;
  }

  .member-item {
    padding: 6px;
  }

  .avatar-text {
    font-size: 13px;
  }

  .member-name {
    font-size: 13px;
  }

  .member-full-name {
    font-size: 11px;
  }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .members-container {
    height: 100%;
  }

  .members-scroll {
    height: calc(100vh - 100px);
  }

  .members-header {
    padding: 14px 16px;
    font-size: 12px;
    border-bottom: 2px solid #202225;
  }

  .members-list {
    padding: 12px;
  }

  .member-item {
    padding: 8px;
    margin-bottom: 6px;
  }
}

/* Small screens - compact member cards */
@media (max-width: 480px) {
  .typing-preview {
    min-height: 80px;
    padding: 12px;
  }

  .preview-text {
    font-size: 13px;
  }
}
</style>
