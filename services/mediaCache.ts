
interface MediaCacheEntry {
  imageUrl?: string;
  audioUrl?: string;
}

// In-memory cache storage
// Key format: `${storyId}-${sceneIndex}`
const mediaCache: Record<string, MediaCacheEntry> = {};

const getKey = (storyId: string, sceneIndex: number) => `${storyId}-${sceneIndex}`;

export const getCachedMedia = (storyId: string, sceneIndex: number): MediaCacheEntry | undefined => {
  return mediaCache[getKey(storyId, sceneIndex)];
};

export const saveCachedMedia = (storyId: string, sceneIndex: number, data: Partial<MediaCacheEntry>) => {
  const key = getKey(storyId, sceneIndex);
  mediaCache[key] = {
    ...mediaCache[key],
    ...data
  };
};

export const clearCache = () => {
  for (const key in mediaCache) {
    delete mediaCache[key];
  }
};
