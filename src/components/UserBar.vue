<template>
  <q-item clickable class="user-bar">
    <q-avatar size="40px" rounded>
      <img src="https://cdn.quasar.dev/img/avatar.png" />
    </q-avatar>

    <q-item-section class="user-info">
      <div class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
      <div class="user-status" :class="getStatusClass(currentUser?.status)">
        <q-icon :name="getStatusIcon(currentUser?.status)" size="xs" class="status-icon" />
        {{ currentUser?.status || 'offline' }}
      </div>
    </q-item-section>

    <q-btn flat dense round icon="settings" @click="menu = true" />

    <!-- Menu -->
    <q-menu v-model="menu">
      <q-list>
        <!-- Status Selection -->
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

        <!-- Name Changes -->
        <q-item clickable v-close-popup @click="openRenameDialog = true">
          <q-item-section>Change name</q-item-section>
        </q-item>

        <!-- Logout -->
        <q-item clickable v-close-popup @click="logoutUser">
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- Dialog for name changes -->
    <q-dialog v-model="openRenameDialog">
      <q-card class="q-pa-md bg-dark text-white">
        <q-card-section>
          <div class="text-h6">Change username</div>
        </q-card-section>

        <q-card-section>
          <q-input v-model="newFirstName" label="First Name" filled dense />
          <q-input v-model="newLastName" label="Last Name" filled dense class="q-mt-sm" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Save" color="primary" @click="saveNewName" />
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

const router = useRouter();
const menu = ref(false);
const openRenameDialog = ref(false);
const currentUser = ref<Member | null>(null);
const newFirstName = ref('');
const newLastName = ref('');

onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser.value = JSON.parse(stored);
  }
});

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

function saveNewName() {
  if (currentUser.value) {
    currentUser.value.firstName = newFirstName.value || currentUser.value.firstName;
    currentUser.value.lastName = newLastName.value || currentUser.value.lastName;

    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
  }
  openRenameDialog.value = false;
}

async function logoutUser() {
  localStorage.removeItem('currentUser');
  await router.push('/auth/login');
}
</script>

<style scoped>
.user-bar {
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: 240px;
  background: #1e1f22;
  border-radius: 8px;
  padding: 10px 8px;
  border: 2px solid #202225;
  transition: all 0.2s ease;
  margin: 0 4px;
}

.user-bar:hover {
  background: #232428;
  border-color: #2a2c31;
}

.user-info {
  flex-grow: 1;
  margin-left: 12px;
  color: white;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #ffffff;
}

.user-status {
  font-size: 12px;
  color: #b9bbbe;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
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
</style>
