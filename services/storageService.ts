
import { Story } from '../types';

const STORAGE_KEY = 'panchatantra_saved_stories';
const HIDDEN_DEFAULTS_KEY = 'panchatantra_hidden_defaults';
export const MAX_FREE_STORIES = 4;

export const getSavedStories = (): Story[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load stories", error);
    return [];
  }
};

export const saveStoryToStorage = (story: Story): boolean => {
  const current = getSavedStories();
  
  // Check if story is already saved (update case)
  const existingIndex = current.findIndex(s => s.id === story.id);
  
  if (existingIndex === -1 && current.length >= MAX_FREE_STORIES) {
    return false; // Limit reached
  }

  // Optimize: Don't save generated media URLs to avoid localStorage limits
  // We only save the structure; media will re-generate or load from session cache
  const cleanStory: Story = {
    ...story,
    isCustom: true,
    scenes: story.scenes.map(s => ({
      narrative: s.narrative,
      imagePrompt: s.imagePrompt
    }))
  };

  if (existingIndex >= 0) {
    current[existingIndex] = cleanStory;
  } else {
    current.push(cleanStory);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch (e) {
    console.error("Storage quota exceeded", e);
    return false;
  }
};

export const deleteStoryFromStorage = (id: string): Story[] => {
    const current = getSavedStories();
    const updated = current.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};

export const saveAllStories = (stories: Story[]) => {
    try {
       const cleanStories = stories.map(s => ({
          ...s,
          isCustom: true,
          scenes: s.scenes.map(scene => ({
              narrative: scene.narrative,
              imagePrompt: scene.imagePrompt
          }))
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanStories));
    } catch (e) {
      console.error("Failed to save order", e);
    }
};

export const getHiddenDefaultStories = (): string[] => {
  try {
    const data = localStorage.getItem(HIDDEN_DEFAULTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

export const hideDefaultStory = (id: string) => {
  const current = getHiddenDefaultStories();
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(current));
  }
};
