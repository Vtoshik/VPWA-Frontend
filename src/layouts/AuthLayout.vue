<template>
  <q-layout view="lHh Lpr lFf" class="auth-layout" style="height: 100vh;">
    <q-page-container class="auth-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
</script>
<style scoped>
.auth-layout {
  background-color: #2b2d31;
}

.auth-page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
</style>