
import React, { useState, useMemo, useEffect } from 'react';
import { ExerciseEntry, UserProfile, ExerciseReminder } from '../types';
import { Plus, Timer, Flame, X, Footprints, Sparkles, ChevronLeft, Check, Bell, BellRing, Trash2 } from 'lucide-react';
import { estimateExercise } from '../services/geminiService';

interface ExerciseModuleProps {
  entries: ExerciseEntry[];
  onAddEntry: (e: ExerciseEntry) => void;
  onDeleteEntry: (id: string) => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ExerciseModule: React.FC<ExerciseModuleProps> = ({ 
    entries, 
    onAddEntry, 
    onDeleteEntry,
    userProfile,
    onUpdateProfile
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isEstimating, setIsEstimating] = useState(false);
    const [showReminderSettings, setShowReminderSettings] = useState(false);
    
    // Manual Activity Input State
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [calories, setCalories] = useState('');

    // Quick Steps State
    const [dailyStepTotal, setDailyStepTotal] = useState('');

    // Local Reminder State for Editing
    const [localReminders, setLocalReminders] = useState<ExerciseReminder[]>([]);

    useEffect(() => {
        if (showReminderSettings) {
            setLocalReminders(userProfile.reminders || []);
        }
    }, [showReminderSettings, userProfile.reminders]);

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

    // --- Reminder Logic ---

    const addReminder = () => {
        const newReminder: ExerciseReminder = {
            id: Date.now().toString(),
            time: "08:00",
            days: [1, 2, 3, 4, 5], // Mon-Fri default
            enabled: true
        };
        setLocalReminders([...localReminders, newReminder]);
    };

    const updateReminder = (id: string, updates: Partial<ExerciseReminder>) => {
        setLocalReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteReminder = (id: string) => {
        setLocalReminders(prev => prev.filter(r => r.id !== id));
    };

    const toggleDay = (reminderId: string, dayIndex: number) => {
        const reminder = localReminders.find(r => r.id === reminderId);
        if (!reminder) return;

        const newDays = reminder.days.includes(dayIndex)
            ? reminder.days.filter(d => d !== dayIndex)
            : [...reminder.days, dayIndex].sort();
        
        updateReminder(reminderId, { days: newDays });
    };

    const handleSaveReminders = async () => {
        // Request permission if any reminder is enabled
        const hasEnabled = localReminders.some(r => r.enabled);
        if (hasEnabled) {
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notification");
            } else if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert("Notification permission denied. We cannot send reminders.");
                    // Optional: Disable all reminders? Or just let them be "enabled" but ineffective?
                    // Let's keep them enabled in UI but user knows.
                }
            }
        }

        onUpdateProfile({
            ...userProfile,
            reminders: localReminders
        });
        setShowReminderSettings(false);
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
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setShowReminderSettings(true)}
                        className={`p-2 rounded-full shadow-md transition-colors ${userProfile.reminders && userProfile.reminders.some(r => r.enabled) ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400'}`}
                    >
                        {userProfile.reminders && userProfile.reminders.some(r => r.enabled) ? <BellRing size={24} /> : <Bell size={24} />}
                    </button>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>
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

            {/* Reminder Settings Modal */}
            {showReminderSettings && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center p-0 sm:p-6 animate-in fade-in">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                                <BellRing size={24} />
                            </div>
                            <button onClick={() => setShowReminderSettings(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Workout Reminders</h3>
                        <p className="text-sm text-gray-500 mb-6">Stay consistent with scheduled notifications.</p>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar mb-4">
                            {localReminders.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-sm">No reminders set.</p>
                                </div>
                            ) : (
                                localReminders.map(reminder => (
                                    <div key={reminder.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-3">
                                            <input 
                                                type="time" 
                                                value={reminder.time}
                                                onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                                                className="bg-transparent font-bold text-xl text-gray-900 outline-none p-0 focus:bg-white rounded"
                                            />
                                            <div className="flex items-center space-x-3">
                                                {/* Toggle */}
                                                <button 
                                                    onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
                                                    className={`w-10 h-6 rounded-full transition-colors relative ${reminder.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${reminder.enabled ? 'left-5' : 'left-1'}`} />
                                                </button>
                                                {/* Delete */}
                                                <button onClick={() => deleteReminder(reminder.id)} className="text-gray-400 hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Day Selector */}
                                        <div className="flex justify-between">
                                            {DAYS_OF_WEEK.map((day, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => toggleDay(reminder.id, idx)}
                                                    className={`w-8 h-8 text-xs font-bold rounded-full transition-all ${
                                                        reminder.days.includes(idx) 
                                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                                            : 'bg-white text-gray-400 border border-gray-200'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={addReminder}
                            className="w-full py-3 mb-3 border-2 border-dashed border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>Add Reminder</span>
                        </button>

                        <button 
                            onClick={handleSaveReminders}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            {/* Full Screen Add Activity Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
                    
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                        <button onClick={() => setIsAdding(false)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Log Activity</h2>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        
                        {/* Frequent Chips */}
                        {frequentActivities.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Add</h3>
                                <div className="flex flex-wrap gap-2">
                                    {frequentActivities.map(act => (
                                        <button 
                                            key={act}
                                            onClick={() => setName(act)}
                                            className="px-4 py-2 bg-orange-50 text-orange-700 text-sm font-bold rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors"
                                        >
                                            {act}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Activity Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Running, Yoga, Cycling"
                                    className="w-full p-4 bg-gray-50 rounded-2xl text-xl font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Duration (min)</label>
                                    <input 
                                        type="number" 
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-4 bg-gray-50 rounded-2xl text-xl font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Calories</label>
                                    <input 
                                        type="number" 
                                        value={calories}
                                        onChange={e => setCalories(e.target.value)}
                                        placeholder="0"
                                        className="w-full p-4 bg-gray-50 rounded-2xl text-xl font-semibold outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            
                            {/* AI Suggestion Button */}
                            {name && duration && !calories && (
                                <button 
                                    onClick={handleEstimateCalories}
                                    disabled={isEstimating}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 rounded-2xl text-base font-bold flex items-center justify-center space-x-2 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
                                >
                                    {isEstimating ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                                    ) : (
                                        <Sparkles size={20} />
                                    )}
                                    <span>Suggest Calories with AI</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-white safe-area-bottom">
                         <button 
                            onClick={handleSaveManual} 
                            disabled={!name || !duration || !calories}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-2xl font-bold py-4 transition-all text-lg shadow-lg flex items-center justify-center space-x-2 active:scale-[0.98]"
                        >
                            <Check size={24} />
                            <span>Log Workout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
