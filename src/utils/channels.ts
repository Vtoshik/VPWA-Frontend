import type { Channel, ChannelsData } from 'src/components/models';
import mockChannelsData from 'src/assets/test-data/mock-channels.json';

const CHANNELS_STORAGE_KEY = 'channels';

export function getAllChannels(): Channel[] {
  const storedChannels = localStorage.getItem(CHANNELS_STORAGE_KEY);
  if (storedChannels) {
    try {
      const parsed = JSON.parse(storedChannels) as Channel[];
      return parsed;
    } catch (error) {
      console.error('Error parsing channels from localStorage:', error);
    }
  }

  const data = mockChannelsData as ChannelsData;
  return data.channels;
}

function saveChannels(channels: Channel[]): void {
  localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels));
}

export function getChannelById(channelId: string): Channel | null {
  const channels = getAllChannels();
  return channels.find((ch) => ch.id === channelId) || null;
}

export function channelExists(channelId: string): boolean {
  return getChannelById(channelId) !== null;
}

export function isChannelPrivate(channelId: string): boolean {
  const channel = getChannelById(channelId);
  return channel?.isPrivate ?? false;
}

export function getPublicChannels(): Channel[] {
  return getAllChannels().filter((ch) => !ch.isPrivate);
}

export function getPrivateChannels(): Channel[] {
  return getAllChannels().filter((ch) => ch.isPrivate);
}

export function createChannel(
  channelName: string,
  isPrivate: boolean,
): {
  success: boolean;
  message: string;
  channel?: Channel;
} {
  const channelId = channelName.toLowerCase().trim();

  if (!channelId || channelId.length === 0) {
    return { success: false, message: 'Channel name cannot be empty' };
  }

  if (channelExists(channelId)) {
    return { success: false, message: `Channel "${channelName}" already exists` };
  }

  const newChannel: Channel = {
    id: channelId,
    name: channelName.trim(),
    messageFile: `/src/assets/test-data/mock-messages-${channelId}.json`,
    isPrivate,
  };

  const channels = getAllChannels();
  channels.push(newChannel);
  saveChannels(channels);

  localStorage.setItem(newChannel.messageFile, JSON.stringify([]));

  return {
    success: true,
    message: `Successfully created ${isPrivate ? 'private' : 'public'} channel: ${channelName}`,
    channel: newChannel,
  };
}
