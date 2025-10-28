<template>
  <div class="register-page-wrapper">
    <div class="register-card">
      <div class="register-header">
        <h3 class="register-title">Create Account</h3>
        <p class="register-subtitle">Sign up to get started</p>
      </div>

      <div class="register-form">
        <q-input
          v-model="firstName"
          filled
          label="First name"
          class="auth-input"
          dark
          color="primary"
          label-color="grey-5"
        />
        <q-input
          v-model="lastName"
          filled
          label="Last name"
          class="auth-input"
          dark
          color="primary"
          label-color="grey-5"
        />
        <q-input
          v-model="email"
          filled
          label="Email"
          class="auth-input"
          dark
          color="primary"
          label-color="grey-5"
        />
        <q-input
          v-model="password"
          type="password"
          filled
          label="Password"
          class="auth-input"
          dark
          color="primary"
          label-color="grey-5"
        />

        <q-btn
          label="Register"
          color="primary"
          class="register-button"
          size="lg"
          unelevated
          @click="registerUser"
        />

        <div class="login-link">
          <span class="login-text">Already have an account?</span>
          <q-btn flat label="Login" color="primary" @click="goLogin" class="login-btn" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import type { Member } from 'src/components/models';

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const $q = useQuasar();

function registerUser(): void {
  if (!firstName.value || !lastName.value || !email.value || !password.value) {
    $q.notify({ type: 'negative', message: 'All fields are required' });
    return;
  }

  const users = JSON.parse(localStorage.getItem('users') || '[]') as Member[];

  if (users.find((u) => u.email === email.value)) {
    $q.notify({ type: 'negative', message: 'Email already exists' });
    return;
  }

  const newUser: Member = {
    id: `user${Date.now()}`,
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    password: password.value,
    nickName: firstName.value.toLowerCase(),
    status: 'online',
    channels: ['general'],
    isTyping: false,
    typingText: '',
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  $q.notify({ type: 'positive', message: 'Registered successfully! Please login.' });
  void router.push('/auth/login');
}

function goLogin(): void {
  void router.push('/auth/login');
}
</script>

<style scoped>
.register-page-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: transparent;
  padding: 20px;
}

.register-card {
  background: #313338;
  border-radius: 16px;
  padding: 56px 64px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
  border: 1px solid #3f4147;
  width: 100%;
  max-width: 600px;
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-title {
  color: #f2f3f5;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.register-subtitle {
  color: #b5bac1;
  font-size: 15px;
  margin: 0;
  font-weight: 400;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-input {
  width: 100%;
}

.auth-input :deep(.q-field__control) {
  background: #1e1f22;
  border-radius: 8px;
  color: #f2f3f5;
  height: 50px;
}

.auth-input :deep(.q-field__native) {
  color: #f2f3f5;
  font-size: 15px;
}

.auth-input :deep(.q-field__label) {
  color: #b5bac1;
  font-size: 14px;
}

.auth-input :deep(.q-field__control):before {
  border-color: transparent;
}

.auth-input :deep(.q-field__control):hover:before {
  border-color: #5865f2;
}

.auth-input :deep(.q-field__control--focused) {
  background: #1e1f22;
}

.auth-input :deep(.q-field__control--focused):before {
  border-color: #5865f2;
  border-width: 2px;
}

.register-button {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  background: #5865f2;
  transition: all 0.2s ease;
}

.register-button:hover {
  background: #4752c4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
}

.register-button:active {
  transform: translateY(0);
}

.login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
}

.login-text {
  color: #b5bac1;
  font-size: 14px;
}

.login-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
}

.login-btn :deep(.q-btn__content) {
  color: #5865f2;
}

/* Tablet breakpoint */
@media (max-width: 768px) {
  .register-card {
    padding: 48px 44px;
    max-width: 520px;
  }

  .register-title {
    font-size: 24px;
  }

  .register-subtitle {
    font-size: 14px;
  }
}

/* Mobile breakpoint */
@media (max-width: 480px) {
  .register-page-wrapper {
    padding: 16px;
  }

  .register-card {
    padding: 32px 24px;
    border-radius: 12px;
  }

  .register-title {
    font-size: 22px;
  }

  .register-subtitle {
    font-size: 13px;
  }

  .register-form {
    gap: 14px;
  }

  .auth-input :deep(.q-field__control) {
    height: 48px;
  }

  .register-button {
    height: 48px;
    font-size: 15px;
  }

  .login-text,
  .login-btn {
    font-size: 13px;
  }
}
</style>
