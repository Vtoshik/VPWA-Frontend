<template>
  <q-item
    clickable
    class="channel-item"
    :class="{ 'selected-channel': isSelected }"
    @click="selectChannel"
  >
    <q-item-section avatar class="channel-icon">
      <q-icon :name="channel.isPrivate === true ? 'lock' : 'tag'" size="20px" />
    </q-item-section>
    <q-item-section>
      <q-item-label class="channel-name">
        {{ channel.name }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import type { Channel } from './models';

const props = defineProps<{
  channel: Channel;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  'channel-selected': [channel: Channel];
}>();

const router = useRouter();

function selectChannel() {
  emit('channel-selected', props.channel);
  void router.push({
    path: `/channel/${props.channel.id}`,
    query: { file: props.channel.messageFile },
  });
}
</script>

<style scoped>
.channel-item {
  padding: 8px 12px;
  margin: 2px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.channel-item:hover {
  background: rgba(79, 84, 92, 0.32);
}

.selected-channel {
  background: rgba(79, 84, 92, 0.48);
}

.channel-icon {
  min-width: 32px;
  color: #949ba4;
}

.selected-channel .channel-icon {
  color: #ffffff;
}

.channel-name {
  color: #949ba4;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s ease;
}

.selected-channel .channel-name {
  color: #ffffff;
  font-weight: 600;
}

.channel-item:hover .channel-name {
  color: #dcddde;
}

.channel-item:hover .channel-icon {
  color: #dcddde;
}
</style>
