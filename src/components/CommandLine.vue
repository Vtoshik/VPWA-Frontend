<template>
    <div class="q-pa-md">
        <div class="q-gutter-md">  
            <q-input rounded standout v-model="text" label="Write to chat..." label-color="white"/>
        </div>
  </div>

</template>

<script setup lang="ts">
    import { ref } from 'vue';
    const text = ref('');
</script>

<style>
.q-gutter-md {
    max-width: 780px;
}
</style>