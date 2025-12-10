
import React, { useState, useRef, useEffect } from 'react';
import { StoryScene } from '../types';
import { ChevronLeft, ChevronRight, Loader2, Play, Pause } from 'lucide-react';

interface SceneViewerProps {
  scene: StoryScene;
  sceneIndex: number;
  totalScenes: number;
  storyColor?: string;
  onNext: () => void;
  onPrev: () => void;
}

// Map story colors to nice gradients for the placeholder
const placeholderGradients: Record<string, string> = {
  green: 'from-green-100 to-green-50',
  orange: 'from-orange-100 to-orange-50',
  blue: 'from-blue-100 to-blue-50',
  teal: 'from-teal-100 to-teal-50',
  purple: 'from-purple-100 to-purple-50',
  red: 'from-red-100 to-red-50',
};

const placeholderAccents: Record<string, string> = {
  green: 'bg-green-200 text-green-600',
  orange: 'bg-orange-200 text-orange-600',
  blue: 'bg-blue-200 text-blue-600',
  teal: 'bg-teal-200 text-teal-600',
  purple: 'bg-purple-200 text-purple-600',
  red: 'bg-red-200 text-red-600',
};

export const SceneViewer: React.FC<SceneViewerProps> = ({ scene, sceneIndex, totalScenes, storyColor = 'green', onNext, onPrev }) => {
  const isFirst = sceneIndex === 0;
  const isLast = sceneIndex === totalScenes - 1;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle scene changes and Auto-Play logic
  useEffect(() => {
    // 1. Reset state
    setIsPlaying(false);
    
    // 2. Stop any existing playback
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = playbackSpeed;
    }

    // 3. Attempt Auto-Play if audio is available
    if (scene.audioUrl && audioRef.current) {
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(error => {
                    console.log("Autoplay prevented by browser:", error);
                    setIsPlaying(false);
                });
        }
    }
  }, [scene.audioUrl, sceneIndex]); // Re-run when scene changes or audio finishes loading

  // Handle speed changes independently
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const togglePlay = () => {
    if (!audioRef.current || (!scene.audioUrl && !scene.isGeneratingAudio)) return;

    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        audioRef.current.play();
        setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    const newSpeed = playbackSpeed === 1 ? 1.2 : playbackSpeed === 1.2 ? 0.8 : 1;
    setPlaybackSpeed(newSpeed);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Safe access for the image
  const hasImage = !!scene.imageUrl;
  const gradientClass = placeholderGradients[storyColor] || placeholderGradients.green;
  const accentClass = placeholderAccents[storyColor] || placeholderAccents.green;
  
  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 font-['Fredoka']">
      
      {/* Hidden Audio Element with Preload Auto for better performance */}
      {scene.audioUrl && (
          <audio 
            ref={audioRef} 
            src={scene.audioUrl} 
            preload="auto"
            onEnded={handleAudioEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-5xl mb-6 flex gap-3 px-2">
        {Array.from({ length: totalScenes }).map((_, idx) => (
          <div 
            key={idx} 
            className={`h-4 rounded-full flex-1 transition-all duration-500 shadow-sm ${
                idx <= sceneIndex 
                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                : 'bg-green-100'
            }`} 
          />
        ))}
      </div>

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[75vh] border-4 border-white">
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-50 relative flex items-center justify-center p-6 overflow-hidden min-h-[350px]">
            {hasImage ? (
                <img 
                    src={scene.imageUrl} 
                    alt={`Scene ${sceneIndex + 1}`} 
                    className="w-full h-full object-contain rounded-2xl shadow-lg transform transition-transform duration-700 hover:scale-105 animate-fadeIn"
                    loading="eager" // Important for rapid sequential viewing
                />
            ) : (
                /* Thematic Placeholder for Instant Load Perception */
                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gradientClass} animate-pulse flex flex-col items-center justify-center text-center p-8 border-4 border-white shadow-inner relative overflow-hidden`}>
                    
                    {/* Abstract Shapes for better aesthetic */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-5 rounded-full blur-2xl transform -translate-x-10 translate-y-10"></div>

                    <div className={`relative z-10 w-24 h-24 rounded-full ${accentClass} bg-opacity-20 flex items-center justify-center mb-6 backdrop-blur-sm`}>
                        <Loader2 className="w-10 h-10 animate-spin opacity-60" />
                    </div>
                    <h3 className={`relative z-10 text-2xl font-black opacity-50 uppercase tracking-widest ${storyColor === 'orange' || storyColor === 'green' ? 'text-gray-700' : 'text-white'}`}>
                        Creating Magic...
                    </h3>
                </div>
            )}
        </div>

        {/* Text & Controls Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white">
            
            {/* Page Number - Static position to avoid overlap */}
            <div className="flex justify-end mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl shadow-sm">
                    {sceneIndex + 1}
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                {/* Narrative Text */}
                <div className="prose prose-xl max-w-none mb-8">
                    <p className="text-gray-800 leading-relaxed font-medium tracking-wide">
                        {scene.narrative}
                    </p>
                </div>

                {/* Audio Player Card - Simplified */}
                <div className="mt-auto bg-orange-50 rounded-2xl p-3 flex items-center gap-4 border border-orange-100">
                    <button
                        onClick={togglePlay}
                        disabled={!scene.audioUrl && !scene.isGeneratingAudio}
                        className={`
                            relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95
                            ${!scene.audioUrl && !scene.isGeneratingAudio 
                                ? 'bg-gray-200 cursor-not-allowed' 
                                : 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 ring-2 ring-yellow-200'
                            }
                        `}
                        title={isPlaying ? "Pause" : "Play"}
                    >
                        {scene.isGeneratingAudio ? (
                            <Loader2 className="animate-spin w-6 h-6" />
                        ) : isPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                        ) : (
                            <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                    </button>

                    {/* Simple Progress Indicator */}
                    <div className="flex-1 h-3 bg-orange-200 rounded-full overflow-hidden relative">
                         <div className={`h-full bg-orange-500 rounded-full transition-all duration-300 ${isPlaying ? 'w-full opacity-100' : 'w-0 opacity-50'}`}></div>
                    </div>

                    <button
                        onClick={toggleSpeed}
                        className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-white border border-orange-200 text-orange-600 font-bold text-xs hover:bg-orange-100 transition-colors"
                        title="Change Speed"
                    >
                        {playbackSpeed}x
                    </button>
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center pt-4 border-t border-gray-100">
                <button 
                    onClick={onPrev}
                    disabled={isFirst}
                    className={`
                        group flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all
                        ${isFirst 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-500 hover:bg-gray-100 hover:text-green-600'
                        }
                    `}
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <button 
                    onClick={onNext}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg shadow-green-200 transform transition-all hover:scale-105 active:scale-95 hover:shadow-xl"
                >
                    <span>{isLast ? 'Finish' : 'Next'}</span>
                    <ChevronRight size={20} strokeWidth={3} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
