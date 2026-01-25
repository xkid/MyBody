
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Loader2, Search, X, Type, Check, ChevronLeft, Sparkles, RefreshCw, Image as ImageIcon, PieChart } from 'lucide-react';
import { FoodEntry } from '../types';
import { analyzeFood } from '../services/geminiService';

interface FoodModuleProps {
  entries: FoodEntry[];
  onAddEntry: (entry: FoodEntry) => void;
  onDeleteEntry: (id: string) => void;
}

// Optimized image compression to prevent memory crashes on mobile
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = objectUrl;
        
        img.onload = () => {
            URL.revokeObjectURL(objectUrl); 
            const canvas = document.createElement('canvas');
            const MAX_DIM = 800; 
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            } else {
                reject(new Error("Canvas context error"));
            }
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(objectUrl);
            reject(e);
        };
    });
};

export const FoodModule: React.FC<FoodModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Form State
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState<string>('');
  
  // Macro States
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setPreviewUrl(null);
    setHasAnalyzed(false);
    setIsAdding(false);
  };

  // Auto-calculate calories based on macros
  useEffect(() => {
      // Only auto-calc if we have at least one macro entered
      if (protein || carbs || fat) {
          const p = parseFloat(protein) || 0;
          const c = parseFloat(carbs) || 0;
          const f = parseFloat(fat) || 0;
          const estimatedCals = Math.round((p * 4) + (c * 4) + (f * 9));
          if (estimatedCals > 0) {
              setCalories(estimatedCals.toString());
          }
      }
  }, [protein, carbs, fat]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalyzing(true);
      try {
          const compressed = await compressImage(file);
          setPreviewUrl(compressed);
          await handleAnalyze(compressed, description);
      } catch (error) {
          console.error("Image Processing Error", error);
          alert("Error processing image. Please try a smaller image or enter details manually.");
          setAnalyzing(false);
      }
    }
    e.target.value = '';
  };

  const handleAnalyze = async (imgData: string | null, textData: string) => {
    if (!imgData && !textData) return;
    
    setAnalyzing(true);
    try {
      let base64Data: string | null = null;
      if (imgData) {
        base64Data = imgData.split(',')[1];
      }

      const result = await analyzeFood(base64Data, textData);
      
      setDescription(result.foodName);
      setCalories(result.calories.toString());
      setProtein(result.macros.protein.toString());
      setCarbs(result.macros.carbs.toString());
      setFat(result.macros.fat.toString());
      
      setHasAnalyzed(true);

    } catch (error) {
      console.error("Analysis Error", error);
      alert("Failed to analyze food. You can enter details manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveEntry = () => {
    if (!description || !calories) return;

    try {
        const macros = (protein || carbs || fat) ? {
            protein: parseFloat(protein) || 0,
            carbs: parseFloat(carbs) || 0,
            fat: parseFloat(fat) || 0
        } : undefined;

        onAddEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name: description,
            calories: parseInt(calories),
            macros: macros,
            imageUrl: previewUrl || undefined,
            type: "Logged"
        });
        resetForm();
    } catch (e) {
        alert("Failed to save entry. Storage might be full.");
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
            <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {entry.imageUrl ? (
                        <img src={entry.imageUrl} alt={entry.name} className="h-full w-full object-cover" />
                        ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-50 text-blue-300">
                            <UtensilsIcon size={24} />
                        </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{entry.name}</h3>
                        <p className="text-xs text-gray-500">
                            {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        {/* Macro Badges in List */}
                        {entry.macros && (
                            <div className="flex space-x-2 mt-1">
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">P: {entry.macros.protein}g</span>
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">C: {entry.macros.carbs}g</span>
                                <span className="text-[10px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-medium">F: {entry.macros.fat}g</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="font-bold text-gray-900 whitespace-nowrap">{entry.calories} kcal</span>
                        <button onClick={() => onDeleteEntry(entry.id)} className="text-red-400 p-1 hover:text-red-600 mt-1">
                            <X size={16} />
                        </button>
                    </div>
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
              <div className="w-10"></div> 
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Image Section */}
              <div className="relative">
                <div 
                    className={`w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-all ${previewUrl ? 'bg-black' : 'bg-gray-50 border-2 border-dashed border-gray-300'}`}
                >
                    {previewUrl ? (
                        <div className="relative w-full h-full group">
                            <img src={previewUrl} alt="Meal" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                <button onClick={() => setPreviewUrl(null)} className="p-2 bg-white/20 text-white rounded-full hover:bg-white/40"><X size={24}/></button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-6 w-full">
                            {!analyzing && (
                                <div className="flex justify-center space-x-8 mb-6">
                                    <button 
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex flex-col items-center group transition-transform active:scale-95"
                                    >
                                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-200 transition-colors">
                                            <Camera size={28} />
                                        </div>
                                        <span className="text-sm font-bold mt-2 text-gray-600">Camera</span>
                                    </button>
                                    <button 
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="flex flex-col items-center group transition-transform active:scale-95"
                                    >
                                        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center text-purple-600 shadow-sm group-hover:bg-purple-200 transition-colors">
                                            <ImageIcon size={28} />
                                        </div>
                                        <span className="text-sm font-bold mt-2 text-gray-600">Gallery</span>
                                    </button>
                                </div>
                            )}
                            <p className="font-bold text-gray-900 text-lg">Add Food Photo</p>
                            <p className="text-sm text-gray-500 mt-1">AI will identify food, calories & macros</p>
                        </div>
                    )}
                    
                    {analyzing && (
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white backdrop-blur-sm z-20">
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
                    ref={cameraInputRef}
                    onChange={handleFileChange}
                />
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={galleryInputRef}
                    onChange={handleFileChange}
                />
              </div>

              {/* Description Input */}
              <div>
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 block">
                      {previewUrl ? 'Identified Item' : 'Food Description'}
                  </label>
                  <div className="relative">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={previewUrl ? "Checking image..." : "e.g. A grilled chicken sandwich and a cup of coffee"}
                        className={`w-full text-lg font-medium placeholder:font-normal p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none ${previewUrl ? 'h-24' : 'h-32'}`}
                    />
                    
                    {!previewUrl && description.length > 2 && !hasAnalyzed && (
                            <button 
                            onClick={() => handleAnalyze(null, description)}
                            disabled={analyzing}
                            className="absolute right-3 bottom-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                            {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            <span>Estimate</span>
                            </button>
                    )}

                    {previewUrl && !analyzing && (
                            <button 
                            onClick={() => handleAnalyze(previewUrl, description)}
                            className="absolute right-3 bottom-3 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-black transition-all flex items-center space-x-1"
                            >
                            <RefreshCw size={12} />
                            <span>Refine with AI</span>
                            </button>
                    )}
                  </div>
              </div>

              {/* Macros & Calories Section */}
              <div>
                  <div className="flex items-center space-x-2 mb-2">
                      <PieChart size={16} className="text-gray-400"/>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">Macronutrients (Optional)</label>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
                          <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Protein (g)</label>
                          <input 
                              type="number" 
                              value={protein}
                              onChange={e => setProtein(e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-lg font-bold text-purple-900 outline-none"
                          />
                      </div>
                      <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                          <label className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Carbs (g)</label>
                          <input 
                              type="number" 
                              value={carbs}
                              onChange={e => setCarbs(e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-lg font-bold text-blue-900 outline-none"
                          />
                      </div>
                      <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100">
                          <label className="text-[10px] font-bold text-orange-700 uppercase block mb-1">Fat (g)</label>
                          <input 
                              type="number" 
                              value={fat}
                              onChange={e => setFat(e.target.value)}
                              placeholder="0"
                              className="w-full bg-transparent text-lg font-bold text-orange-900 outline-none"
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1 block">Total Calories</label>
                      <input
                          type="number"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder="0"
                          className="w-full text-xl font-semibold placeholder:font-normal p-4 bg-gray-50 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <p className="text-xs text-gray-400 mt-2 px-1">
                          Calculated automatically from macros if entered (4 kcal/g protein & carbs, 9 kcal/g fat).
                      </p>
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
