import { GoogleGenAI, Type } from "@google/genai";
import { StoryScene, GeneratedStoryResponse } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStoryStructure = async (originalText: string): Promise<StoryScene[]> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are an expert children's book author. 
    Your task is to take a story and adapt it for children aged 5-7.
    1. Break the story into 5-7 distinct scenes.
    2. Rewrite the text for each scene to be simple, engaging, and easy to read (max 2-3 short sentences per scene).
    3. Create a detailed image prompt for each scene for a "cute, colorful, 3D animated movie style, soft lighting, pixar-esque" illustration.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Adapt this story: ${originalText}`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                narrative: {
                  type: Type.STRING,
                  description: "The simplified story text for this page."
                },
                image_prompt: {
                  type: Type.STRING,
                  description: "The prompt to generate the illustration."
                }
              },
              required: ["narrative", "image_prompt"]
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate story structure");
  }

  const data = JSON.parse(response.text) as GeneratedStoryResponse;
  
  return data.scenes.map(scene => ({
    narrative: scene.narrative,
    imagePrompt: scene.image_prompt,
    isGeneratingImage: false
  }));
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image for generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Or gemini-3-pro-image-preview for higher quality if available
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1", // Square for storybook feel
      }
    }
  });

  // Iterate to find the image part
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated");
};