<template>
  <q-item class="user-bar">
    <!-- AVATAR -->
    <q-item-section avatar class="user-avatar-section" clickable @click.stop="menu = true">
      <q-avatar size="40px" rounded class="user-avatar">
        <img src="https://cdn.quasar.dev/img/avatar.png" />
      </q-avatar>
    </q-item-section>

    <!-- USER INFO -->
    <q-item-section class="user-info" clickable @click.stop="menu = true">
      <div class="user-name">{{ currentUser?.nickName }}</div>
      <div class="user-status" :class="getStatusClass(currentUser?.status)">
        <q-icon :name="getStatusIcon(currentUser?.status)" size="xs" class="status-icon" />
        {{ currentUser?.status || 'offline' }}
      </div>
    </q-item-section>

    <!-- SETTINGS BUTTON (ONLY SETTINGS) -->
    <q-item-section side class="user-settings-section">
      <!-- SETTINGS -->
      <q-btn flat dense round icon="settings" @click.stop="goToSettings" />
    </q-item-section>

    <!-- ACCOUNT MENU -->
    <q-menu v-model="menu" anchor="top left" self="bottom left">
      <q-list style="min-width: 200px">
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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import type { Member } from 'src/services/models';
import { Notify } from 'quasar';
import { logout } from 'src/utils/auth';
import { apiService } from 'src/services/api';
import { wsService } from 'src/services/websocket';

const router = useRouter();
const menu = ref(false);
const openRenameDialog = ref(false);
const currentUser = ref<Member | null>(null);
const newNickName = ref('');

function handleWebSocketConnected() {
  //console.log('WebSocket connected event received in UserBar');
  Notify.create({
    type: 'positive',
    message: 'Connected - you are now online',
    position: 'top',
    timeout: 2000,
  });
}

onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser.value = JSON.parse(stored);
  }

  // Listen for WebSocket connection events
  window.addEventListener('websocket:connected', handleWebSocketConnected);
});

onBeforeUnmount(() => {
  window.removeEventListener('websocket:connected', handleWebSocketConnected);
});

function goToSettings() {
  void router.push('/settings');
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

async function changeStatus(newStatus: 'online' | 'DND' | 'offline') {
  if (!currentUser.value) return;

  try {
    await apiService.updateUserStatus(newStatus);

    currentUser.value.status = newStatus;
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));

    // Handle WebSocket connection based on status
    if (newStatus === 'offline') {
      // Disconnect WebSocket when going offline
      console.log('Status changed to offline - disconnecting WebSocket');
      wsService.disconnect();

      Notify.create({
        type: 'info',
        message: 'You are now offline',
        position: 'top',
        timeout: 2000,
      });
    } else {
      // Connect WebSocket if not connected when going online/DND
      if (!wsService.isConnected()) {
        console.log(`Status changed to ${newStatus} - connecting WebSocket`);
        const token = localStorage.getItem('auth_token');
        if (token) {
          wsService.connect(token);
          // Success notification will come from the websocket:connected event listener
        }
      } else {
        // Just update status on server if already connected
        wsService.updateStatus(newStatus);

        Notify.create({
          type: 'positive',
          message: `Status: ${newStatus}`,
          position: 'top',
          timeout: 2000,
        });
      }
    }
  } catch (error) {
    console.log('Failed to change status:', error);
    Notify.create({
      type: 'negative',
      message: 'Failed to change status',
      position: 'top',
    });
  }
}

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
  width: 100%;
  overflow: hidden;
  cursor: pointer;
}

.user-info :deep(.q-item__section) {
  width: 100%;
}

.user-info-content {
  width: 100%;
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

/* Dialog styling */
:deep(.q-dialog .q-input input) {
  color: #ffffff !important;
}

/* Label (Nickname) lighter color */
:deep(.q-dialog .q-field__label) {
  color: #b5bac1 !important;
}

/* Field background Discord-style */
:deep(.q-dialog .q-field--filled .q-field__control) {
  background: #2b2d31 !important;
  border-radius: 6px;
  color: #ffffff !important;
}

/* Field underline */
:deep(.q-dialog .q-field--filled .q-field__control:before) {
  border-bottom-color: #777 !important;
}
:deep(.q-dialog .q-field--filled .q-field__control:hover:before) {
  border-bottom-color: #b5bac1 !important;
}

/* SAVE button light text like CANCEL */
:deep(.q-dialog .q-card-actions .q-btn) {
  color: #dcddde !important; /* Discord light gray */
  font-weight: 600;
  opacity: 1 !important;
}
</style>
