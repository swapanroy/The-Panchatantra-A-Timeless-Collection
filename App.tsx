
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

  // Concurrency Control: Track active generations to prevent duplicates
  // Key format: `${storyId}-${sceneIndex}-${type}` (type: 'image' | 'audio')
  const activeGenerations = useRef<Set<string>>(new Set());
  const isMounted = useRef(true);

  // Load saved stories, hidden defaults, and admin status on mount
  useEffect(() => {
      isMounted.current = true;
      initAssetStorage().catch(console.error); // Init IndexedDB
      setSavedStories(getSavedStories());
      setHiddenStoryIds(getHiddenDefaultStories());
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
          setIsAdmin(true);
      }
      
      return () => { isMounted.current = false; };
  }, []);

  // --- CORE GENERATION LOGIC ---

  const triggerSceneAssets = useCallback(async (
    storyId: string,
    currentScenes: StoryScene[],
    index: number
  ) => {
    if (index >= currentScenes.length) return;

    // Helper to generate a specific asset type
    const generateAsset = async (type: 'image' | 'audio') => {
        const key = `${storyId}-${index}-${type}`;
        
        // 1. Sync check: Is this already running?
        if (activeGenerations.current.has(key)) return;

        // 2. Check Memory Cache (Fastest) - Avoids React state update if already valid
        // We check the passed `currentScenes` as a proxy for the latest state
        const scene = currentScenes[index];
        if (type === 'image' && scene.imageUrl) return;
        if (type === 'audio' && scene.audioUrl) return;

        // 3. Check Service Cache (Memory Cache utility)
        const cached = getCachedMedia(storyId, index);
        if (type === 'image' && cached?.imageUrl) {
             setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[index].imageUrl) {
                    newScenes[index] = { ...newScenes[index], imageUrl: cached.imageUrl, isGeneratingImage: false };
                }
                return newScenes;
            });
            return;
        }
        if (type === 'audio' && cached?.audioUrl) {
            setScenes(prev => {
                const newScenes = [...prev];
                if (!newScenes[index].audioUrl) {
                    newScenes[index] = { ...newScenes[index], audioUrl: cached.audioUrl, isGeneratingAudio: false };
                }
                return newScenes;
            });
            return;
        }

        // 4. Mark Active & Set Loading State
        activeGenerations.current.add(key);
        
        setScenes(prev => {
            const newScenes = [...prev];
            // Only update if we still need to load
            if (type === 'image' && !newScenes[index].imageUrl) {
                newScenes[index] = { ...newScenes[index], isGeneratingImage: true };
            } else if (type === 'audio' && !newScenes[index].audioUrl) {
                newScenes[index] = { ...newScenes[index], isGeneratingAudio: true };
            }
            return newScenes;
        });

        try {
            let resultUrl: string | null = null;
            const isClassic = !storyId.startsWith('custom-');

            if (type === 'image') {
                // This call internally checks IndexedDB first
                resultUrl = await generateSceneImage(currentScenes[index].imagePrompt, isClassic, storyId, index);
            } else {
                // This call internally checks IndexedDB first
                resultUrl = await generateSpeech(currentScenes[index].narrative, isClassic, storyId, index);
            }

            // 5. Update State & Cache
            if (isMounted.current && resultUrl) {
                setScenes(prev => {
                    const newScenes = [...prev];
                    if (type === 'image') {
                        newScenes[index] = { ...newScenes[index], imageUrl: resultUrl, isGeneratingImage: false };
                    } else {
                        newScenes[index] = { ...newScenes[index], audioUrl: resultUrl, isGeneratingAudio: false };
                    }
                    return newScenes;
                });
                
                // Update memory cache for instant session reuse
                saveCachedMedia(storyId, index, type === 'image' ? { imageUrl: resultUrl } : { audioUrl: resultUrl });
            }
        } catch (e) {
            console.error(`Failed to generate ${type} for scene ${index}`, e);
            if (isMounted.current) {
                setScenes(prev => {
                    const newScenes = [...prev];
                    if (type === 'image') {
                        newScenes[index] = { ...newScenes[index], isGeneratingImage: false };
                    } else {
                        newScenes[index] = { ...newScenes[index], isGeneratingAudio: false };
                    }
                    return newScenes;
                });
            }
        } finally {
            activeGenerations.current.delete(key);
        }
    };

    // Trigger both in parallel
    generateAsset('image');
    generateAsset('audio');
  }, []);


  const handleSelectStory = (story: Story) => {
    // Clear legacy timeouts if any (though we removed them, good practice to reset refs)
    activeGenerations.current.clear();

    setSelectedStory(story);
    setHasSavedCurrentStory(!!story.isCustom && savedStories.some(s => s.id === story.id));
    
    // Initialize scenes with potentially cached data from memory
    const initialScenes: StoryScene[] = story.scenes.map((s, index) => {
        const cached = getCachedMedia(story.id, index);
        return {
            narrative: s.narrative,
            imagePrompt: s.imagePrompt,
            imageUrl: cached?.imageUrl,
            audioUrl: cached?.audioUrl,
            isGeneratingImage: false,
            isGeneratingAudio: false
        };
    });
    
    setScenes(initialScenes);
    setAppState('intro');

    // --- AGGRESSIVE PARALLEL PREFETCHING ---
    // Immediately start the pipeline for the first 4 scenes.
    // The browser handles network queuing; we just want to ensure the requests are queued.
    [0, 1, 2, 3].forEach(idx => triggerSceneAssets(story.id, initialScenes, idx));
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
    
    // Reinforce loading for first scene in case it wasn't caught by prefetch
    triggerSceneAssets(selectedStory.id, scenes, 0);
    // Ensure scene 1 is also prioritized
    triggerSceneAssets(selectedStory.id, scenes, 1);
  };

  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1 && selectedStory) {
      const nextIndex = currentSceneIndex + 1;
      setCurrentSceneIndex(nextIndex);
      
      // --- LOOKAHEAD STRATEGY ---
      // 1. Ensure current (newly visible) scene is loaded
      triggerSceneAssets(selectedStory.id, scenes, nextIndex);

      // 2. Prefetch next 2 scenes
      triggerSceneAssets(selectedStory.id, scenes, nextIndex + 1);
      triggerSceneAssets(selectedStory.id, scenes, nextIndex + 2);

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
    activeGenerations.current.clear();
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
