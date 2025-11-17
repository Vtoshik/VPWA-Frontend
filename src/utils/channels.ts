import { useChannels } from './useChannels';

export function getAllChannels() {
  const { channels } = useChannels();
  return channels.value;
}

export function getChannelById(channelId: string) {
  const { findChannelById } = useChannels();
  return findChannelById(Number(channelId)) || null;
}

export function channelExists(channelId: string) {
  return getChannelById(channelId) !== null;
}

export function isChannelPrivate(channelId: string) {
  const channel = getChannelById(channelId);
  return channel?.isPrivate ?? false;
}

export function getPublicChannels() {
  const { publicChannels } = useChannels();
  return publicChannels.value;
}

export function getPrivateChannels() {
  const { privateChannels } = useChannels();
  return privateChannels.value;
}

export async function createChannel(channelName: string, isPrivate: boolean) {
  const { createChannel: create } = useChannels();

  try {
    const channel = await create(channelName, isPrivate);
    return {
      success: true,
      message: `Successfully created ${isPrivate ? 'private' : 'public'} channel: ${channelName}`,
      channel,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || 'Failed to create channel',
    };
  }
}
