<template>
  <q-layout view="lHh Lpr lFf" class="bg-dark" style="height: 100vh;">
    <q-page-container class="flex flex-center">
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
</script>
<style scoped>
.bg-dark {
  background-color: #1e1f22;
}
</style>