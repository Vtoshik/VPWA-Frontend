<template>
  <q-item clickable class="user-bar">
    <q-avatar size="40px" rounded>
      <img src="https://cdn.quasar.dev/img/avatar.png">
    </q-avatar>

    <q-item-section class="user-info">
      <div class="user-name">
        {{ currentUser?.firstName }} {{ currentUser?.lastName }}
      </div>
      <div class="user-status">Online</div>
    </q-item-section>

    <q-btn flat dense round icon="settings" @click="menu = true" />

    <!-- Меню -->
    <q-menu v-model="menu">
      <q-list>

        <!-- Зміна імені -->
        <q-item clickable v-close-popup @click="openRenameDialog = true">
          <q-item-section>Change name</q-item-section>
        </q-item>

        <!-- Logout -->
        <q-item clickable v-close-popup @click="logoutUser">
          <q-item-section>Logout</q-item-section>
        </q-item>

      </q-list>
    </q-menu>

    <!-- Діалог для зміни імені -->
    <q-dialog v-model="openRenameDialog">
      <q-card class="q-pa-md bg-dark text-white">
        <q-card-section>
          <div class="text-h6">Change username</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newFirstName"
            label="First Name"
            filled
            dense
          />
          <q-input
            v-model="newLastName"
            label="Last Name"
            filled
            dense
            class="q-mt-sm"
          />
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
import type { CurrentUser } from 'src/components/models';

const router = useRouter();
const menu = ref(false);
const openRenameDialog = ref(false);

const currentUser = ref<CurrentUser | null>(null);

// поля для зміни імені
const newFirstName = ref('');
const newLastName = ref('');

onMounted(() => {
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser.value = JSON.parse(stored);
  }
});

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
}

.settings-btn {
  color: #b9bbbe;
  transition: color 0.2s ease;
}

.settings-btn:hover {
  color: #ffffff;
}
</style>
