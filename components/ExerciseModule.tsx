
import React, { useState, useEffect } from 'react';
import { Plus, Dumbbell, X, Flame, Loader2, Bell, Check, ChevronLeft, Trash2 } from 'lucide-react';
import { ExerciseEntry, UserProfile, ExerciseReminder } from '../types';
import { estimateExercise } from '../services/geminiService';

interface ExerciseModuleProps {
  entries: ExerciseEntry[];
  onAddEntry: (entry: ExerciseEntry) => void;
  onDeleteEntry: (id: string) => void;
  userProfile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const ExerciseModule: React.FC<ExerciseModuleProps> = ({ 
    entries, 
    onAddEntry, 
    onDeleteEntry,
    userProfile,
    onUpdateProfile
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [showReminderSettings, setShowReminderSettings] = useState(false);

    // Form State
    const [activityName, setActivityName] = useState('');
    const [duration, setDuration] = useState('');
    const [steps, setSteps] = useState('');
    const [manualCalories, setManualCalories] = useState('');
    const [isEstimating, setIsEstimating] = useState(false);

    // Reminder State (local buffer before saving)
    const [localReminders, setLocalReminders] = useState<ExerciseReminder[]>([]);

    useEffect(() => {
        if (showReminderSettings) {
            setLocalReminders(userProfile.reminders || []);
        }
    }, [showReminderSettings, userProfile.reminders]);

    const resetForm = () => {
        setActivityName('');
        setDuration('');
        setSteps('');
        setManualCalories('');
        setIsAdding(false);
    };

    const handleEstimate = async () => {
        if (!activityName || !duration) return;
        setIsEstimating(true);
        try {
            const result = await estimateExercise(activityName, parseInt(duration));
            if (result && result.calories) {
                setManualCalories(result.calories.toString());
            }
        } catch (e) {
            console.error(e);
            alert("Could not estimate calories.");
        } finally {
            setIsEstimating(false);
        }
    };

    const handleSaveEntry = () => {
        if (!activityName || !duration || !manualCalories) return;
        onAddEntry({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name: activityName,
            durationMinutes: parseInt(duration),
            caloriesBurned: parseInt(manualCalories),
            steps: steps ? parseInt(steps) : undefined
        });
        resetForm();
    };

    // --- Reminder Logic ---
    const handleAddReminder = () => {
        const newReminder: ExerciseReminder = {
            id: Date.now().toString(),
            time: "08:00",
            days: [0, 1, 2, 3, 4, 5, 6],
            enabled: true
        };
        setLocalReminders([...localReminders, newReminder]);
    };

    const handleRemoveReminder = (id: string) => {
        setLocalReminders(localReminders.filter(r => r.id !== id));
    };

    const handleUpdateReminder = (id: string, updates: Partial<ExerciseReminder>) => {
        setLocalReminders(localReminders.map(r => r.id === id ? { ...r, ...updates } : r));
    };
    
    const toggleDay = (reminderId: string, dayIndex: number) => {
        const reminder = localReminders.find(r => r.id === reminderId);
        if (!reminder) return;
        
        const newDays = reminder.days.includes(dayIndex)
            ? reminder.days.filter(d => d !== dayIndex)
            : [...reminder.days, dayIndex].sort();
            
        handleUpdateReminder(reminderId, { days: newDays });
    };

    const handleSaveReminders = async () => {
        // Request permission if any reminder is enabled
        const hasEnabled = localReminders.some(r => r.enabled);
        
        if (hasEnabled && "Notification" in window) {
            if (Notification.permission === 'granted') {
                // Permission already granted
            } else {
                // Request permission
                const permission = await Notification.requestPermission();
                if (permission === 'denied') {
                    alert("Notifications are blocked. Please enable them in your browser settings to receive exercise reminders.");
                } else if (permission !== 'granted') {
                    alert("Notifications are not enabled. You won't receive reminders.");
                }
            }
        } else if (hasEnabled && !("Notification" in window)) {
             alert("This browser does not support desktop notifications.");
        }

        onUpdateProfile({
            ...userProfile,
            reminders: localReminders
        });
        setShowReminderSettings(false);
    };

    return (
        <div className="p-6 pb-32 space-y-6 min-h-full relative">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Exercise</h1>
                <div className="flex space-x-2">
                     <button 
                        onClick={() => setShowReminderSettings(true)}
                        className="bg-white text-gray-600 border border-gray-200 p-2 rounded-full shadow-sm hover:bg-gray-50"
                    >
                        <Bell size={24} />
                    </button>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </header>

            {/* List */}
             <div className="space-y-4">
                {entries.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No activity logged today.</p>
                  </div>
                ) : (
                  entries.map(entry => (
                    <div key={entry.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                       <div className="flex items-center space-x-4">
                           <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                               <Dumbbell size={24} />
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-900">{entry.name}</h3>
                               <p className="text-xs text-gray-500">
                                  {entry.durationMinutes} min • {entry.steps ? `${entry.steps} steps` : 'Manual'}
                               </p>
                           </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="font-bold text-orange-600">{entry.caloriesBurned} kcal</span>
                          <button onClick={() => onDeleteEntry(entry.id)} className="text-red-300 p-1 hover:text-red-500">
                            <X size={16} />
                          </button>
                       </div>
                    </div>
                  ))
                )}
            </div>

            {/* Add Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                        <button onClick={resetForm} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Log Activity</h2>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Activity Name</label>
                            <input 
                                type="text"
                                value={activityName}
                                onChange={e => setActivityName(e.target.value)}
                                placeholder="e.g. Running, Yoga, Weightlifting"
                                className="w-full mt-2 p-4 bg-gray-50 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Duration (min)</label>
                                <input 
                                    type="number"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                    placeholder="30"
                                    className="w-full mt-2 p-4 bg-gray-50 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Steps (Optional)</label>
                                <input 
                                    type="number"
                                    value={steps}
                                    onChange={e => setSteps(e.target.value)}
                                    placeholder="0"
                                    className="w-full mt-2 p-4 bg-gray-50 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                                />
                             </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                             <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Calories Burned</label>
                                <button 
                                    onClick={handleEstimate}
                                    disabled={!activityName || !duration || isEstimating}
                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center space-x-1"
                                >
                                    {isEstimating ? <Loader2 className="animate-spin" size={12} /> : <Flame size={12} />}
                                    <span>Estimate with AI</span>
                                </button>
                             </div>
                             <input 
                                type="number"
                                value={manualCalories}
                                onChange={e => setManualCalories(e.target.value)}
                                placeholder="0"
                                className="w-full p-4 bg-gray-50 rounded-2xl text-2xl font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                AI estimation provides an approximation based on activity type and duration.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-white safe-area-bottom">
                        <button
                            onClick={handleSaveEntry}
                            disabled={!activityName || !duration || !manualCalories}
                            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 disabled:bg-gray-300"
                        >
                            <Check size={24} />
                            <span>Save Activity</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Reminder Modal */}
             {showReminderSettings && (
                 <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                        <button onClick={() => setShowReminderSettings(false)} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Exercise Reminders</h2>
                        <div className="w-10"></div>
                    </div>

                    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        <p className="text-sm text-gray-500">
                            Schedule notifications to remind you to work out.
                        </p>

                        {localReminders.map((reminder, index) => (
                            <div key={reminder.id} className="bg-gray-50 p-4 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center">
                                    <input 
                                        type="time" 
                                        value={reminder.time}
                                        onChange={e => handleUpdateReminder(reminder.id, { time: e.target.value })}
                                        className="bg-white px-3 py-2 rounded-xl font-bold text-xl border border-gray-200 outline-none focus:border-blue-500"
                                    />
                                    <div className="flex items-center space-x-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={reminder.enabled}
                                                onChange={e => handleUpdateReminder(reminder.id, { enabled: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                        <button onClick={() => handleRemoveReminder(reminder.id)} className="text-red-400 hover:text-red-600 p-2">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between">
                                    {['S','M','T','W','T','F','S'].map((day, idx) => {
                                        const isSelected = reminder.days.includes(idx);
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => toggleDay(reminder.id, idx)}
                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                                                    isSelected ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-200'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={handleAddReminder}
                            className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>Add Reminder</span>
                        </button>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-white safe-area-bottom">
                         <button
                            onClick={handleSaveReminders}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2"
                        >
                            <Check size={24} />
                            <span>Save Settings</span>
                        </button>
                    </div>
                 </div>
             )}
        </div>
    );
};
