<template>
  <q-item clickable class="user-bar">
    <q-item-section avatar class="user-avatar-section">
      <q-avatar size="40px" rounded class="user-avatar">
        <img src="https://cdn.quasar.dev/img/avatar.png" />
      </q-avatar>
    </q-item-section>

    <q-item-section class="user-info">
      <div class="user-name">{{ currentUser?.nickName }}</div>
      <div class="user-status" :class="getStatusClass(currentUser?.status)">
        <q-icon :name="getStatusIcon(currentUser?.status)" size="xs" class="status-icon" />
        {{ currentUser?.status || 'offline' }}
      </div>
    </q-item-section>

    <q-item-section side class="user-settings-section">
      <q-btn flat dense round icon="settings" size="sm" @click="menu = true" class="settings-icon" />
    </q-item-section>

    <!-- MENU -->
    <q-menu v-model="menu">
      <q-list>
        <q-item-label header>Set Status</q-item-label>

        <q-item clickable v-close-popup @click="changeStatus('online')">
          <q-item-section avatar>
            <q-icon name="circle" color="positive" size="xs" />
          </q-item-section>
          <q-item-section>Online</q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="changeStatus('DND')">
          <q-item-section avatar>
            <q-icon name="do_not_disturb_on" color="negative" size="xs" />
          </q-item-section>
          <q-item-section>Do Not Disturb</q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="changeStatus('offline')">
          <q-item-section avatar>
            <q-icon name="circle" color="grey" size="xs" />
          </q-item-section>
          <q-item-section>Offline</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable v-close-popup @click="openRenameDialog = true">
          <q-item-section>Change nickname</q-item-section>
        </q-item>

        <q-item clickable v-close-popup @click="logoutUser">
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- CHANGE NICKNAME DIALOG -->
    <q-dialog v-model="openRenameDialog">
      <q-card class="q-pa-md bg-dark text-white">
        <q-card-section>
          <div class="text-h6">Change nickname</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="newNickName" label="Nickname" filled dense />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveNewNick" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-item>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Member } from 'src/components/models';
import { Notify } from 'quasar';
import { logout } from 'src/utils/auth';

const router = useRouter();
const menu = ref(false);
const openRenameDialog = ref(false);
const currentUser = ref<Member | null>(null);
const newFirstName = ref('');
const newLastName = ref('');
const newNickName = ref(''); 



onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser.value = JSON.parse(stored);
  }
});

function saveNewNick() {
  if (!currentUser.value) return;

  const nick = newNickName.value.trim();

  if (nick.length === 0) {
    Notify.create({
      type: 'warning',
      message: 'Nickname cannot be empty',
      position: 'top',
    });
    return;
  }

  currentUser.value.nickName = nick;

  localStorage.setItem('currentUser', JSON.stringify(currentUser.value));

  Notify.create({
    type: 'positive',
    message: 'Nickname changed!',
    position: 'top',
  });

  openRenameDialog.value = false;
}

function getStatusIcon(status?: 'online' | 'DND' | 'offline'): string {
  switch (status) {
    case 'online':
      return 'circle';
    case 'DND':
      return 'do_not_disturb_on';
    case 'offline':
    default:
      return 'circle';
  }
}

function getStatusClass(status?: 'online' | 'DND' | 'offline'): string {
  switch (status) {
    case 'online':
      return 'status-online';
    case 'DND':
      return 'status-dnd';
    case 'offline':
    default:
      return 'status-offline';
  }
}

function changeStatus(newStatus: 'online' | 'DND' | 'offline') {
  if (!currentUser.value) return;

  const previousStatus = currentUser.value.status;
  currentUser.value.status = newStatus;
  localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
  const membersData = localStorage.getItem('mock-members');

  if (membersData && currentUser.value) {
    const members: Member[] = JSON.parse(membersData);
    const memberIndex = members.findIndex((m) => m.id === currentUser.value?.id);
    if (memberIndex !== -1 && members[memberIndex]) {
      members[memberIndex].status = newStatus;
      localStorage.setItem('mock-members', JSON.stringify(members));
    }
  }

  let message = '';
  let color = '';

  switch (newStatus) {
    case 'online':
      message = 'Status changed to Online';
      color = 'positive';
      if (previousStatus === 'offline') {
        simulateReceivingMessages();
      }
      break;
    case 'DND':
      message = 'Do Not Disturb - Notifications muted';
      color = 'warning';
      break;
    case 'offline':
      message = "Status changed to Offline - You won't receive messages";
      color = 'grey';
      break;
  }

  Notify.create({
    type: color === 'positive' ? 'positive' : color === 'warning' ? 'warning' : 'info',
    message,
    position: 'top',
  });
}

