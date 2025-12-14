<template>
  <q-page class="settings-page">
    <!-- HEADER -->
    <div class="settings-header">
      <div class="settings-header-inner">
        <q-btn flat dense round icon="arrow_back" class="back-btn" @click="goBack" />
        <h5 class="settings-title">Settings</h5>
      </div>
    </div>

    <!-- CONTENT -->
    <div class="settings-content">
      <div class="settings-content-inner">
        <!-- NOTIFICATIONS SECTION -->
        <div class="settings-section">
          <h6 class="section-title">Notifications</h6>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">Mention-only notifications</div>
              <div class="setting-description">
                Only receive notifications for messages that mention you
              </div>
            </div>
            <q-toggle
              v-model="notifyOnMentionOnly"
              color="primary"
              @update:model-value="updateNotificationSettings"
            />
          </div>
        </div>

        <!-- FUTURE SECTIONS CAN BE ADDED HERE -->
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Notify } from 'quasar';
import { getCurrentUser, setCurrentUser } from 'src/utils/auth';
import { apiService } from 'src/services/api';

const router = useRouter();
const currentUser = ref(getCurrentUser());
const notifyOnMentionOnly = ref(false);

onMounted(() => {
  if (currentUser.value) {
    notifyOnMentionOnly.value = currentUser.value.notifyOnMentionOnly || false;
  }
});

function goBack() {
  router.back();
}

async function updateNotificationSettings(newValue: boolean) {
  if (!currentUser.value) return;

  try {
    await apiService.updateUserSettings(newValue);
    currentUser.value.notifyOnMentionOnly = newValue;
    setCurrentUser(currentUser.value);

    Notify.create({
      type: 'positive',
      message: 'Notification settings updated',
      position: 'top',
    });
  } catch (error) {
    console.error('Failed to update settings:', error);
    notifyOnMentionOnly.value = !newValue;

    Notify.create({
      type: 'negative',
      message: 'Failed to update settings',
      position: 'top',
    });
  }
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #26282b;
  overflow: hidden;
}

/* HEADER - FULL WIDTH */
.settings-header {
  width: 100%;
  background: #1f2022;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-header-inner {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 8px;
  max-width: 800px;
  margin: 0 auto;
}

.back-btn {
  color: #b9bbbe;
}

.back-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.settings-title {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

/* CONTENT - CENTERED */
.settings-content {
  flex: 1;
  overflow-y: auto;
  width: 100%;
}

.settings-content-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px;
}

/* CUSTOM SCROLLBAR */
.settings-content::-webkit-scrollbar {
  width: 8px;
}

.settings-content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.settings-section {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 16px 0;
  color: #b9bbbe;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #2f3136;
  border-radius: 8px;
  margin-bottom: 12px;
}

.setting-info {
  flex: 1;
  margin-right: 16px;
}

.setting-label {
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-description {
  color: #b9bbbe;
  font-size: 14px;
  line-height: 1.4;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .settings-header {
    padding: 12px 16px;
  }

  .settings-title {
    font-size: 18px;
  }

  .settings-content {
    padding: 16px 12px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .setting-info {
    margin-right: 0;
  }
}
</style>
