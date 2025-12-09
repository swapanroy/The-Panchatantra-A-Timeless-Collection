
import React, { useState, useCallback, useEffect } from 'react';
import { generateSceneImage, generateSpeech, generateCustomStory } from './services/geminiService';
import { getCachedMedia, saveCachedMedia } from './services/mediaCache';
import { getSavedStories, saveStoryToStorage, deleteStoryFromStorage, saveAllStories, getHiddenDefaultStories, hideDefaultStory } from './services/storageService';
import { STORIES } from './constants';
import { StoryScene, AppState, Story } from './types';
import { BookCover } from './components/BookCover';
import { SceneViewer } from './components/SceneViewer';
import { Library } from './components/Library';
import { CreateStoryModal } from './components/CreateStoryModal';
import { UpgradeModal } from './components/UpgradeModal';
import { AuditModal } from './components/AuditModal';
import { ErrorDisplay } from './components/UI';
import { Home, Lightbulb, Save, Check } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('library');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Custom Story & Storage State
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [hiddenStoryIds, setHiddenStoryIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [hasSavedCurrentStory, setHasSavedCurrentStory] = useState(false);

  // Load saved stories and hidden defaults on mount
  useEffect(() => {
      setSavedStories(getSavedStories());
      setHiddenStoryIds(getHiddenDefaultStories());
  }, []);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setHasSavedCurrentStory(!!story.isCustom && savedStories.some(s => s.id === story.id));
    
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

  const handleCreateStory = async (mainChar: string, secondChar: string, setting: string) => {
      setIsGeneratingStory(true);
      try {
          const generatedData = await generateCustomStory(mainChar, secondChar, setting);
          
          const newStory: Story = {
              id: `custom-${Date.now()}`,
              title: generatedData.title,
              icon: '✨',
              color: 'purple',
              author: 'You & AI',
              lesson: generatedData.lesson,
              isCustom: true,
              scenes: generatedData.scenes
          };

          setIsGeneratingStory(false);
          setIsCreateModalOpen(false);
          handleSelectStory(newStory);

      } catch (err) {
          console.error("Failed to create story", err);
          setIsGeneratingStory(false);
          // Optional: Show error toast
      }
  };

  const handleSaveCurrentStory = () => {
      if (!selectedStory) return;
      
      const success = saveStoryToStorage(selectedStory);
      if (success) {
          setSavedStories(getSavedStories());
          setHasSavedCurrentStory(true);
      } else {
          setIsUpgradeModalOpen(true);
      }
  };

  const handleDeleteStory = (id: string) => {
      const isCustom = savedStories.some(s => s.id === id);
      if (isCustom) {
          const updated = deleteStoryFromStorage(id);
          setSavedStories(updated);
      } else {
          hideDefaultStory(id);
          setHiddenStoryIds(prev => [...prev, id]);
      }
  };

  const handleReorderStories = (newOrder: Story[]) => {
      setSavedStories(newOrder);
      saveAllStories(newOrder);
  };

  const startStory = async () => {
    if (!selectedStory) return;
    setAppState('reading');
    setCurrentSceneIndex(0);
  };

  const triggerImageGeneration = useCallback(async (
    storyId: string,
    currentScenes: StoryScene[], 
    startIndex: number
  ) => {
    const indicesToLoad = [startIndex, startIndex + 1].filter(i => i < currentScenes.length);

    // Stagger requests to avoid 429 Rate Limits
    const loadSceneImage = async (idx: number) => {
        const scene = currentScenes[idx];
        
        // Skip if already has image or is currently generating
        // Note: we re-check 'isGeneratingImage' from state in case another trigger started it
        setScenes(prev => {
            if (prev[idx].imageUrl || prev[idx].isGeneratingImage) return prev;
            return prev; // Just for check
        });

        // Check cache
        const cached = getCachedMedia(storyId, idx);
        if (cached?.imageUrl) {
            setScenes(prev => {
                const newScenes = [...prev];
                newScenes[idx] = { ...newScenes[idx], imageUrl: cached.imageUrl };
                return newScenes;
            });
            return;
        }

        // Check if already started (double check against recent state update)
        let shouldStart = false;
        setScenes(prev => {
             if (!prev[idx].imageUrl && !prev[idx].isGeneratingImage) {
                 shouldStart = true;
                 const newScenes = [...prev];
                 newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
                 return newScenes;
             }
             return prev;
        });

        if (!shouldStart) return;

        try {
            const base64Image = await generateSceneImage(scene.imagePrompt);
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
    };

    // Load current scene immediately
    await loadSceneImage(startIndex);

    // Load next scene with a delay to respect rate limits
    if (indicesToLoad.length > 1) {
        setTimeout(() => {
            loadSceneImage(indicesToLoad[1]);
        }, 2500); // 2.5s delay
    }
  }, []);

  const triggerAudioGeneration = useCallback(async (
    storyId: string,
    currentScenes: StoryScene[], 
    startIndex: number
  ) => {
    const indicesToLoad = [startIndex, startIndex + 1].filter(i => i < currentScenes.length);

    const loadSceneAudio = async (idx: number) => {
        const scene = currentScenes[idx];

        // Check cache
        const cached = getCachedMedia(storyId, idx);
        if (cached?.audioUrl) {
             setScenes(prev => {
                const newScenes = [...prev];
                newScenes[idx] = { ...newScenes[idx], audioUrl: cached.audioUrl };
                return newScenes;
            });
            return;
        }

        let shouldStart = false;
        setScenes(prev => {
             if (!prev[idx].audioUrl && !prev[idx].isGeneratingAudio) {
                 shouldStart = true;
                 const newScenes = [...prev];
                 newScenes[idx] = { ...newScenes[idx], isGeneratingAudio: true };
                 return newScenes;
             }
             return prev;
        });

        if (!shouldStart) return;

        try {
            const textToSpeak = scene.narrative;
            const audioBlobUrl = await generateSpeech(textToSpeak);
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
    };

    // Load current immediately
    await loadSceneAudio(startIndex);

    // Load next with delay
    if (indicesToLoad.length > 1) {
        setTimeout(() => {
            loadSceneAudio(indicesToLoad[1]);
        }, 2500); // 2.5s delay
    }
  }, []);

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1 && selectedStory) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
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

  // Filter out hidden default stories
  const visibleDefaultStories = STORIES.filter(s => !hiddenStoryIds.includes(s.id));

  return (
    <>
        {appState === 'library' && (
            <>
                <Library 
                    savedStories={savedStories}
                    defaultStories={visibleDefaultStories} 
                    onSelectStory={handleSelectStory} 
                    onCreateStory={() => setIsCreateModalOpen(true)}
                    onDeleteStory={handleDeleteStory}
                    onReorderStories={handleReorderStories}
                    onOpenAudit={() => setIsAuditModalOpen(true)}
                />
                <CreateStoryModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSubmit={handleCreateStory}
                    isLoading={isGeneratingStory}
                />
                <AuditModal 
                    isOpen={isAuditModalOpen}
                    onClose={() => setIsAuditModalOpen(false)}
                />
            </>
        )}

        {appState === 'intro' && selectedStory && (
            <BookCover 
                story={selectedStory}
                onStart={startStory} 
                onBack={() => setAppState('library')}
            />
        )}

        {appState === 'error' && (
            <ErrorDisplay message={error || 'Unknown error'} onRetry={() => setAppState('intro')} />
        )}

        {appState === 'reading' && (
            <SceneViewer 
                scene={scenes[currentSceneIndex]} 
                sceneIndex={currentSceneIndex}
                totalScenes={scenes.length}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        )}

        {appState === 'finished' && (
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
                    
                    {selectedStory?.isCustom && !hasSavedCurrentStory && (
                        <button 
                            onClick={handleSaveCurrentStory}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            Save to Library
                        </button>
                    )}
                    
                    {selectedStory?.isCustom && hasSavedCurrentStory && (
                        <div className="bg-green-100 text-green-700 text-lg font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2">
                            <Check size={20} />
                            Saved to Library
                        </div>
                    )}

                    <button 
                        onClick={() => {
                            if (selectedStory) {
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
                
                <UpgradeModal 
                    isOpen={isUpgradeModalOpen} 
                    onClose={() => setIsUpgradeModalOpen(false)} 
                />
            </div>
        )}
    </>
  );
};

export default App;
