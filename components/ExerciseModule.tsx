import React, { useState } from 'react';
import { ExerciseEntry } from '../types';
import { Plus, Timer, Flame, X, Footprints, Calculator } from 'lucide-react';

interface ExerciseModuleProps {
  entries: ExerciseEntry[];
  onAddEntry: (e: ExerciseEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const ExerciseModule: React.FC<ExerciseModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
    const [isAdding, setIsAdding] = useState(false);
    
    // Manual Activity Input State
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [calories, setCalories] = useState('');

    // Quick Steps State
    const [stepInput, setStepInput] = useState('');

    const handleSaveManual = () => {
        if (!name || !duration || !calories) return;
        onAddEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name,
            durationMinutes: parseInt(duration),
            caloriesBurned: parseInt(calories)
        });
        setIsAdding(false);
        resetForm();
    };

    const handleSaveSteps = () => {
        const s = parseInt(stepInput);
        if (!s) return;
        
        // Calculation: 0.04 kcal/step
        const calculatedCalories = Math.round(s * 0.04);
        // Estimate time: 100 steps/min
        const estimatedMinutes = Math.ceil(s / 100);

        onAddEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name: "Walking (Steps)",
            durationMinutes: estimatedMinutes,
            caloriesBurned: calculatedCalories,
            steps: s
        });
        setStepInput('');
    };

    const resetForm = () => {
        setName('');
        setDuration('');
        setCalories('');
    };

    return (
        <div className="p-6 pb-32 space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Exercise</h1>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    <Plus size={24} />
                </button>
            </header>

            {/* Manual Step Logger Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Footprints size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-4">Steps Tracker</h2>
                    <div className="flex items-end space-x-2 mb-4">
                        <div className="flex-1">
                            <label className="text-xs text-blue-200 block mb-1">Enter Steps</label>
                            <input 
                                type="number" 
                                value={stepInput}
                                onChange={(e) => setStepInput(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white/20 text-white placeholder-blue-200/50 text-3xl font-bold p-3 rounded-xl outline-none focus:bg-white/30 transition-colors"
                            />
                        </div>
                    </div>
                    
                    {stepInput && parseInt(stepInput) > 0 && (
                        <div className="flex justify-between items-center mb-4 bg-white/10 p-3 rounded-xl">
                            <div>
                                <span className="text-xs text-blue-200 block">Est. Burn</span>
                                <span className="font-bold text-lg">{Math.round(parseInt(stepInput) * 0.04)} <span className="text-xs font-normal">kcal</span></span>
                            </div>
                             <div>
                                <span className="text-xs text-blue-200 block">Est. Time</span>
                                <span className="font-bold text-lg">{Math.ceil(parseInt(stepInput) / 100)} <span className="text-xs font-normal">min</span></span>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSaveSteps}
                        disabled={!stepInput}
                        className="w-full bg-white text-blue-600 disabled:bg-white/50 disabled:text-blue-400 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-blue-50"
                    >
                        <Plus size={20} />
                        <span>Log Steps</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-900">History</h3>
                {entries.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                        <Timer size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No exercises logged today.</p>
                    </div>
                ) : (
                    entries.slice().reverse().map(e => (
                        <div key={e.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-xl ${e.steps ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {e.steps ? <Footprints size={24} /> : <Flame size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{e.name}</h3>
                                    <p className="text-xs text-gray-500">
                                        {e.durationMinutes} mins 
                                        {e.steps ? ` • ${e.steps} steps` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-gray-900">{e.caloriesBurned} kcal</span>
                                <button onClick={() => onDeleteEntry(e.id)} className="text-gray-300 hover:text-red-500">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Log Activity Manually</h2>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activity Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Running, Yoga..."
                                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (min)</label>
                                    <input 
                                        type="number" 
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        placeholder="30"
                                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calories</label>
                                    <input 
                                        type="number" 
                                        value={calories}
                                        onChange={e => setCalories(e.target.value)}
                                        placeholder="250"
                                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-600 font-medium">Cancel</button>
                            <button 
                                onClick={handleSaveManual} 
                                disabled={!name || !duration || !calories}
                                className="flex-1 bg-orange-500 disabled:bg-gray-300 text-white rounded-xl font-bold py-3 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};