import React, { useState, useEffect, useCallback } from 'react';
import { generateStoryStructure, generateSceneImage } from './services/geminiService';
import { ORIGINAL_STORY } from './constants';
import { StoryScene, AppState } from './types';
import { BookCover } from './components/BookCover';
import { SceneViewer } from './components/SceneViewer';
import { ErrorDisplay } from './components/UI';
import { BookOpen, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('intro');
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startStory = async () => {
    setAppState('generating_text');
    setLoadingMessage('Making the story magic happen...');
    setError(null);

    try {
      const storyData = await generateStoryStructure(ORIGINAL_STORY);
      setScenes(storyData);
      setAppState('reading');
      setCurrentSceneIndex(0);
      
      // Trigger image generation for the first scene immediately
      triggerImageGeneration(storyData, 0);
    } catch (err) {
      console.error(err);
      setError("Oops! The magic storytelling machine needs a moment. Please check your API key and try again.");
      setAppState('error');
    }
  };

  const triggerImageGeneration = useCallback(async (currentScenes: StoryScene[], index: number) => {
    // Generate for current and next scene (prefetch)
    const indicesToLoad = [index, index + 1].filter(i => i < currentScenes.length);

    for (const idx of indicesToLoad) {
      if (!currentScenes[idx].imageUrl && !currentScenes[idx].isGeneratingImage) {
        // Mark as generating
        setScenes(prev => {
          const newScenes = [...prev];
          newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
          return newScenes;
        });

        try {
          const base64Image = await generateSceneImage(currentScenes[idx].imagePrompt);
          setScenes(prev => {
            const newScenes = [...prev];
            newScenes[idx] = { 
              ...newScenes[idx], 
              imageUrl: base64Image, 
              isGeneratingImage: false 
            };
            return newScenes;
          });
        } catch (e) {
          console.error(`Failed to generate image for scene ${idx}`, e);
          setScenes(prev => {
            const newScenes = [...prev];
            newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false }; // Retry allowed later
            return newScenes;
          });
        }
      }
    }
  }, []);

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      triggerImageGeneration(scenes, nextIndex);
    } else {
      setAppState('finished');
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const handleRestart = () => {
    setAppState('intro');
    setScenes([]);
    setCurrentSceneIndex(0);
  };

  // Intro Screen
  if (appState === 'intro') {
    return (
      <BookCover onStart={startStory} />
    );
  }

  // Loading Text Screen
  if (appState === 'generating_text') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
        <div className="animate-bounce mb-6 text-green-600">
          <BookOpen size={64} />
        </div>
        <h2 className="text-2xl font-bold text-green-800 mb-2 text-center animate-pulse">
          Writing your story...
        </h2>
        <p className="text-green-600 text-center max-w-md">
          {loadingMessage}
        </p>
        <div className="mt-8 flex gap-2">
            <Sparkles className="text-yellow-400 animate-spin" />
            <Sparkles className="text-purple-400 animate-pulse" />
            <Sparkles className="text-blue-400 animate-bounce" />
        </div>
      </div>
    );
  }

  // Error Screen
  if (appState === 'error') {
    return <ErrorDisplay message={error || 'Unknown error'} onRetry={() => setAppState('intro')} />;
  }

  // Reading Screen
  if (appState === 'reading') {
    return (
      <SceneViewer 
        scene={scenes[currentSceneIndex]} 
        sceneIndex={currentSceneIndex}
        totalScenes={scenes.length}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    );
  }

  // Finished Screen
  if (appState === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-600 mb-6">The End!</h1>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg mb-8">
            <p className="text-xl text-gray-700 mb-4 font-medium">
                Remember: True friends are honest and kind. It is always good to be smart like the Monkey!
            </p>
            <div className="flex justify-center mb-4">
               <span className="text-6xl">🐒 ❤️ 🐊</span>
            </div>
        </div>
        <button 
          onClick={handleRestart}
          className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          Read Again
        </button>
      </div>
    );
  }

  return null;
};

export default App;