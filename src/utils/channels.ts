import type { Channel, ChannelsData } from 'src/components/models';
import mockChannelsData from 'src/assets/test-data/mock-channels.json';

export function getAllChannels(): Channel[] {
  const data = mockChannelsData as ChannelsData;
  return data.channels;
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
