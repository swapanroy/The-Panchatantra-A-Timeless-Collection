
import React, { useState } from 'react';
import { Story } from '../types';
import { Star, Book, Plus, Trash2, ArrowLeft, ArrowRight, Settings2, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

interface LibraryProps {
  savedStories: Story[];
  defaultStories: Story[];
  onSelectStory: (story: Story) => void;
  onCreateStory: () => void;
  onDeleteStory: (id: string) => void;
  onReorderStories: (stories: Story[]) => void;
}

const colorVariants: Record<string, string> = {
  green: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-800',
  orange: 'bg-orange-100 hover:bg-orange-200 border-orange-200 text-orange-800',
  blue: 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-800',
  teal: 'bg-teal-100 hover:bg-teal-200 border-teal-200 text-teal-800',
  purple: 'bg-purple-100 hover:bg-purple-200 border-purple-200 text-purple-800',
  red: 'bg-red-100 hover:bg-red-200 border-red-200 text-red-800',
};

const iconBgVariants: Record<string, string> = {
  green: 'bg-green-200',
  orange: 'bg-orange-200',
  blue: 'bg-blue-200',
  teal: 'bg-teal-200',
  purple: 'bg-purple-200',
  red: 'bg-red-200',
};

type Tab = 'read' | 'manage';

export const Library: React.FC<LibraryProps> = ({ savedStories, defaultStories, onSelectStory, onCreateStory, onDeleteStory, onReorderStories }) => {
  const [activeTab, setActiveTab] = useState<Tab>('read');

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newStories = [...savedStories];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newStories.length) {
        // Swap
        [newStories[index], newStories[targetIndex]] = [newStories[targetIndex], newStories[index]];
        onReorderStories(newStories);
    }
  };
  
  const StoryCard = ({ story }: { story: Story }) => {
    const cardClass = colorVariants[story.color] || colorVariants.green;
    const iconClass = iconBgVariants[story.color] || iconBgVariants.green;

    return (
        <button
        onClick={() => onSelectStory(story)}
        className={`
            group relative p-6 rounded-3xl border-b-8 transition-all duration-300
            transform hover:-translate-y-2 hover:shadow-xl text-left flex flex-col h-full w-full
            ${cardClass}
        `}
        >
        <div className="flex items-start justify-between mb-4 w-full">
            <div className={`w-16 h-16 rounded-2xl ${iconClass} flex items-center justify-center text-4xl shadow-inner`}>
            {story.icon}
            </div>
            {story.isCustom ? (
                <div className="bg-purple-100 px-3 py-1 rounded-full border border-purple-200 shadow-sm">
                     <span className="text-xs font-bold uppercase tracking-wider text-purple-700 whitespace-nowrap">You Created!</span>
                </div>
            ) : (
                <div className="bg-white/40 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm shadow-sm">
                     <span className="text-xs font-bold uppercase tracking-wider opacity-90">Classic</span>
                </div>
            )}
        </div>
        
        <h2 className="text-2xl font-black mb-2 leading-tight group-hover:scale-[1.02] transition-transform origin-left">
            {story.title}
        </h2>
        
        <p className="mt-auto pt-4 text-sm font-bold opacity-60 uppercase tracking-widest">
            {story.isCustom ? 'Read Your Story →' : 'Read Now →'}
        </p>
        </button>
    );
  };

  const ManageCard = ({ story, index, isCustom }: { story: Story, index: number, isCustom: boolean }) => {
    const isFirst = index === 0;
    const isLast = index === savedStories.length - 1;
    const [deleteStep, setDeleteStep] = useState(0); // 0: Idle, 1: Warning 1, 2: Warning 2

    const handleDelete = () => {
        if (deleteStep === 0) {
            setDeleteStep(1);
        } else if (deleteStep === 1) {
            setDeleteStep(2);
        } else {
            onDeleteStory(story.id);
        }
    };

    return (
        <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center gap-6 transition-all hover:border-purple-200">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${isCustom ? 'bg-purple-100' : 'bg-gray-100 grayscale'}`}>
                {story.icon}
            </div>
            
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800">{story.title}</h3>
                    {!isCustom && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold uppercase">Default</span>}
                </div>
                <p className="text-gray-400 text-sm font-medium">
                    {story.scenes.length} Scenes • {isCustom ? 'Created by You' : 'Classic Tale'}
                </p>
            </div>

            <div className="flex items-center gap-2">
                {isCustom && deleteStep === 0 && (
                    <>
                        <button 
                            onClick={() => handleMove(index, 'left')}
                            disabled={isFirst}
                            className={`p-3 rounded-xl border-2 font-bold transition-all ${isFirst ? 'bg-gray-50 border-gray-100 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                            title="Move Up/Left"
                        >
                            <ArrowLeft size={20} className="md:hidden" /> {/* Mobile visual */}
                            <ArrowLeft size={20} className="hidden md:block rotate-90 md:rotate-0" /> {/* Desktop visual */}
                        </button>

                        <button 
                            onClick={() => handleMove(index, 'right')}
                            disabled={isLast}
                            className={`p-3 rounded-xl border-2 font-bold transition-all ${isLast ? 'bg-gray-50 border-gray-100 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                            title="Move Down/Right"
                        >
                            <ArrowRight size={20} className="md:hidden" />
                            <ArrowRight size={20} className="hidden md:block rotate-90 md:rotate-0" />
                        </button>

                        <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                    </>
                )}

                <button 
                    onClick={handleDelete}
                    className={`
                        p-3 rounded-xl flex items-center gap-2 font-bold transition-all
                        ${deleteStep === 0 ? 'bg-red-50 text-red-500 hover:bg-red-100' : ''}
                        ${deleteStep === 1 ? 'bg-orange-100 text-orange-600 hover:bg-orange-200 w-full md:w-auto justify-center' : ''}
                        ${deleteStep === 2 ? 'bg-red-600 text-white hover:bg-red-700 w-full md:w-auto justify-center shadow-lg' : ''}
                    `}
                >
                    {deleteStep === 0 && <Trash2 size={20} />}
                    {deleteStep === 0 && <span className="md:hidden">Delete</span>}
                    
                    {deleteStep === 1 && (
                        <>
                            <AlertTriangle size={20} />
                            <span className="whitespace-nowrap">Story will be lost forever!</span>
                        </>
                    )}

                    {deleteStep === 2 && (
                        <>
                            <AlertTriangle size={20} />
                            <span className="whitespace-nowrap">Confirm Delete!</span>
                        </>
                    )}
                </button>
                
                {deleteStep > 0 && (
                    <button 
                        onClick={() => setDeleteStep(0)}
                        className="p-3 text-gray-400 hover:text-gray-600"
                        title="Cancel"
                    >
                        <span className="text-sm font-bold">Cancel</span>
                    </button>
                )}

                {!isCustom && deleteStep === 0 && (
                    <span className="hidden md:block px-4 py-2 bg-gray-50 rounded-xl text-gray-400 font-bold text-sm">Default</span>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-10 font-['Fredoka']">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="bg-yellow-400 p-3 rounded-2xl shadow-[0_4px_0_rgb(202,138,4)]">
                    <Book className="w-8 h-8 text-yellow-900" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Panchatantra Tales</h1>
                    <p className="text-slate-500 font-medium">Pick a story to start your adventure or create your own</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white p-1.5 rounded-2xl border border-gray-200 flex shadow-sm self-start md:self-auto">
                <button 
                    onClick={() => setActiveTab('read')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'read' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <BookOpen size={18} />
                    Library
                </button>
                <button 
                    onClick={() => setActiveTab('manage')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Settings2 size={18} />
                    Manage
                </button>
            </div>
        </header>

        {/* READ TAB */}
        {activeTab === 'read' && (
            <div className="animate-fadeIn">
                {/* Main Grid: Create Button -> Custom Stories (Newest First) -> Default Stories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Create New Story Card */}
                <button
                    onClick={onCreateStory}
                    className="group relative p-6 rounded-3xl border-b-8 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl text-left flex flex-col h-full bg-purple-100 hover:bg-purple-200 border-purple-200 text-purple-900"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-200 flex items-center justify-center text-3xl shadow-inner text-purple-600">
                            <Plus size={32} strokeWidth={3} />
                        </div>
                        <div className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            New
                        </div>
                    </div>
                    <h2 className="text-2xl font-black mb-2 leading-tight">Create Your Own Story</h2>
                    <p className="text-purple-700/70 font-medium mb-4">
                        Pick characters and let AI write a magic tale for you!
                    </p>
                    <p className="mt-auto pt-4 text-sm font-bold opacity-60 uppercase tracking-widest">
                        Start Creating →
                    </p>
                </button>
                
                {/* Custom Stories (Reversed for Newest First) */}
                {[...savedStories].reverse().map(story => <StoryCard key={story.id} story={story} />)}

                {/* Default Stories */}
                {defaultStories.map((story) => <StoryCard key={story.id} story={story} />)}
                </div>
            </div>
        )}

        {/* MANAGE TAB */}
        {activeTab === 'manage' && (
            <div className="animate-fadeIn max-w-3xl mx-auto space-y-12">
                 <div className="bg-purple-50 border border-purple-100 rounded-3xl p-8 text-center">
                    <h2 className="text-2xl font-black text-purple-900 mb-2">Manage Your Library</h2>
                    <p className="text-purple-700/70 font-medium">Reorder or delete your stories.</p>
                 </div>

                 {/* Custom Stories Section */}
                 <div>
                    <h3 className="text-xl font-black text-slate-700 mb-6 px-2 flex items-center gap-2">
                        <span className="text-purple-500">✨</span> My Custom Stories
                    </h3>
                    
                    {savedStories.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">No custom stories created yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {savedStories.map((story, index) => (
                                <ManageCard key={story.id} story={story} index={index} isCustom={true} />
                            ))}
                        </div>
                    )}
                 </div>

                 {/* Default Stories Section */}
                 <div>
                    <h3 className="text-xl font-black text-slate-700 mb-6 px-2 flex items-center gap-2">
                        <span className="text-yellow-500">📚</span> Classic Tales
                    </h3>
                    
                    {defaultStories.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">All classic tales hidden.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {defaultStories.map((story, index) => (
                                <ManageCard key={story.id} story={story} index={index} isCustom={false} />
                            ))}
                        </div>
                    )}
                 </div>
            </div>
        )}
        
        <div className="mt-16 text-center">
            <p className="text-slate-400 font-bold text-sm">
                Generated by Swapan Roy
            </p>
        </div>
      </div>
    </div>
  );
};