function simulateReceivingMessages() {
  setTimeout(() => {
    Notify.create({
      type: 'info',
      message: 'Synchronizing channels...',
      position: 'top',
      timeout: 1500,
    });

    setTimeout(() => {
      addSimulatedMessages();

      Notify.create({
        type: 'positive',
        message: 'Channels synchronized! New messages received.',
        position: 'top',
        timeout: 2000,
      });

      window.location.reload();
    }, 1000);
  }, 500);
}

function addSimulatedMessages() {
  const messageFiles = [
    '/src/assets/test-data/mock-messages.json',
    '/src/assets/test-data/mock-messages-channel2.json',
    '/src/assets/test-data/mock-messages-channel3.json',
  ];

  messageFiles.forEach((file) => {
    const storedMessages = localStorage.getItem(file);
    if (storedMessages) {
      try {
        const messages = JSON.parse(storedMessages);

        const simulatedMessages = [
          {
            name: 'System',
            text: ['Welcome back! You have new messages.'],
            stamp: new Date().toLocaleTimeString(),
            sent: false,
            isCommand: true,
          },
          {
            name: 'TestUser',
            text: ['Hey! Where were you? We missed you!'],
            stamp: new Date().toLocaleTimeString(),
            sent: false,
          },
        ];

        messages.push(...simulatedMessages);
        localStorage.setItem(file, JSON.stringify(messages));
      } catch (error) {
        console.error(`Error adding simulated messages to ${file}:`, error);
      }
    }
  });
}

async function logoutUser() {
  await logout();
  await router.push('/auth/login');
}
</script>

<style scoped>
.user-bar {
  display: flex;
  align-items: center;
  cursor: pointer;
  width: 100%;
  max-width: 100%;
  background: #1e1f22;
  border-radius: 8px;
  padding: 10px 8px;
  border: 2px solid #202225;
  transition: all 0.2s ease;
  margin: 0 4px;
  box-sizing: border-box;
  min-height: 56px;
}

.user-bar:hover {
  background: #232428;
  border-color: #2a2c31;
}

.user-avatar-section {
  flex: 0 0 auto;
  min-width: 0;
  padding-right: 0;
}

.user-avatar {
  flex-shrink: 0;
}

.user-settings-section {
  flex: 0 0 auto;
  min-width: 0;
  padding-left: 4px;
}

.settings-icon {
  flex-shrink: 0;
}

.user-info {
  flex: 1 1 auto;
  margin-left: 12px;
  color: white;
  min-width: 0;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 12px;
  color: #b9bbbe;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-icon {
  margin-right: 2px;
}

.status-online {
  color: #23a55a;
}

.status-online .status-icon {
  color: #23a55a;
}

.status-dnd {
  color: #f23f43;
}

.status-dnd .status-icon {
  color: #f23f43;
}

.status-offline {
  color: #80848e;
}

.status-offline .status-icon {
  color: #80848e;
}

.settings-btn {
  color: #b9bbbe;
  transition: color 0.2s ease;
}

.settings-btn:hover {
  color: #ffffff;
}

/* Narrow drawer (when resized to minimum) */
.user-bar.narrow {
  padding: 8px 4px;
}

.user-bar.narrow .user-avatar {
  width: 32px;
  height: 32px;
}

.user-bar.narrow .user-info {
  margin-left: 6px;
}

.user-bar.narrow .user-name {
  font-size: 12px;
}

.user-bar.narrow .user-status {
  font-size: 9px;
}

/* Tablet breakpoint */
@media (max-width: 1024px) {
  .user-bar {
    padding: 8px 6px;
  }

  .user-name {
    font-size: 13px;
  }

  .user-status {
    font-size: 11px;
  }
}

/* Mobile breakpoint */
@media (max-width: 767px) {
  .user-bar {
    padding: 8px;
    margin: 0 2px;
  }

  .user-info {
    margin-left: 8px;
  }

  .user-name {
    font-size: 13px;
  }

  .user-status {
    font-size: 10px;
  }
}

/* Small screens */
@media (max-width: 480px) {
  .user-name {
    font-size: 12px;
  }
}
:deep(.q-dialog .q-input input) {
  color: #ffffff !important;
}

/* --- LABEL (Nickname) світліший --- */
:deep(.q-dialog .q-field__label) {
  color: #b5bac1 !important;
}

/* --- Фон поля Discord-стиль --- */
:deep(.q-dialog .q-field--filled .q-field__control) {
  background: #2b2d31 !important;
  border-radius: 6px;
  color: #ffffff !important;
}

/* --- Підкреслення поля --- */
:deep(.q-dialog .q-field--filled .q-field__control:before) {
  border-bottom-color: #777 !important;
}
:deep(.q-dialog .q-field--filled .q-field__control:hover:before) {
  border-bottom-color: #b5bac1 !important;
}

/* --- SAVE робимо як CANCEL (світлий текст) --- */
:deep(.q-dialog .q-card-actions .q-btn) {
  color: #dcddde !important; /* Discord light gray */
  font-weight: 600;
  opacity: 1 !important;
}
</style>
