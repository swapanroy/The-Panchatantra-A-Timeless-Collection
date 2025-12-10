
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { logTransaction } from "./auditService";
import { getStoredAsset, storeAsset } from "./assetStorage";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Utilities ---

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000, // Reduced from 2000ms for snappier retries
  operationName = "API Call"
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("RESOURCE_EXHAUSTED");

    if (retries > 0 && isRateLimit) {
      console.warn(
        `[${operationName}] Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`
      );
      await wait(delay);
      return retryWithBackoff(operation, retries - 1, delay * 2, operationName);
    }
    throw error;
  }
};

// --- API Functions ---

export const generateSceneImage = async (
  prompt: string,
  isClassic: boolean = false,
  storyId?: string,
  sceneIndex?: number
): Promise<string> => {
    // 1. Check persistent asset storage first for ALL stories (Universal Cache)
    if (storyId && sceneIndex !== undefined) {
        const storedImage = await getStoredAsset(storyId, sceneIndex, 'image');
        if (storedImage) {
            console.log(`[AssetStorage] Hit for Image: ${storyId}-${sceneIndex}`);
            return storedImage;
        }
    }

  return retryWithBackoff(
    async () => {
      const ai = getClient();
      
      // Optimized style modifiers: Removed "4k resolution" for faster generation, keeping high stylistic quality
      const styledPrompt = `${prompt}, bright and colorful 3d animation style, disney pixar style, expressive characters, soft cinematic lighting, high contrast, masterpiece`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: styledPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      // Log Audit
      logTransaction(
        "Image",
        `Scene Illustration: ${prompt.substring(0, 30)}...`,
        response.usageMetadata
      );

      // Iterate to find the image part
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            
            // Save to persistent storage for ALL stories (Universal Cache)
            if (storyId && sceneIndex !== undefined) {
                storeAsset(storyId, sceneIndex, 'image', base64Image).catch(console.error);
            }
            
            return base64Image;
          }
        }
      }

      throw new Error("No image data found in response");
    },
    3,
    1000, // Faster initial retry
    "generateSceneImage"
  );
};

export const generateSpeech = async (
  text: string,
  isClassic: boolean = false,
  storyId?: string,
  sceneIndex?: number
): Promise<string> => {
    // 1. Check persistent asset storage first
    if (storyId && sceneIndex !== undefined) {
        const storedAudio = await getStoredAsset(storyId, sceneIndex, 'audio');
        if (storedAudio) {
            console.log(`[AssetStorage] Hit for Audio: ${storyId}-${sceneIndex}`);
            return storedAudio;
        }
    }

  return retryWithBackoff(
    async () => {
      const ai = getClient();

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: text }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      // Log Audit
      logTransaction(
        "Audio",
        `Narration: ${text.substring(0, 30)}...`,
        response.usageMetadata
      );

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("No audio generated");
      }

      // Convert Base64 PCM to WAV Blob URL
      const audioBlob = base64PCMToWavBlob(base64Audio);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Save to persistent storage for ALL stories
      if (storyId && sceneIndex !== undefined) {
          const reader = new FileReader();
          reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                  storeAsset(storyId, sceneIndex, 'audio', reader.result).catch(console.error);
              }
          };
          reader.readAsDataURL(audioBlob);
      }

      return audioUrl;
    },
    3,
    1000, // Faster initial retry
    "generateSpeech"
  );
};

export const generateCustomStory = async (
  mainChar: string,
  secondChar: string,
  setting: string
): Promise<any> => {
  return retryWithBackoff(
    async () => {
      const ai = getClient();

      // Optimize prompt for concise narration (1 sentence max) to speed up TTS generation
      const prompt = `Write a short children's story (Panchatantra style) about a ${mainChar} and a ${secondChar} in ${setting}. 
    It must have a moral lesson suitable for 5-7 year olds.
    Structure it into exactly 5 scenes.
    Provide a creative title, a short lesson, and for each scene provide:
    1. narrative: simple English, 1 short and exciting sentence max.
    2. imagePrompt: visually descriptive, specifying character emotions, cute 3d animation style, consistent appearance.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              lesson: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    narrative: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      // Log Audit
      logTransaction(
        "Story",
        `New Story: ${mainChar} & ${secondChar}`,
        response.usageMetadata
      );

      if (response.text) {
        return JSON.parse(response.text);
      }
      throw new Error("Failed to generate story structure");
    },
    2,
    2000,
    "generateCustomStory"
  );
};

// --- Audio Utilities ---

// Helper to convert Base64 raw PCM to a WAV Blob
const base64PCMToWavBlob = (
  base64PCM: string,
  sampleRate: number = 24000
): Blob => {
  const binaryString = atob(base64PCM);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return pcmToWav(bytes, sampleRate);
};

// Add WAV header to raw PCM data
const pcmToWav = (pcmData: Uint8Array, sampleRate: number): Blob => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);

  return new Blob([buffer], { type: "audio/wav" });
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};
