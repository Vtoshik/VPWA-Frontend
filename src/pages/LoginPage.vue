<template>
  <div class="login-page-wrapper">
    <div class="login-card">
      <div class="login-header">
        <h3 class="login-title">Welcome Back!</h3>
        <p class="login-subtitle">Sign in to continue to your account</p>
      </div>

      <div class="login-form">
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
          label="Login"
          color="primary"
          class="login-button"
          size="lg"
          unelevated
          @click="loginUser"
        />

        <div class="register-link">
          <span class="register-text">Don't have an account?</span>
          <q-btn flat label="Register" color="primary" @click="goRegister" class="register-btn" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notify, useQuasar, Loading } from 'quasar';
import { login } from 'src/utils/auth';
import { useChannels } from 'src/utils/useChannels';

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

const loginUser = async (): Promise<void> => {
  if (!email.value || !password.value) {
    Notify.create({ type: 'negative', message: 'Please fill in all fields' });
    return;
  }

  Loading.show({
    message: 'Signing in...',
    spinnerColor: 'primary',
  });

  try {
    const user = await login(email.value, password.value);

    // Load channels into the composable
    const { loadChannels, setupSocketListeners } = useChannels();
    await loadChannels();
    setupSocketListeners();

    Loading.hide();
    Notify.create({
      type: 'positive',
      message: `Welcome back, ${user.firstName || user.nickName}!`
    });

    setTimeout(() => {
      showMissedNotifications();
    }, 2000);

    void router.push('/');
  } catch (error: unknown) {
    Loading.hide();

    const errorMessage =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid email or password'
        : 'An error occurred during login';

    Notify.create({
      type: 'negative',
      message: errorMessage
    });
  }
};

function showMissedNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not supported or permission not granted');
    return;
  }

  // Check if app is visible using document.hidden
  const isAppVisible = !document.hidden && $q.appVisible;

  if (isAppVisible) {
    console.log('Skipping all notifications - app is visible');
    return;
  }

  mockMissedMessages.forEach((msg, index) => {
    setTimeout(() => {
      // Double-check visibility at the time of showing notification
      if (!document.hidden && $q.appVisible) {
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
.login-page-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: transparent;
  padding: 20px;
}

.login-card {
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

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  color: #f2f3f5;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.login-subtitle {
  color: #b5bac1;
  font-size: 15px;
  margin: 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
  background: #5865f2;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: #4752c4;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.register-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
}

.register-text {
  color: #b5bac1;
  font-size: 14px;
}

.register-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
}

.register-btn :deep(.q-btn__content) {
  color: #5865f2;
}

/* Tablet breakpoint */
@media (max-width: 768px) {
  .login-card {
    padding: 48px 44px;
    max-width: 520px;
  }

  .login-title {
    font-size: 24px;
  }

  .login-subtitle {
    font-size: 14px;
  }
}

/* Mobile breakpoint */
@media (max-width: 480px) {
  .login-page-wrapper {
    padding: 16px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 12px;
  }

  .login-title {
    font-size: 22px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .auth-input :deep(.q-field__control) {
    height: 48px;
  }

  .login-button {
    height: 48px;
    font-size: 15px;
  }

  .register-text,
  .register-btn {
    font-size: 13px;
  }
}
</style>
