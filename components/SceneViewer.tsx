import React from 'react';
import { StoryScene } from '../types';
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';

interface SceneViewerProps {
  scene: StoryScene;
  sceneIndex: number;
  totalScenes: number;
  onNext: () => void;
  onPrev: () => void;
}

export const SceneViewer: React.FC<SceneViewerProps> = ({ scene, sceneIndex, totalScenes, onNext, onPrev }) => {
  const isFirst = sceneIndex === 0;
  const isLast = sceneIndex === totalScenes - 1;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Progress Bar */}
      <div className="w-full max-w-4xl mb-6 flex gap-2">
        {Array.from({ length: totalScenes }).map((_, idx) => (
          <div 
            key={idx} 
            className={`h-3 rounded-full flex-1 transition-all duration-300 ${idx <= sceneIndex ? 'bg-green-500' : 'bg-gray-200'}`} 
          />
        ))}
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[60vh] md:h-[70vh]">
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 relative flex items-center justify-center p-4">
            {scene.imageUrl ? (
                <img 
                    src={scene.imageUrl} 
                    alt="Scene Illustration" 
                    className="w-full h-full object-contain rounded-xl shadow-inner animate-fade-in"
                />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <Loader2 className="w-16 h-16 animate-spin mb-4 text-green-500" />
                    <p className="font-medium animate-pulse">Drawing the picture...</p>
                </div>
            )}
            
            {/* Prompt Debugger (Hidden in prod, useful for dev, but we'll hide it for aesthetics) */}
        </div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <div className="absolute top-6 right-6 text-green-200 font-black text-8xl opacity-20 select-none">
                {sceneIndex + 1}
            </div>
            
            <div className="space-y-6 relative z-10">
                <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-medium">
                    {scene.narrative}
                </p>
            </div>

            {/* Controls */}
            <div className="mt-12 flex justify-between items-center">
                <button 
                    onClick={onPrev}
                    disabled={isFirst}
                    className={`p-4 rounded-full transition-colors ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-100 hover:scale-110 active:scale-95 transform transition-transform'}`}
                >
                    <ChevronLeft size={40} strokeWidth={3} />
                </button>

                <button 
                    onClick={onNext}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center gap-2 transform transition-all hover:scale-105 active:scale-95"
                >
                    <span className="text-xl">{isLast ? 'Finish' : 'Next'}</span>
                    <ChevronRight size={24} strokeWidth={3} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};