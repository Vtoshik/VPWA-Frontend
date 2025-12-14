<template>
  <div class="members-container">
    <div class="members-header">Members - {{ members.length }}</div>
    <q-scroll-area class="members-scroll">
      <q-list class="members-list">
        <q-item
          v-for="member in members"
          :key="member.id"
          class="member-item"
        >
          <q-item-section avatar>
            <q-avatar
              :color="getAvatarColor(member.status)"
              text-color="white"
              size="40px"
            >
              <span class="avatar-text">
                {{ getInitials(member) }}
              </span>

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
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<script setup lang="ts">
import type { Member } from 'src/services/models';

defineProps<{
  members: Member[];
}>();

type UserStatus = 'online' | 'dnd' | 'offline';

function normalizeStatus(status?: string): UserStatus {
  if (!status) return 'offline';

  const s = status.toLowerCase();

  if (s === 'online') return 'online';
  if (s === 'dnd') return 'dnd';

  return 'offline';
}

function getInitials(member: Member): string {
  const f = member.firstName?.charAt(0) ?? '';
  const l = member.lastName?.charAt(0) ?? '';

  if (f || l) return (f + l).toUpperCase();
  return member.nickName?.charAt(0)?.toUpperCase() ?? '?';
}

function getStatusColor(status?: string): string {
  switch (normalizeStatus(status)) {
    case 'online':
      return 'positive';
    case 'dnd':
      return 'negative';
    case 'offline':
    default:
      return 'grey-6';
  }
}

function getAvatarColor(status?: string): string {
  switch (normalizeStatus(status)) {
    case 'online':
      return 'primary';
    case 'dnd':
      return 'primary';
    case 'offline':
    default:
      return 'primary';
  }
}

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
</style>
