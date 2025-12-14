import { ref, computed } from 'vue';
import { apiService } from 'src/services/api';
import { wsService } from 'src/services/websocket';
import type { Channel } from 'src/services/models';
import { useCurrentUser } from './CurrentUser';
import type { ApiError, ChannelData } from '../services/models';

function convertToChannel(channelData: ChannelData): Channel {
  console.log('Converting channel:', {
    name: channelData.name,
    isPrivate: channelData.isPrivate,
    type: typeof channelData.isPrivate
  });

  return {
    id: String(channelData.id),
    name: channelData.name,
    isPrivate: channelData.isPrivate,
    adminId: channelData.adminId,
    lastActivity: channelData.lastActivity,
    createdAt: channelData.createdAt,
    updatedAt: channelData.updatedAt,
  };
}

// Global state - shared across all useChannels() calls
const channels = ref<Channel[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const invitations = ref<
  Array<{
    id: number;
    channelId: number;
    channelName: string;
    fromUserId: number;
    fromNickname: string;
    status: string;
    createdAt: string;
  }>
>([]);

// Singleton pattern - return the same instance
export function useChannels() {
  async function loadChannels(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.getChannels();
      channels.value = response.channels.map(convertToChannel);
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to load channels';
      console.error('Error loading channels:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadInvitations(): Promise<void> {
    try {
      console.log('Loading invitations from API...');
      const response = await apiService.getInvitations();
      invitations.value = response.invites;
      console.log('Loaded invitations:', invitations.value);

      // Add invited channels to channels list if they don't exist
      for (const invite of invitations.value) {
        const channelExists = channels.value.some((ch) => ch.id === String(invite.channelId));
        if (!channelExists) {
          // Create a minimal channel object for the invitation
          const invitedChannel: Channel = {
            id: String(invite.channelId),
            name: invite.channelName,
            isPrivate: false,
            adminId: 0,
            lastActivity: '',
            createdAt: '',
            updatedAt: '',
          };
          channels.value.push(invitedChannel);
          console.log('Added invited channel to list:', invitedChannel);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      console.error('Error loading invitations:', err);
      console.error('Error details:', apiError.response?.data);
      // Don't throw - just log the error and continue with empty invitations
      invitations.value = [];
    }
  }

  async function acceptInvitation(inviteId: number): Promise<void> {
    try {
      const response = await apiService.acceptInvitation(inviteId);

      // Remove invitation from list
      invitations.value = invitations.value.filter((inv) => inv.id !== inviteId);

      // Update the channel with full data from backend if it was returned
      if (response.channel) {
        const channelId = String(response.channel.id);
        const existingChannelIndex = channels.value.findIndex((ch) => ch.id === channelId);

        if (existingChannelIndex !== -1) {
          // Replace the minimal channel data with full data from backend
          channels.value[existingChannelIndex] = convertToChannel(response.channel);
        } else {
          // Add the channel if it doesn't exist
          channels.value.push(convertToChannel(response.channel));
        }
      } else {
        // Fallback: reload all channels if backend didn't return channel data
        await loadChannels();
      }
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to accept invitation';
      throw err;
    }
  }

  async function rejectInvitation(inviteId: number): Promise<void> {
    try {
      const invitation = invitations.value.find((inv) => inv.id === inviteId);
      await apiService.rejectInvitation(inviteId);

      // Remove invitation from list
      invitations.value = invitations.value.filter((inv) => inv.id !== inviteId);

      // Remove the invited channel from channels list if user is not a member
      if (invitation) {
        const channelId = String(invitation.channelId);
        const isUserMember = await apiService
          .getChannels()
          .then((res) => res.channels.some((ch) => String(ch.id) === channelId))
          .catch(() => false);

        if (!isUserMember) {
          channels.value = channels.value.filter((ch) => ch.id !== channelId);
        }
      }
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to reject invitation';
      throw err;
    }
  }

  async function createChannel(name: string, isPrivate: boolean = false): Promise<Channel | null> {
    console.log('📤 createChannel called with:', {
      name,
      isPrivate,
      type: typeof isPrivate,
    });

    try {
      const response = await apiService.createChannel({ name, isPrivate });
      console.log('📥 Backend response for createChannel:', response.channel);
      const newChannel = convertToChannel(response.channel);

      // Add to local channels list
      channels.value.push(newChannel);

      // Add channel to current user's channels list
      const { addChannelToUser } = useCurrentUser();
      addChannelToUser(newChannel.id);

      return newChannel;
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to create channel';
      throw err;
    }
  }

  async function joinChannel(name: string): Promise<Channel | null> {
    try {
      const response = await apiService.joinChannel({ name });
      const channel = convertToChannel(response.channel);

      // Check if channel already in local list
      const existingIndex = channels.value.findIndex((ch) => ch.id === channel.id);
      if (existingIndex === -1) {
        // Add to local channels list
        channels.value.push(channel);
      }

      // Add channel to current user's channels list
      const { addChannelToUser } = useCurrentUser();
      addChannelToUser(channel.id);

      return channel;
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to join channel';
      throw err;
    }
  }

  async function deleteChannel(channelId: number): Promise<void> {
    try {
      await apiService.deleteChannel(channelId);
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to delete channel';
      throw err;
    }
  }

  async function leaveChannel(channelId: number) {
    try {
      await apiService.leaveChannel(channelId);

      channels.value = channels.value.filter((ch) => ch.id !== String(channelId));
    } catch (err) {
      const apiError = err as ApiError;
      error.value = apiError.response?.data?.message || 'Failed to leave channel';
      throw err;
    }
  }

  function setupSocketListeners(): void {
    wsService.onChannelCreated((channel) => {
      const apiChannelData: ChannelData = {
        id: Number(channel.id),
        name: channel.name,
        isPrivate: channel.isPrivate,
        adminId: 0,
        lastActivity: channel.createdAt,
        createdAt: channel.createdAt,
        updatedAt: channel.createdAt,
      };
      channels.value.push(convertToChannel(apiChannelData));
    });

    wsService.onChannelDeleted((channelId: string) => {
      const index = channels.value.findIndex((ch) => ch.id === channelId);
      if (index !== -1) {
        channels.value.splice(index, 1);
      }
    });

    wsService.onChannelInvite((data) => {
      console.log('Invited to channel:', data);
      // Reload invitations to get the new one
      void loadInvitations();
    });

    wsService.onChannelKick((data) => {
      console.log('Kicked from channel:', data);
      const channelId = String(data.channelId);

      // Remove channel from local list
      const index = channels.value.findIndex((ch) => ch.id === channelId);
      if (index !== -1) {
        channels.value.splice(index, 1);
      }

      // Remove from current user's channels
      const { removeChannelFromUser } = useCurrentUser();
      removeChannelFromUser(channelId);

      // Emit custom event for navigation (ChannelPage will handle redirect)
      window.dispatchEvent(
        new CustomEvent('channel:kicked', {
          detail: { channelId, channelName: data.channelName, kickedBy: data.kickedBy },
        }),
      );
    });

    wsService.onChannelRevoke((data) => {
      console.log('Revoked from channel:', data);
      const channelId = String(data.channelId);

      // Remove channel from local list
      const index = channels.value.findIndex((ch) => ch.id === channelId);
      if (index !== -1) {
        channels.value.splice(index, 1);
      }

      // Remove from current user's channels
      const { removeChannelFromUser } = useCurrentUser();
      removeChannelFromUser(channelId);

      // Emit custom event for navigation (ChannelPage will handle redirect)
      window.dispatchEvent(
        new CustomEvent('channel:revoked', {
          detail: { channelId, channelName: data.channelName, revokedBy: data.revokedBy },
        }),
      );
    });
  }

  function findChannelById(channelId: number): Channel | undefined {
    return channels.value.find((ch) => ch.id === String(channelId));
  }

  const publicChannels = computed(() => channels.value.filter((ch) => !ch.isPrivate));
  const privateChannels = computed(() => channels.value.filter((ch) => ch.isPrivate));

  return {
    channels,
    isLoading,
    error,
    invitations,
    publicChannels,
    privateChannels,
    loadChannels,
    loadInvitations,
    acceptInvitation,
    rejectInvitation,
    createChannel,
    joinChannel,
    deleteChannel,
    leaveChannel,
    findChannelById,
    setupSocketListeners,
  };
}
