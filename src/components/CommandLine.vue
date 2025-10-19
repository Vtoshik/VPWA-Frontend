<template>
  <div class="q-pa-md">
    <div class="q-gutter-md">
      <q-input
        rounded
        standout
        v-model="text"
        label="Write to chat..."
        label-color="white"
        @keyup.enter="sendMessage"
      >
        <template v-slot:append>
          <q-btn round dense @click="sendMessage" icon="send" />
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue';

const text = ref('');
const emit = defineEmits(['send-message']);

function sendMessage() {
  if (text.value.trim()) {
    emit('send-message', text.value);
    text.value = '';
  }
}
</script>

<style scoped>
.q-gutter-md {
  width: 100%;
}
</style>
