import React, { useEffect, useRef } from 'react';
import { Play, ArrowLeft } from 'lucide-react';
import { Story } from '../types';

interface BookCoverProps {
  story: Story;
  onStart: () => void;
  onBack: () => void;
}

const themeColors: Record<string, { bg: string, accent: string, text: string, button: string, border: string, hexPrimary: string, hexSecondary: string }> = {
  green: { bg: 'bg-green-600', accent: 'bg-green-800', text: 'text-green-900', button: 'bg-yellow-400', border: 'border-green-800', hexPrimary: '#fef08a', hexSecondary: '#bfdbfe' }, // yellow-200, blue-200
  orange: { bg: 'bg-orange-500', accent: 'bg-orange-700', text: 'text-orange-900', button: 'bg-yellow-300', border: 'border-orange-700', hexPrimary: '#fed7aa', hexSecondary: '#fecaca' },
  blue: { bg: 'bg-blue-600', accent: 'bg-blue-800', text: 'text-blue-900', button: 'bg-orange-400', border: 'border-blue-800', hexPrimary: '#bae6fd', hexSecondary: '#c7d2fe' },
  teal: { bg: 'bg-teal-600', accent: 'bg-teal-800', text: 'text-teal-900', button: 'bg-pink-400', border: 'border-teal-800', hexPrimary: '#99f6e4', hexSecondary: '#fbcfe8' },
  purple: { bg: 'bg-purple-600', accent: 'bg-purple-800', text: 'text-purple-900', button: 'bg-yellow-400', border: 'border-purple-800', hexPrimary: '#e9d5ff', hexSecondary: '#fde68a' },
  red: { bg: 'bg-red-600', accent: 'bg-red-800', text: 'text-red-900', button: 'bg-yellow-400', border: 'border-red-800', hexPrimary: '#fecaca', hexSecondary: '#fde68a' },
};

export const BookCover: React.FC<BookCoverProps> = ({ story, onStart, onBack }) => {
  const theme = themeColors[story.color] || themeColors.green;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Optimized Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Optimization: Create context without alpha if possible for speed, 
    // though we need transparency here so we keep standard settings but optimize elsewhere.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Optimization: Cap pixel ratio at 2x to prevent excessive rendering on 4k/Retina screens
    const dpr = Math.min(window.devicePixelRatio, 2);

    // Simple particle system
    const blobs = [
      { x: 0, y: 0, vx: 0.3, vy: 0.2, r: 100, color: theme.hexPrimary },
      { x: 0, y: 0, vx: -0.2, vy: 0.3, r: 120, color: theme.hexSecondary },
      { x: 0, y: 0, vx: 0.1, vy: -0.1, r: 150, color: '#ffffff' }
    ];

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        
        // Optimization: Explicitly set dimensions based on capped DPR
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        ctx.scale(dpr, dpr);

        // Initialize positions if needed
        blobs[0].x = width * 0.8; blobs[0].y = height * 0.2;
        blobs[1].x = width * 0.2; blobs[1].y = height * 0.2;
        blobs[2].x = width * 0.5; blobs[2].y = height * 0.8;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      // Optimization: No complex clearRect logic needed for full redraw, but standard clear is good
      ctx.clearRect(0, 0, width, height);

      blobs.forEach(blob => {
        // Move
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce
        if (blob.x < -50 || blob.x > width + 50) blob.vx *= -1;
        if (blob.y < -50 || blob.y > height + 50) blob.vy *= -1;

        // Draw with Minimal Geometry (Radial Gradient instead of Blur Filter)
        // Using radial gradients is much more performant than context.filter = 'blur()'
        const g = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        g.addColorStop(0, `${blob.color}80`); // 50% opacity
        g.addColorStop(1, 'transparent');
        
        ctx.fillStyle = g;
        ctx.beginPath();
        // Optimization: Standard arc is efficient; avoid complex paths
        ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Optimization: RequestAnimationFrame for smooth 60fps
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Optimization: Proper resource disposal
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 font-['Fredoka']`}>
      <div className={`${theme.bg} rounded-r-3xl rounded-l-md p-2 max-w-2xl w-full book-shadow transform hover:rotate-1 transition-transform duration-500 relative`}>
        
        {/* Back Button */}
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
        >
            <ArrowLeft size={24} />
        </button>

        <div className={`bg-white rounded-r-2xl rounded-l-sm border-l-8 ${theme.border} p-8 md:p-12 flex flex-col items-center text-center h-full relative overflow-hidden min-h-[600px]`}>
            
            {/* OPTIMIZED CANVAS BACKGROUND */}
            <canvas 
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-70 mix-blend-multiply"
            />
            
            <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
                <h1 className={`text-4xl md:text-6xl font-black ${theme.text} mb-8 leading-tight tracking-tight relative`}>
                {story.title}
                </h1>
                
                <div className="bg-gray-100 p-8 rounded-full mb-10 shadow-inner relative">
                    <span className="text-7xl filter drop-shadow-md transform hover:scale-110 transition-transform block">
                        {story.icon}
                    </span>
                </div>

                <p className="text-lg text-gray-500 mb-10 max-w-md font-medium relative">
                  An interactive story generated just for you.
                </p>

                <button 
                onClick={onStart}
                className={`group relative ${theme.button} text-gray-900 text-2xl font-bold py-4 px-12 rounded-full shadow-[0_6px_0_rgba(0,0,0,0.1)] hover:shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-[0_0px_0_rgba(0,0,0,0.1)] active:translate-y-1 transition-all flex items-center gap-3 z-20`}
                >
                <Play className="fill-current" />
                Start Reading
                </button>
            </div>

            <div className="mt-auto pt-8 relative z-10">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
                Generated by {story.author}
              </p>
            </div>
        </div>
      </div>
    </div>
  );
};