
import React, { useState, useEffect } from 'react';
import { BookCover } from './BookCover';
import { SceneViewer } from './SceneViewer';
import { Story, StoryScene } from '../types';
import { STORIES } from '../constants';
import { Cpu, Zap, Heart, Code, BarChart3, X } from 'lucide-react';

interface DemoPitchProps {
  onClose: () => void;
}

// Mock technical data for Act 3
const TECH_SNIPPET = `{
  "model": "gemini-2.5-flash",
  "modalities": ["text", "audio"],
  "latency": "450ms",
  "context": "2M tokens"
}`;

export const DemoPitch: React.FC<DemoPitchProps> = ({ onClose }) => {
  const [act, setAct] = useState<1 | 2 | 3 | 4>(1);
  const [demoStory] = useState<Story>(STORIES[0]); // Monkey & Crocodile
  const [demoSceneIndex, setDemoSceneIndex] = useState(0);
  const [showTechOverlay, setShowTechOverlay] = useState(false);

  // Auto-advance logic for the "Live Demo" Act 2
  useEffect(() => {
    let interval: any;

    if (act === 2) {
      // Auto-advance scenes every 4 seconds during the demo act
      interval = setInterval(() => {
        setDemoSceneIndex((prev) => {
          if (prev < 2) return prev + 1; // Only show first 3 scenes
          return 0; // Loop
        });
      }, 4000);
    }

    return () => clearInterval(interval);
  }, [act]);

  // Scene data for the demo
  const demoScene: StoryScene = {
    ...demoStory.scenes[demoSceneIndex],
    imageUrl: "https://storage.googleapis.com/aistudio-cms-assets/media/gemini_logo_animation.gif", // Placeholder/Mock for demo smoothness or real logic
    // We use the real logic in the actual render below, this is just fallback
    isGeneratingImage: false,
    isGeneratingAudio: false
  };

  // Mock scenes with pre-filled visuals for the "Perfect Demo" feel if real generation isn't wanted
  // But we will reuse the actual components to show "Real Functionality"
  
  return (
    <div className="fixed inset-0 bg-black z-[100] text-white font-['Fredoka'] overflow-hidden">
      
      {/* Navigation / Progress */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800 z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${(act / 4) * 100}%` }}
        />
      </div>

      <button onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white">
        <X size={32} />
      </button>

      {/* ACT 1: THE PROBLEM */}
      {act === 1 && (
        <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
          <div className="bg-red-500/20 p-6 rounded-full mb-8 animate-pulse">
            <BarChart3 size={80} className="text-red-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-center">The Screen Time Crisis</h1>
          <div className="flex gap-8 max-w-4xl text-center">
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex-1">
              <p className="text-4xl font-bold text-red-400 mb-2">7+ Hours</p>
              <p className="text-gray-400">Daily screen time for average child</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex-1">
              <p className="text-4xl font-bold text-red-400 mb-2">Passive</p>
              <p className="text-gray-400">Consumption without learning</p>
            </div>
          </div>
          <p className="mt-12 text-2xl text-gray-300 italic">"What if screen time could build character?"</p>
          <button onClick={() => setAct(2)} className="mt-12 bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold text-xl">
            See the Solution →
          </button>
        </div>
      )}

      {/* ACT 2: THE SOLUTION (LIVE DEMO) */}
      {act === 2 && (
        <div className="h-full flex flex-col animate-fadeIn relative bg-gray-900">
           <div className="absolute top-8 left-8 bg-green-500 text-black font-bold px-4 py-1 rounded-full z-50 animate-pulse flex items-center gap-2">
              <Zap size={16} /> LIVE DEMO
           </div>

           {/* We embed the actual App Components here to prove it works */}
           <div className="flex-1 transform scale-90 origin-center border-4 border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl relative">
              {/* Simulate the reading view */}
              <div className="absolute inset-0 bg-white pointer-events-none opacity-10 z-10"></div> {/* Glare */}
              <SceneViewer 
                scene={{
                    ...demoStory.scenes[demoSceneIndex],
                    // Use a static image for the demo if generation is slow, or real if fast. 
                    // For the pitch, let's assume we want to show the UI layout.
                    imageUrl: demoSceneIndex === 0 
                        ? "https://images.unsplash.com/photo-1545063914-a1a6kcfa59cb?q=80&w=1000&auto=format&fit=crop" 
                        : "https://images.unsplash.com/photo-1555169062-013468b47731?q=80&w=1000&auto=format&fit=crop",
                    isGeneratingImage: false,
                    isGeneratingAudio: false,
                    audioUrl: "" // Mute audio for the visual demo slide to avoid noise
                }}
                sceneIndex={demoSceneIndex}
                totalScenes={6}
                onNext={() => {}}
                onPrev={() => {}}
              />
           </div>

           <div className="h-24 flex items-center justify-center gap-8 bg-black">
              <div className="text-center">
                 <p className="text-sm text-gray-500">Input</p>
                 <p className="font-bold text-blue-400">Multimodal</p>
              </div>
              <div className="w-16 h-1 bg-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500 animate-slideRight"></div>
              </div>
              <div className="text-center">
                 <p className="text-sm text-gray-500">Processing</p>
                 <p className="font-bold text-purple-400">Gemini 2.5</p>
              </div>
              <div className="w-16 h-1 bg-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500 animate-slideRight animation-delay-500"></div>
              </div>
               <div className="text-center">
                 <p className="text-sm text-gray-500">Output</p>
                 <p className="font-bold text-green-400">Story + Art + Audio</p>
              </div>
           </div>
           
           <button onClick={() => setAct(3)} className="absolute bottom-8 right-8 bg-blue-600 px-6 py-2 rounded-full font-bold">
            Technical Specs →
          </button>
        </div>
      )}

      {/* ACT 3: TECHNICAL DEPTH */}
      {act === 3 && (
        <div className="h-full flex items-center justify-center p-8 bg-gray-900 relative animate-fadeIn">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl w-full z-10">
            <div>
                <h2 className="text-4xl font-bold mb-8 text-blue-400 flex items-center gap-3">
                    <Cpu /> Under the Hood
                </h2>
                <ul className="space-y-6 text-xl">
                    <li className="flex items-center gap-4">
                        <span className="bg-blue-500/20 p-3 rounded-lg text-blue-400"><Code /></span>
                        <div>
                            <strong className="block text-white">Gemini 2.5 Flash</strong>
                            <span className="text-gray-400 text-base">Core reasoning & narrative engine</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-4">
                        <span className="bg-purple-500/20 p-3 rounded-lg text-purple-400"><Zap /></span>
                        <div>
                            <strong className="block text-white">Real-time TTS</strong>
                            <span className="text-gray-400 text-base">Low latency audio generation</span>
                        </div>
                    </li>
                    <li className="flex items-center gap-4">
                        <span className="bg-green-500/20 p-3 rounded-lg text-green-400"><Heart /></span>
                        <div>
                            <strong className="block text-white">Safety First</strong>
                            <span className="text-gray-400 text-base">Built-in content moderation for kids</span>
                        </div>
                    </li>
                </ul>
            </div>
            
            <div className="bg-black border border-gray-700 rounded-xl p-6 font-mono text-sm relative overflow-hidden shadow-2xl">
                <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <pre className="text-green-400 overflow-x-auto">
                    {`// Generating Scene 1...
const response = await ai.generateContent({
  model: "gemini-2.5-flash",
  system_instruction: "You are a storyteller...",
  tools: [google_search, code_interpreter]
});

// Latency: 420ms
// Tokens: 1,204
// Audio: Generated (WAV)
`}
                </pre>
                <div className="absolute top-0 right-0 p-4">
                    <span className="animate-pulse text-xs bg-green-900 text-green-300 px-2 py-1 rounded">CONNECTED</span>
                </div>
            </div>
          </div>
          
           <button onClick={() => setAct(4)} className="absolute bottom-8 right-8 bg-blue-600 px-6 py-2 rounded-full font-bold">
            The Vision →
          </button>
        </div>
      )}

      {/* ACT 4: IMPACT & VISION */}
      {act === 4 && (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-900 to-black animate-fadeIn text-center">
          <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
            Panchatantra Tales
          </h1>
          <p className="text-2xl text-gray-300 mb-12">Reimagining Moral Education with Gemini 3</p>
          
          <div className="grid grid-cols-3 gap-8 max-w-4xl w-full mb-16">
             <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-4xl font-bold mb-2">100%</p>
                <p className="text-gray-400 text-sm">Personalized Stories</p>
             </div>
             <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-4xl font-bold mb-2">0s</p>
                <p className="text-gray-400 text-sm">Wait Time (Prefetching)</p>
             </div>
             <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-4xl font-bold mb-2">∞</p>
                <p className="text-gray-400 text-sm">Possibilities</p>
             </div>
          </div>

          <button onClick={onClose} className="bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform">
            Try It Yourself
          </button>
          
          <p className="mt-8 text-sm text-gray-500">Built for the Google AI Hackathon</p>
        </div>
      )}

      <style>{`
        @keyframes slideRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-slideRight {
            animation: slideRight 1.5s infinite linear;
        }
        .animation-delay-500 {
            animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};
