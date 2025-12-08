
import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mainChar: string, secondChar: string, setting: string) => void;
  isLoading: boolean;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [mainChar, setMainChar] = useState('');
  const [secondChar, setSecondChar] = useState('');
  const [setting, setSetting] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mainChar && secondChar && setting) {
      onSubmit(mainChar, secondChar, setting);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-['Fredoka']">
      <div className="bg-white w-full max-w-lg rounded-3xl p-8 relative shadow-2xl animate-fadeIn">
        
        <button 
          onClick={onClose} 
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="text-purple-600 w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-800">Create your Own Story</h2>
            <p className="text-gray-500 font-medium">Invent your own Panchatantra tale.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2 ml-1">Main Character</label>
            <input
              type="text"
              placeholder="e.g., A brave little Pig"
              value={mainChar}
              onChange={(e) => setMainChar(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium text-lg"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 ml-1">Friend or Enemy</label>
            <input
              type="text"
              placeholder="e.g., A wise old Owl"
              value={secondChar}
              onChange={(e) => setSecondChar(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium text-lg"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2 ml-1">Setting</label>
            <input
              type="text"
              placeholder="e.g., In a magical candy forest"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all font-medium text-lg"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !mainChar || !secondChar || !setting}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-black text-xl py-4 rounded-xl shadow-lg transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
                <>
                    <Loader2 className="animate-spin" />
                    Writing Story...
                </>
            ) : (
                <>
                    <Wand2 className="w-6 h-6" />
                    Generate Story
                </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
