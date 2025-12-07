export interface StoryScene {
  narrative: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export type AppState = 'intro' | 'generating_text' | 'reading' | 'finished' | 'error';

export interface GeneratedStoryResponse {
  scenes: {
    narrative: string;
    image_prompt: string;
  }[];
}
