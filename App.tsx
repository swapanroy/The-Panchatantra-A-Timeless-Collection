
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateSceneImage, generateSpeech, generateCustomStory } from './services/geminiService';
import { getCachedMedia, saveCachedMedia } from './services/mediaCache';
import { getSavedStories, saveStoryToStorage, deleteStoryFromStorage, saveAllStories, getHiddenDefaultStories, hideDefaultStory } from './services/storageService';
import { STORIES } from './constants';
import { StoryScene, AppState, Story } from './types';
import { BookCover } from './components/BookCover';
import { SceneViewer } from './components/SceneViewer';
import { Library } from './components/Library';
import { ErrorDisplay } from './components/UI';
import { Home, Lightbulb, Save, Check } from 'lucide-react';
import { initAssetStorage } from './services/assetStorage';

// Lazy load modals for faster initial bundle load
const CreateStoryModal = React.lazy(() => import('./components/CreateStoryModal').then(module => ({ default: module.CreateStoryModal })));
const UpgradeModal = React.lazy(() => import('./components/UpgradeModal').then(module => ({ default: module.UpgradeModal })));
const AuditModal = React.lazy(() => import('./components/AuditModal').then(module => ({ default: module.AuditModal })));

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

  // Admin Mode
  const [isAdmin, setIsAdmin] = useState(false);

  // Request Management
  const timeoutsRef = useRef<number[]>([]);

  const clearAllTimeouts = () => {
      timeoutsRef.current.forEach(window.clearTimeout);
      timeoutsRef.current = [];
  };

  // Load saved stories, hidden defaults, and admin status on mount
  useEffect(() => {
      initAssetStorage().catch(console.error); // Init IndexedDB
      setSavedStories(getSavedStories());
      setHiddenStoryIds(getHiddenDefaultStories());
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
          setIsAdmin(true);
      }
      
      // Cleanup on unmount
      return () => clearAllTimeouts();
  }, []);

  const handleSelectStory = (story: Story) => {
    // Clear any pending requests from previous interactions
    clearAllTimeouts();

    setSelectedStory(story);
    setHasSavedCurrentStory(!!story.isCustom && savedStories.some(s => s.id === story.id));
    
    // Initialize scenes with cached data if available (Instant Load)
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

    // --- BANDWIDTH-AWARE SCHEDULING ---
    // Prioritize Audio (fastest/smallest) then Image (heaviest)
    
    // 1. Scene 0 Audio: IMMEDIATE (0ms) - Ensures "Read Aloud" works instantly
    triggerAudioGeneration(story.id, initialScenes, 0);

    // 2. Scene 0 Image: FAST (100ms) - Tiny delay allows audio request to establish priority
    const t0 = window.setTimeout(() => {
        triggerImageGeneration(story.id, initialScenes, 0);
    }, 100);

    // 3. Scene 1 Audio: AGGRESSIVE PREFETCH (500ms) - Audio is small, get it ready for next page ASAP
    const t1 = window.setTimeout(() => {
        triggerAudioGeneration(story.id, initialScenes, 1);
    }, 500);

    // 4. Scene 1 Image: DELAYED (3500ms) - Heavy load, wait until Scene 0 assets are likely safely buffering
    const t2 = window.setTimeout(() => {
        triggerImageGeneration(story.id, initialScenes, 1);
    }, 3500);
    
    timeoutsRef.current.push(t0, t1, t2);
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
          setError("Couldn't create story. Please try again!");
          setAppState('error');
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

  const triggerImageGeneration = useCallback((
    storyId: string,
    currentScenes: StoryScene[], 
    startIndex: number
  ) => {
    // Only process valid index
    if (startIndex >= currentScenes.length) return;

    const loadSceneImage = async (idx: number) => {
        // Synchronous check: Do we already have it or is it working?
        let needsLoading = false;
        
        // 1. Check Cache
        const cached = getCachedMedia(storyId, idx);
        if (cached?.imageUrl) {
             setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[idx].imageUrl) {
                    newScenes[idx] = { ...newScenes[idx], imageUrl: cached.imageUrl };
                }
                return newScenes;
            });
            return;
        }

        // 2. Check State & Mark as Generating
        setScenes(prev => {
             if (!prev[idx].imageUrl && !prev[idx].isGeneratingImage) {
                 needsLoading = true;
                 const newScenes = [...prev];
                 newScenes[idx] = { ...newScenes[idx], isGeneratingImage: true };
                 return newScenes;
             }
             return prev;
        });

        if (!needsLoading) return;

        try {
            const isClassic = !storyId.startsWith('custom-');
            const base64Image = await generateSceneImage(currentScenes[idx].imagePrompt, isClassic, storyId, idx);
            
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

    loadSceneImage(startIndex);
  }, []);

  const triggerAudioGeneration = useCallback((
    storyId: string,
    currentScenes: StoryScene[], 
    startIndex: number
  ) => {
    if (startIndex >= currentScenes.length) return;

    const loadSceneAudio = async (idx: number) => {
        let needsLoading = false;

        // 1. Check Cache
        const cached = getCachedMedia(storyId, idx);
        if (cached?.audioUrl) {
             setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[idx].audioUrl) {
                     newScenes[idx] = { ...newScenes[idx], audioUrl: cached.audioUrl };
                }
                return newScenes;
            });
            return;
        }

        // 2. Check State
        setScenes(prev => {
             if (!prev[idx].audioUrl && !prev[idx].isGeneratingAudio) {
                 needsLoading = true;
                 const newScenes = [...prev];
                 newScenes[idx] = { ...newScenes[idx], isGeneratingAudio: true };
                 return newScenes;
             }
             return prev;
        });

        if (!needsLoading) return;

        try {
            const isClassic = !storyId.startsWith('custom-');
            const textToSpeak = currentScenes[idx].narrative;
            const audioBlobUrl = await generateSpeech(textToSpeak, isClassic, storyId, idx);
            
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

    loadSceneAudio(startIndex);
  }, []);

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1 && selectedStory) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      
      // Lookahead: Trigger loading for index + 1 (the one after the new current)
      // We run these parallel now as the heavy initial load is likely done
      triggerImageGeneration(selectedStory.id, scenes, nextIndex + 1);
      triggerAudioGeneration(selectedStory.id, scenes, nextIndex + 1);
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
    clearAllTimeouts(); // Stop all background loading
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
            <Library 
                savedStories={savedStories}
                defaultStories={visibleDefaultStories} 
                onSelectStory={handleSelectStory} 
                onCreateStory={() => setIsCreateModalOpen(true)}
                onDeleteStory={handleDeleteStory}
                onReorderStories={handleReorderStories}
                onOpenAudit={() => setIsAuditModalOpen(true)}
                isAdmin={isAdmin}
            />
        )}

        <React.Suspense fallback={null}>
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
            <UpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
            />
        </React.Suspense>

        {appState === 'intro' && selectedStory && (
            <BookCover 
                story={selectedStory}
                onStart={startStory} 
                onBack={handleReturnToLibrary}
            />
        )}

        {appState === 'error' && (
            <ErrorDisplay message={error || 'Unknown error'} onRetry={handleReturnToLibrary} />
        )}

        {appState === 'reading' && selectedStory && (
            <SceneViewer 
                scene={scenes[currentSceneIndex]} 
                sceneIndex={currentSceneIndex}
                totalScenes={scenes.length}
                storyColor={selectedStory.color}
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
            </div>
        )}
    </>
  );
};

export default App;
