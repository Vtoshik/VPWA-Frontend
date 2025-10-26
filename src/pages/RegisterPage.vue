<template>
  <div class="column items-center q-gutter-md">
    <h3 class="text-white">Register</h3>

    <q-input v-model="firstName" filled label="First name" class="auth-input" />
    <q-input v-model="lastName" filled label="Last name" class="auth-input" />
    <q-input v-model="email" filled label="Email" class="auth-input" />
    <q-input v-model="password" type="password" filled label="Password" class="auth-input" />

    <q-btn label="Register" color="primary" class="full-width" @click="registerUser" />
    <q-btn flat label="Already have an account? Login" color="grey-5" @click="goLogin" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  nickName: string;
  status: string;
  channels: string[];
}

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const $q = useQuasar();

function registerUser(): void {

  void router.push('/');
  const users = (JSON.parse(localStorage.getItem('users') || '[]') as User[]);

  if (users.find((u) => u.email === email.value)) {
    $q.notify({ type: 'negative', message: 'Email already exists' });
  }

  const newUser: User = {
    id: Date.now(),
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    password: password.value,
    nickName: firstName.value.toLowerCase(),
    status: 'online',
    channels: ['general'],
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('currentUser', JSON.stringify(newUser));

  $q.notify({ type: 'positive', message: 'Registered successfully!' });
}

function goLogin(): void {
  void router.push('/auth/login');
}
</script>

<style scoped>
.auth-input {
  width: 280px;
}
</style>