import React, { useState, useMemo } from 'react';
import { ExerciseEntry } from '../types';
import { Plus, Timer, Flame, X, Footprints, Sparkles, History } from 'lucide-react';
import { estimateExercise } from '../services/geminiService';

interface ExerciseModuleProps {
  entries: ExerciseEntry[];
  onAddEntry: (e: ExerciseEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const ExerciseModule: React.FC<ExerciseModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isEstimating, setIsEstimating] = useState(false);
    
    // Manual Activity Input State
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [calories, setCalories] = useState('');

    // Quick Steps State
    const [dailyStepTotal, setDailyStepTotal] = useState('');

    // Calculate existing steps for today
    const stepsTodaySoFar = useMemo(() => {
        return entries.reduce((acc, curr) => acc + (curr.steps || 0), 0);
    }, [entries]);

    // Frequent activities logic
    const frequentActivities = useMemo(() => {
        const counts: Record<string, number> = {};
        entries.forEach(e => {
            if (!e.steps) { // Ignore steps entries
                counts[e.name] = (counts[e.name] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
    }, [entries]);

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

    const handleEstimateCalories = async () => {
        if (!name || !duration) return;
        setIsEstimating(true);
        try {
            const result = await estimateExercise(name, parseInt(duration));
            setCalories(result.calories.toString());
        } catch (e) {
            console.error(e);
        } finally {
            setIsEstimating(false);
        }
    };

    const handleSaveSteps = () => {
        const currentTotal = parseInt(dailyStepTotal);
        if (!currentTotal) return;
        
        // Calculate the difference from what we already have logged
        const delta = currentTotal - stepsTodaySoFar;

        if (delta <= 0) {
            alert(`You've already logged ${stepsTodaySoFar} steps. Please enter a value higher than that to update your daily total.`);
            return;
        }
        
        // Calculation: 0.04 kcal/step
        const calculatedCalories = Math.round(delta * 0.04);
        // Estimate time: 100 steps/min
        const estimatedMinutes = Math.ceil(delta / 100);

        onAddEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name: "Steps Sync",
            durationMinutes: estimatedMinutes,
            caloriesBurned: calculatedCalories,
            steps: delta // Log only the difference
        });
        setDailyStepTotal('');
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

            {/* Steps Tracker Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Footprints size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-blue-100 text-sm font-bold uppercase tracking-wider">Daily Steps</h2>
                        <div className="bg-blue-500/50 px-2 py-1 rounded text-xs">
                            Logged: {stepsTodaySoFar}
                        </div>
                    </div>
                    
                    <div className="flex items-end space-x-2 mb-4">
                        <div className="flex-1">
                            <label className="text-xs text-blue-200 block mb-1">Current Pedometer Total</label>
                            <input 
                                type="number" 
                                value={dailyStepTotal}
                                onChange={(e) => setDailyStepTotal(e.target.value)}
                                placeholder={stepsTodaySoFar > 0 ? `${stepsTodaySoFar}` : "0"}
                                className="w-full bg-white/20 text-white placeholder-blue-200/50 text-3xl font-bold p-3 rounded-xl outline-none focus:bg-white/30 transition-colors"
                            />
                        </div>
                    </div>
                    
                    {/* Preview Calculations based on Delta */}
                    {dailyStepTotal && (parseInt(dailyStepTotal) - stepsTodaySoFar) > 0 && (
                        <div className="flex justify-between items-center mb-4 bg-white/10 p-3 rounded-xl animate-in fade-in">
                            <div className="flex flex-col">
                                <span className="text-xs text-blue-200">New Steps</span>
                                <span className="font-bold">+{parseInt(dailyStepTotal) - stepsTodaySoFar}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-xs text-blue-200">Added Burn</span>
                                <span className="font-bold">+{Math.round((parseInt(dailyStepTotal) - stepsTodaySoFar) * 0.04)} kcal</span>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSaveSteps}
                        disabled={!dailyStepTotal || (parseInt(dailyStepTotal) <= stepsTodaySoFar)}
                        className="w-full bg-white text-blue-600 disabled:bg-white/50 disabled:text-blue-400 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all hover:bg-blue-50"
                    >
                        <Plus size={20} />
                        <span>Update Total</span>
                    </button>
                </div>
            </div>

            {/* History List */}
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
                                        {e.steps ? ` • +${e.steps} steps` : ''}
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

            {/* Add Activity Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                             <h2 className="text-xl font-bold">Log Activity</h2>
                             <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            
                            {/* Frequent Chips */}
                            {frequentActivities.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {frequentActivities.map(act => (
                                        <button 
                                            key={act}
                                            onClick={() => setName(act)}
                                            className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg whitespace-nowrap border border-orange-100 hover:bg-orange-100"
                                        >
                                            {act}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Activity Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Running, Yoga..."
                                    className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
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
                                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Calories</label>
                                    <input 
                                        type="number" 
                                        value={calories}
                                        onChange={e => setCalories(e.target.value)}
                                        placeholder="250"
                                        className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                                    />
                                </div>
                            </div>
                            
                            {/* AI Suggestion Button */}
                            {name && duration && !calories && (
                                <button 
                                    onClick={handleEstimateCalories}
                                    disabled={isEstimating}
                                    className="w-full py-2 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                >
                                    {isEstimating ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                                    ) : (
                                        <Sparkles size={16} />
                                    )}
                                    <span>Suggest Calories with AI</span>
                                </button>
                            )}
                        </div>

                        <button 
                            onClick={handleSaveManual} 
                            disabled={!name || !duration || !calories}
                            className="w-full bg-orange-500 disabled:bg-gray-300 text-white rounded-xl font-bold py-4 transition-colors text-lg"
                        >
                            Log Workout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};