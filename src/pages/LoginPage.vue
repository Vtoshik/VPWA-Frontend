<template>
  <div class="column items-center q-gutter-md">
    <h3 class="text-white">Login</h3>

    <q-input v-model="email" filled label="Email" class="auth-input" />
    <q-input v-model="password" type="password" filled label="Password" class="auth-input" />

    <q-btn label="Login" color="primary" class="full-width" @click="loginUser" />
    <q-btn flat label="Don't have an account? Register" color="grey-5" @click="goRegister" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, useQuasar } from 'quasar';
import type { Member } from 'src/components/models';

const email = ref('');
const password = ref('');
const router = useRouter();
const $q = useQuasar();

const mockMissedMessages = [
  { sender: 'Jane Smith', channel: 'General', text: 'Hey everyone! Welcome to the channel' },
  {
    sender: 'Bob Wilson',
    channel: 'General',
    text: 'Hi @johnd, can you help me with the project?',
  },
  { sender: 'Edward Tech', channel: 'Development', text: 'New feature deployed! Please test it.' },
];

onMounted(async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
});

const loginUser = (): void => {
  const users = JSON.parse(localStorage.getItem('users') || '[]') as Member[];
  const user = users.find((u) => u.email === email.value && u.password === password.value);

  if (!user) {
    Notify.create({ type: 'negative', message: 'Invalid email or password' });
    return;
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  Notify.create({ type: 'positive', message: `Welcome back, ${user.firstName}!` });

  setTimeout(() => {
    showMissedNotifications();
  }, 2000);

  void router.push('/');
};

function showMissedNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not supported or permission not granted');
    return;
  }

  mockMissedMessages.forEach((msg, index) => {
    setTimeout(() => {
      if ($q.appVisible) {
        console.log(`Skipping notification for "${msg.sender}" - app is visible`);
        return;
      }

      const truncatedText = msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text;
      const notification = new Notification(`${msg.sender} in #${msg.channel}`, {
        body: truncatedText,
        icon: '/icons/favicon-96x96.png',
        tag: `demo-message-${index}`,
        requireInteraction: false,
      });

      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }, index * 1500);
  });
}

const goRegister = (): void => {
  router.push('/auth/register').catch(() => {});
};
</script>

<style scoped>
.auth-input {
  width: 280px;
}
</style>
