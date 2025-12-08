
import React from 'react';
import { X, Crown, Trash2 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-['Fredoka']">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 relative shadow-2xl animate-fadeIn text-center">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Crown className="text-yellow-600 w-10 h-10 fill-current" />
        </div>

        <h2 className="text-3xl font-black text-gray-800 mb-2">Library Full!</h2>
        <p className="text-gray-500 font-medium mb-8">
            You can save up to 4 custom stories for free.
        </p>

        <div className="space-y-4">
            <button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-900 font-bold text-xl py-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                <Crown size={24} className="fill-current" />
                Unlock Unlimited ($1/mo)
            </button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold uppercase">Or</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-lg py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <Trash2 size={20} />
                Delete Old Stories
            </button>
        </div>
      </div>
    </div>
  );
};
