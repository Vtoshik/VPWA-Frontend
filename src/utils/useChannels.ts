import { ref, computed } from 'vue';
import { apiService, type ChannelData } from 'src/services/api';
import { wsService } from 'src/services/websocket';
import type { Channel } from 'src/components/models';
import { useCurrentUser } from './useCurrentUser';

function convertToChannel(channelData: ChannelData): Channel {
  return {
    id: String(channelData.id),
    name: channelData.name,
    isPrivate: channelData.isPrivate,
    messageFile: `/api/channels/${channelData.id}/messages`,
    adminId: channelData.adminId,
    lastActivity: channelData.lastActivity,
    createdAt: channelData.createdAt,
    updatedAt: channelData.updatedAt,
  };
}

const channels = ref<Channel[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export function useChannels() {
  async function loadChannels(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await apiService.getChannels();
      channels.value = response.channels.map(convertToChannel);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to load channels';
      console.error('Error loading channels:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function createChannel(name: string, isPrivate: boolean = false): Promise<Channel | null> {
    try {
      const response = await apiService.createChannel({ name, isPrivate });
      const newChannel = convertToChannel(response.channel);

      // Add to local channels list
      channels.value.push(newChannel);

      // Add channel to current user's channels list
      const { addChannelToUser } = useCurrentUser();
      addChannelToUser(newChannel.id);

      return newChannel;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create channel';
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
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to join channel';
      throw err;
    }
  }

  async function deleteChannel(channelId: number): Promise<void> {
    try {
      await apiService.deleteChannel(channelId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete channel';
      throw err;
    }
  }

  async function leaveChannel(channelId: number): Promise<void> {
    try {
      await apiService.leaveChannel(channelId);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to leave channel';
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
    publicChannels,
    privateChannels,
    loadChannels,
    createChannel,
    joinChannel,
    deleteChannel,
    leaveChannel,
    findChannelById,
    setupSocketListeners,
  };
}
