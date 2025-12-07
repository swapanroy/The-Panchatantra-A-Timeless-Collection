import React from 'react';
import { Play } from 'lucide-react';

interface BookCoverProps {
  onStart: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center p-4">
      <div className="bg-green-600 rounded-r-3xl rounded-l-md p-2 max-w-2xl w-full book-shadow transform hover:rotate-1 transition-transform duration-500">
        <div className="bg-white rounded-r-2xl rounded-l-sm border-l-8 border-green-800 p-8 md:p-12 flex flex-col items-center text-center h-full relative overflow-hidden">
            
            {/* Decorational Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            
            <h1 className="text-4xl md:text-6xl font-black text-green-900 mb-2 relative z-10 tracking-tight">
              The Monkey
            </h1>
            <span className="text-2xl font-bold text-green-600 mb-2 relative z-10">&</span>
            <h1 className="text-4xl md:text-6xl font-black text-green-900 mb-8 relative z-10 tracking-tight">
              The Crocodile
            </h1>
            
            <div className="bg-green-100 p-6 rounded-full mb-8 relative z-10">
                <span className="text-6xl filter drop-shadow-lg">🐒 🌳 🐊</span>
            </div>

            <p className="text-lg text-gray-600 mb-10 max-w-md relative z-10">
              A classic tale of friendship and cleverness, reimagined just for you!
            </p>

            <button 
              onClick={onStart}
              className="group relative z-10 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-bold py-4 px-12 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_4px_0_rgb(180,83,9)] active:shadow-[0_0px_0_rgb(180,83,9)] active:translate-y-1 transition-all flex items-center gap-3"
            >
              <Play className="fill-current" />
              Start Reading
            </button>
        </div>
      </div>
    </div>
  );
};