import React, { useState, useRef } from 'react';
import { Camera, Plus, Loader2, Search, X, Type } from 'lucide-react';
import { FoodEntry } from '../types';
import { analyzeFood } from '../services/geminiService';

interface FoodModuleProps {
  entries: FoodEntry[];
  onAddEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const FoodModule: React.FC<FoodModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!previewUrl && !description) return;
    
    setAnalyzing(true);
    try {
      let calories = 0;
      let name = description || "Meal";
      let base64Data: string | null = null;

      if (previewUrl) {
        base64Data = previewUrl.split(',')[1];
      }

      // Analyze using AI (works with image+text OR just text)
      const result = await analyzeFood(base64Data, description);
      calories = result.calories;
      name = result.foodName;

      onAddEntry({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        name,
        calories,
        imageUrl: previewUrl || undefined,
        type: description
      });

      // Reset
      setIsAdding(false);
      setPreviewUrl(null);
      setDescription('');
    } catch (error) {
      alert("Failed to analyze food. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6 min-h-full relative">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Food Log</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <UtensilsIcon />
            <p className="mt-4">No meals tracked today.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
               <div className="h-16 w-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                 {entry.imageUrl ? (
                   <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-cover" />
                 ) : (
                   <div className="h-full w-full flex items-center justify-center bg-blue-50 text-blue-300">
                     <UtensilsIcon size={24} />
                   </div>
                 )}
               </div>
               <div className="flex-1">
                 <h3 className="font-bold text-gray-900">{entry.name}</h3>
                 <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 {entry.type && <p className="text-xs text-gray-400 italic">"{entry.type}"</p>}
               </div>
               <div className="flex flex-col items-end">
                  <span className="font-bold text-gray-900">{entry.calories} kcal</span>
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-red-400 p-1 hover:text-red-600">
                    <X size={16} />
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal/Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Meal</h2>
              <button onClick={() => setIsAdding(false)} className="bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Input Selection Visuals */}
              <div className="flex space-x-4">
                  {/* Camera Option */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 border-2 border-dashed rounded-2xl h-32 flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${previewUrl ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="text-gray-400 mb-2" size={24} />
                        <p className="text-xs text-gray-500 font-medium">Take Photo</p>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* OR divider (visual only) */}
                  <div className="flex items-center justify-center text-gray-300 font-bold text-xs">OR</div>

                  {/* Text Option */}
                   <div 
                    className={`flex-1 border-2 border-transparent rounded-2xl h-32 flex flex-col items-center justify-center bg-gray-50 transition-colors ${description && !previewUrl ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}
                  >
                        <Type className={`mb-2 ${description ? 'text-blue-500' : 'text-gray-400'}`} size={24} />
                        <p className={`text-xs font-medium ${description ? 'text-blue-600' : 'text-gray-500'}`}>
                            Type Details below
                        </p>
                  </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <div className="relative">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 1 apple, Chicken Rice"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {previewUrl ? "Optional: Add details to help AI." : "Required: Describe your meal."}
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || (!previewUrl && !description)}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <span>Calculate Calories</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UtensilsIcon = ({ size = 48, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);