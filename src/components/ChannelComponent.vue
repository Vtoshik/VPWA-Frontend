<template>
  <q-item clickable class="channel-item" @click="selectChannel">
    <q-item-section>
      <q-item-label :class="{ highlighted: isHighlighted }">
        {{ channel.name }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  channel: {
    id: string;
    name: string;
    messageFile: string;
  };
  isSelected?: boolean;
}>();

const router = useRouter();
const isHighlighted = ref(false);

function selectChannel() {
  void router.push({
    path: `/channel/${props.channel.id}`,
    query: { file: props.channel.messageFile },
  });
}
</script>

<style scoped>
.channel-item {
  color: white;
}
</style>
