import type { Message } from 'src/services/models';

const CACHE_PREFIX = 'channel_messages_';
const MAX_CACHED_MESSAGES = 100;

interface CachedChannelData {
  messages: Message[];
  lastUpdated: number;
}

export function cacheChannelMessages(channelId: string, messages: Message[]): void {
  try {
    const messagesToCache = messages.slice(-MAX_CACHED_MESSAGES);

    const cacheData: CachedChannelData = {
      messages: messagesToCache,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(`${CACHE_PREFIX}${channelId}`, JSON.stringify(cacheData));
    console.log(`Cached ${messagesToCache.length} messages for channel ${channelId}`);
  } catch (error) {
    console.error('Failed to cache messages:', error);
  }
}

export function loadCachedMessages(channelId: string): Message[] | null {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${channelId}`);
    if (!cached) return null;

    const cacheData: CachedChannelData = JSON.parse(cached);

    // Optional: Check if cache is too old (e.g., older than 7 days)
    const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;
    const cacheAge = Date.now() - cacheData.lastUpdated;

    if (cacheAge > MAX_CACHE_AGE) {
      console.log(`Cache for channel ${channelId} is too old, removing it`);
      clearChannelCache(channelId);
      return null;
    }

    console.log(`Loaded ${cacheData.messages.length} cached messages for channel ${channelId}`);
    return cacheData.messages;
  } catch (error) {
    console.error('Failed to load cached messages:', error);
    return null;
  }
}

export function clearChannelCache(channelId: string): void {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${channelId}`);
    console.log(`Cleared cache for channel ${channelId}`);
  } catch (error) {
    console.error('Failed to clear channel cache:', error);
  }
}

export function clearAllMessageCaches(): void {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    cacheKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log(`Cleared ${cacheKeys.length} channel caches`);
  } catch (error) {
    console.error('Failed to clear all caches:', error);
  }
}

export function getCacheInfo(): {
  channelId: string;
  messageCount: number;
  lastUpdated: Date;
}[] {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    return cacheKeys.map((key) => {
      const channelId = key.replace(CACHE_PREFIX, '');
      const cached = localStorage.getItem(key);
      if (!cached) return { channelId, messageCount: 0, lastUpdated: new Date(0) };

      const cacheData: CachedChannelData = JSON.parse(cached);
      return {
        channelId,
        messageCount: cacheData.messages.length,
        lastUpdated: new Date(cacheData.lastUpdated),
      };
    });
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return [];
  }
}
