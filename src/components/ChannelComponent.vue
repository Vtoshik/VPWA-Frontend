<template>
  <q-item
    clickable
    class="channel-item"
    :class="{ 'selected-channel': isSelected, 'invited-channel': isInvited }"
    @click="selectChannel"
  >
    <q-item-section avatar class="channel-icon">
      <q-icon :name="channel.isPrivate === true ? 'lock' : 'tag'" size="20px" />
    </q-item-section>
    <q-item-section>
      <q-item-label class="channel-name">
        {{ channel.name }}
        <q-badge v-if="isInvited" color="primary" class="invite-badge">Invited</q-badge>
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="isInvited" class="invite-actions">
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="close"
        color="negative"
        class="decline-btn"
        @click.stop="handleDeclineInvite"
        aria-label="Decline invitation"
      >
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
          Decline
        </q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="check"
        color="positive"
        class="accept-btn"
        @click.stop="handleAcceptInvite"
        aria-label="Accept invitation"
      >
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
          Accept
        </q-tooltip>
      </q-btn>
    </q-item-section>
    <q-item-section side v-else>
      <q-btn
        flat
        dense
        round
        size="sm"
        icon="close"
        class="leave-btn"
        @click.stop="handleLeaveChannel"
        aria-label="Leave channel"
      >
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
          Leave channel
        </q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Notify } from 'quasar';
import type { Channel } from './models';
import { useCurrentUser } from 'src/utils/useCurrentUser';
import { useChannels } from 'src/utils/useChannels';

const props = defineProps<{
  channel: Channel;
  isSelected?: boolean;
  isInvited?: boolean;
}>();

const emit = defineEmits<{
  'channel-selected': [channel: Channel];
  'channel-left': [channelId: string];
}>();

const router = useRouter();
const route = useRoute();
const { leaveChannel } = useChannels();
const { invitations, acceptInvitation, rejectInvitation } = useChannels();
const { addChannelToUser } = useCurrentUser();

function selectChannel() {
  // If invited, don't navigate - user needs to accept/decline first
  if (props.isInvited) {
    return;
  }

  emit('channel-selected', props.channel);
  void router.push({
    path: `/channel/${props.channel.id}`,
    query: { file: props.channel.messageFile },
  });
}

async function handleAcceptInvite() {
  const invitation = invitations.value.find((inv) => String(inv.channelId) === props.channel.id);

  if (!invitation) {
    Notify.create({
      type: 'negative',
      message: 'Invitation not found',
      position: 'top',
    });
    return;
  }

  try {
    await acceptInvitation(invitation.id);

    // Add channel to user's channel list in localStorage
    addChannelToUser(props.channel.id);

    Notify.create({
      type: 'positive',
      message: `Successfully joined channel: ${props.channel.name}`,
      position: 'top',
    });

    // Navigate to the channel after accepting
    void router.push({
      path: `/channel/${props.channel.id}`,
      query: { file: props.channel.messageFile },
    });
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to accept invitation',
      position: 'top',
    });
  }
}

async function handleDeclineInvite() {
  const invitation = invitations.value.find((inv) => String(inv.channelId) === props.channel.id);

  if (!invitation) {
    Notify.create({
      type: 'negative',
      message: 'Invitation not found',
      position: 'top',
    });
    return;
  }

  try {
    await rejectInvitation(invitation.id);
    Notify.create({
      type: 'info',
      message: `Declined invitation to: ${props.channel.name}`,
      position: 'top',
    });

    // Channel will be automatically removed from the list by rejectInvitation()
    // Navigate to home if we were on this channel
    const currentChannelId = route.params.id as string;
    if (props.channel.id === currentChannelId) {
      void router.push('/');
    }
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to decline invitation',
      position: 'top',
    });
  }
}

async function handleLeaveChannel() {
  try {
    await leaveChannel(Number(props.channel.id));

    Notify.create({
      type: 'positive',
      message: `You left channel: ${props.channel.name}`,
      position: 'top',
    });

    emit('channel-left', props.channel.id);

    if (route.params.id === props.channel.id) {
      void router.push('/');
    }
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.message || 'Failed to leave channel',
      position: 'top',
    });
  }
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

/* Invited channel styling */
.invited-channel {
  background: rgba(33, 150, 243, 0.15);
  border-left: 3px solid #2196f3;
}

.invited-channel:hover {
  background: rgba(33, 150, 243, 0.25);
}

.channel-icon {
  min-width: 32px;
  color: #949ba4;
}

.selected-channel .channel-icon {
  color: #ffffff;
}

.invited-channel .channel-icon {
  color: #2196f3;
}

.channel-name {
  color: #949ba4;
  font-weight: 500;
  font-size: 15px;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-channel .channel-name {
  color: #ffffff;
  font-weight: 600;
}

.invited-channel .channel-name {
  color: #2196f3;
  font-weight: 600;
}

.channel-item:hover .channel-name {
  color: #dcddde;
}

.channel-item:hover .channel-icon {
  color: #dcddde;
}

.invite-badge {
  font-size: 10px;
  padding: 2px 6px;
}

.leave-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: #949ba4;
}

.channel-item:hover .leave-btn {
  opacity: 1;
}

.leave-btn:hover {
  color: #ed4245;
  background: rgba(237, 66, 69, 0.1);
}

.invite-actions {
  display: flex;
  gap: 4px;
}

.accept-btn,
.decline-btn {
  opacity: 1;
  transition: all 0.2s ease;
}

.accept-btn {
  color: #3ba55d;
}

.accept-btn:hover {
  background: rgba(59, 165, 93, 0.2);
}

.decline-btn {
  color: #ed4245;
}

.decline-btn:hover {
  background: rgba(237, 66, 69, 0.2);
}
</style>
