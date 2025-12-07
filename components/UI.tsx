import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
    message: string;
    onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border-l-4 border-red-500">
                <div className="flex justify-center mb-4 text-red-500">
                    <AlertCircle size={48} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Oh no!</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <button 
                    onClick={onRetry}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}