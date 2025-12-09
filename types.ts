
export interface Story {
  id: string;
  title: string;
  icon: string;
  color: string; // Tailwind color name (e.g., 'green', 'blue')
  author: string;
  lesson: string;
  isCustom?: boolean;
  scenes: {
    narrative: string;
    imagePrompt: string;
  }[];
}

export interface StoryScene {
  narrative: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  audioUrl?: string;
  isGeneratingAudio?: boolean;
}

export type AppState = 'library' | 'intro' | 'generating_text' | 'reading' | 'finished' | 'error';

export interface GeneratedStoryResponse {
  title: string;
  lesson: string;
  scenes: {
    narrative: string;
    imagePrompt: string;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: number;
  type: 'Story' | 'Image' | 'Audio';
  detail: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}
