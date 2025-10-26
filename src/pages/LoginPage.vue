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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';


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

const email = ref('');
const password = ref('');
const router = useRouter();

const loginUser = (): void => {
  const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
  const user = users.find(
    (u) => u.email === email.value && u.password === password.value
  );

  if (user) {
    Notify.create({ type: 'negative', message: 'Invalid email or password' });
  }

  localStorage.setItem('currentUser', JSON.stringify(user));
  router.push('/').catch(() => {});
};

const goRegister = (): void => {
  router.push('/auth/register').catch(() => {});
};
</script>

<style scoped>
.auth-input {
  width: 280px;
}
</style>