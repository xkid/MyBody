import React, { useState, useRef } from 'react';
import { Camera, Plus, Loader2, Search, X, Type, Check, ChevronLeft, Sparkles } from 'lucide-react';
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
  
  // Form State
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // UI State
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDescription('');
    setCalories('');
    setPreviewUrl(null);
    setHasAnalyzed(false);
    setIsAdding(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        // Auto-analyze immediately upon photo selection
        handleAnalyze(result, '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (imgData: string | null, textData: string) => {
    if (!imgData && !textData) return;
    
    setAnalyzing(true);
    try {
      let base64Data: string | null = null;
      if (imgData) {
        base64Data = imgData.split(',')[1];
      }

      // Analyze using AI
      const result = await analyzeFood(base64Data, textData);
      
      // Pre-populate fields for user editing
      setDescription(result.foodName);
      setCalories(result.calories.toString());
      setHasAnalyzed(true);

    } catch (error) {
      alert("Failed to analyze food. You can enter details manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveEntry = () => {
    if (!description || !calories) return;

    onAddEntry({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        name: description,
        calories: parseInt(calories),
        imageUrl: previewUrl || undefined,
        type: "Logged"
      });
      
      resetForm();
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

      {/* Full Screen Add Interface */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
           
           {/* Header */}
           <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <button onClick={resetForm} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold">Add Meal</h2>
              <div className="w-10"></div> {/* Spacer */}
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Image Section */}
              <div className="relative">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'bg-black' : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-50'}`}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Meal" className="w-full h-full object-contain" />
                    ) : (
                        <div className="text-center p-6">
                            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                                <Camera size={32} />
                            </div>
                            <p className="font-bold text-gray-900 text-lg">Take a Photo</p>
                            <p className="text-sm text-gray-500 mt-1">AI will identify food & calories</p>
                        </div>
                    )}
                    
                    {analyzing && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                            <Loader2 className="animate-spin mb-2" size={40} />
                            <p className="font-bold">Analyzing...</p>
                        </div>
                    )}
                </div>
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
              </div>

              {/* Divider if no image */}
              {!previewUrl && (
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-white text-gray-500 font-medium">Or describe manually</span>
                    </div>
                </div>
              )}

              {/* Manual Input / Editing Section */}
              <div className="space-y-4">
                  <div>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                          {previewUrl ? 'Food Name' : 'Food Description'}
                      </label>
                      <div className="relative">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={previewUrl ? "Identified Food Name" : "e.g. A grilled chicken sandwich and a cup of coffee"}
                            className={`w-full text-lg font-medium placeholder:font-normal p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${previewUrl ? 'h-16' : 'h-32'}`}
                        />
                        
                        {/* AI Trigger for Text Only */}
                        {!previewUrl && description.length > 2 && !hasAnalyzed && (
                             <button 
                                onClick={() => handleAnalyze(null, description)}
                                disabled={analyzing}
                                className="absolute right-3 bottom-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                             >
                                {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                <span>Estimate Calories</span>
                             </button>
                        )}
                      </div>
                  </div>

                  <div>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 block">Calories (kcal)</label>
                      <input
                          type="number"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder="0"
                          className="w-full text-xl font-semibold placeholder:font-normal p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                  </div>
              </div>
           </div>

           {/* Footer Action */}
           <div className="p-6 border-t border-gray-100 bg-white safe-area-bottom">
              <button
                onClick={handleSaveEntry}
                disabled={!description || !calories || analyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
              >
                 <Check size={24} />
                 <span>Save Entry</span>
              </button>
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