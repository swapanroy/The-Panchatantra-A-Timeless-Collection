
import React, { useState, useCallback } from 'react';
import { generateSceneImage, generateSpeech } from './services/geminiService';
import { getCachedMedia, saveCachedMedia } from './services/mediaCache';
import { STORIES } from './constants';
import { StoryScene, AppState, Story } from './types';
import { BookCover } from './components/BookCover';
import { SceneViewer } from './components/SceneViewer';
import { Library } from './components/Library';
import { ErrorDisplay } from './components/UI';
import { Home, Lightbulb } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('library');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    
    // Initialize scenes with cached data if available
    const initialScenes: StoryScene[] = story.scenes.map((s, index) => {
        const cached = getCachedMedia(story.id, index);
        return {
            narrative: s.narrative,
            imagePrompt: s.imagePrompt,
            imageUrl: cached?.imageUrl, // Hydrate from cache
            audioUrl: cached?.audioUrl, // Hydrate from cache
            isGeneratingImage: false,
            isGeneratingAudio: false
        };
    });
    
    setScenes(initialScenes);
    setAppState('intro');

    // Trigger pre-fetching for the first few scenes immediately
    setTimeout(() => {
        triggerImageGeneration(story.id, initialScenes, 0);
        triggerAudioGeneration(story.id, initialScenes, 0);
    }, 0);
  };

  const startStory = async () => {
    if (!selectedStory) return;
    setAppState('reading');
    setCurrentSceneIndex(0);
  };

  const triggerImageGeneration = useCallback(async (
    storyId: string,
    currentScenes: StoryScene[], 
    index: number
  ) => {
    const indicesToLoad = [index, index + 1].filter(i => i < currentScenes.length);

    for (const idx of indicesToLoad) {
        // Check state AND cache to avoid duplicate work
        // If imageUrl is present (from cache hydration), we skip generation
        if (!currentScenes[idx].imageUrl && !currentScenes[idx].isGeneratingImage) {
            
            setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[idx].isGeneratingImage && !newScenes[idx].imageUrl) {
                   newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
                   return newScenes;
                }
                return prev;
            });

            try {
                const base64Image = await generateSceneImage(currentScenes[idx].imagePrompt);
                
                // Save to Cache
                saveCachedMedia(storyId, idx, { imageUrl: base64Image });

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
                    newScenes[idx] = { ...newScenes[idx], isGeneratingImage: false }; 
                    return newScenes;
                });
            }
        }
    }
  }, []);

  const triggerAudioGeneration = useCallback(async (
    storyId: string,
    currentScenes: StoryScene[], 
    index: number
  ) => {
    const indicesToLoad = [index, index + 1].filter(i => i < currentScenes.length);

    for (const idx of indicesToLoad) {
        // Check state AND cache
        if (!currentScenes[idx].audioUrl && !currentScenes[idx].isGeneratingAudio) {
            
            setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[idx].isGeneratingAudio && !newScenes[idx].audioUrl) {
                    newScenes[idx] = { ...newScenes[idx], isGeneratingAudio: true };
                    return newScenes;
                }
                return prev;
            });

            try {
                const textToSpeak = currentScenes[idx].narrative;
                const audioBlobUrl = await generateSpeech(textToSpeak);
                
                // Save to Cache
                saveCachedMedia(storyId, idx, { audioUrl: audioBlobUrl });

                setScenes(prev => {
                    const newScenes = [...prev];
                    newScenes[idx] = { 
                        ...newScenes[idx], 
                        audioUrl: audioBlobUrl, 
                        isGeneratingAudio: false 
                    };
                    return newScenes;
                });
            } catch (e) {
                console.error(`Failed to generate audio for scene ${idx}`, e);
                setScenes(prev => {
                    const newScenes = [...prev];
                    newScenes[idx] = { ...newScenes[idx], isGeneratingAudio: false };
                    return newScenes;
                });
            }
        }
    }
  }, []);

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1 && selectedStory) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      // Pass the story ID to the trigger functions
      triggerImageGeneration(selectedStory.id, scenes, nextIndex);
      triggerAudioGeneration(selectedStory.id, scenes, nextIndex);
    } else {
      setAppState('finished');
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
    }
  };

  const handleReturnToLibrary = () => {
    setAppState('library');
    setScenes([]);
    setCurrentSceneIndex(0);
    setSelectedStory(null);
  };

  // Library Screen
  if (appState === 'library') {
    return (
      <Library 
        stories={STORIES} 
        onSelectStory={handleSelectStory} 
      />
    );
  }

  // Intro Screen (Specific Book Cover)
  if (appState === 'intro' && selectedStory) {
    return (
      <BookCover 
        story={selectedStory}
        onStart={startStory} 
        onBack={() => setAppState('library')}
      />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 p-6 text-center font-['Fredoka']">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-600 mb-6">The End!</h1>
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg mb-8 w-full">
            <p className="text-xl text-gray-700 mb-4 font-medium">
                You just read <strong>{selectedStory?.title}</strong>.
            </p>
            <div className="flex justify-center mb-6">
               <span className="text-6xl">{selectedStory?.icon}</span>
            </div>
            
            {selectedStory?.lesson && (
              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6 text-left relative mt-4">
                  <div className="absolute -top-4 left-4 bg-blue-500 text-white p-2 rounded-full shadow-md">
                      <Lightbulb size={20} className="fill-current" />
                  </div>
                  <h3 className="text-blue-800 font-bold text-lg mb-2 mt-1 uppercase tracking-wide">Lesson Learned</h3>
                  <p className="text-blue-900 leading-relaxed font-medium">
                    {selectedStory.lesson}
                  </p>
              </div>
            )}
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={() => {
                if (selectedStory) {
                    // Reset to first scene but KEEP the cached media
                    setCurrentSceneIndex(0);
                    setAppState('reading'); 
                }
            }}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Read Again
          </button>
          <button 
            onClick={handleReturnToLibrary}
            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 text-lg font-bold py-3 px-6 rounded-full shadow-sm transition-transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Back to Library
          </button>
        </div>
        <p className="mt-8 text-yellow-700/60 font-bold text-sm tracking-wide">
            Generated by {selectedStory?.author || 'Swapan Roy'}
        </p>
      </div>
    );
  }

  return null;
};

export default App;
