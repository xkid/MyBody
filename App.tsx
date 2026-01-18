
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { FoodModule } from './components/FoodModule';
import { BodyModule } from './components/BodyModule';
import { ExerciseModule } from './components/ExerciseModule';
import { StatsModule } from './components/StatsModule';
import { ProfileSettings } from './components/ProfileSettings';
import { AppView, UserProfile, FoodEntry, ExerciseEntry, WeightEntry, MeasurementEntry, DailyStats } from './types';
import { Info, X } from 'lucide-react';

// Initial Defaults
const DEFAULT_PROFILE_ID = 'default_user_1';
const INITIAL_PROFILE: UserProfile = {
  id: DEFAULT_PROFILE_ID,
  name: "User",
  gender: "female",
  age: 30,
  heightCm: 165,
};

// Application Version - Bump this to trigger the update modal
const APP_VERSION = '1.3.0';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Dashboard Date State
  const [dashboardDate, setDashboardDate] = useState(new Date());

  // Profile State
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');

  // Data States (Specific to current profile)
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);

  // Safe Storage Helper
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
      // Could trigger a toast notification here if UI allows
    }
  };

  // 1. Initialization & Migration Logic
  useEffect(() => {
    try {
      const storedProfilesStr = localStorage.getItem('vs_profiles');
      const storedActiveId = localStorage.getItem('vs_active_id');

      if (storedProfilesStr) {
          // Normal Load
          const parsedProfiles = JSON.parse(storedProfilesStr);
          setProfiles(parsedProfiles);
          setCurrentProfileId(storedActiveId && parsedProfiles.find((p: UserProfile) => p.id === storedActiveId) ? storedActiveId : parsedProfiles[0].id);
      } else {
          // First Time or Migration
          const legacyProfileStr = localStorage.getItem('vs_profile');
          let initialProfile = INITIAL_PROFILE;
          
          if (legacyProfileStr) {
              const legacy = JSON.parse(legacyProfileStr);
              initialProfile = { ...INITIAL_PROFILE, ...legacy, id: DEFAULT_PROFILE_ID };
          }

          const newProfiles = [initialProfile];
          setProfiles(newProfiles);
          setCurrentProfileId(initialProfile.id);
          saveToStorage('vs_profiles', newProfiles);
          saveToStorage('vs_active_id', initialProfile.id);

          // Migrate Legacy Data if exists
          const migrate = (oldKey: string, newKeySuffix: string) => {
              const data = localStorage.getItem(oldKey);
              if (data) {
                  saveToStorage(`vs_${newKeySuffix}_${initialProfile.id}`, data);
              }
          };

          migrate('vs_foods', 'foods');
          migrate('vs_exercises', 'exercises');
          migrate('vs_weights', 'weights');
          migrate('vs_measurements', 'measurements');
      }

      // Check for App Update
      const lastVersion = localStorage.getItem('vs_app_version');
      if (lastVersion !== APP_VERSION) {
          setShowUpdateModal(true);
          localStorage.setItem('vs_app_version', APP_VERSION);
      }

    } catch (e) {
      console.error("Initialization Error:", e);
      // Fallback
      setProfiles([INITIAL_PROFILE]);
      setCurrentProfileId(DEFAULT_PROFILE_ID);
    }
    setIsInitialized(true);
  }, []);

  // 2. Load Data when Current Profile Changes
  useEffect(() => {
    if (!currentProfileId || !isInitialized) return;

    saveToStorage('vs_active_id', currentProfileId);

    const load = (key: string, setter: any) => {
        try {
          const data = localStorage.getItem(`vs_${key}_${currentProfileId}`);
          if (data) setter(JSON.parse(data));
          else setter([]);
        } catch (e) {
          console.error(`Error loading ${key}:`, e);
          setter([]);
        }
    };

    load('foods', setFoods);
    load('exercises', setExercises);
    load('weights', setWeights);
    load('measurements', setMeasurements);

  }, [currentProfileId, isInitialized]);

  // 3. Save Data Effects (Save specific to profile ID)
  // We check isInitialized to avoid overwriting data with empty arrays during initial load
  useEffect(() => {
    if (isInitialized && currentProfileId) saveToStorage(`vs_foods_${currentProfileId}`, foods);
  }, [foods, currentProfileId, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentProfileId) saveToStorage(`vs_exercises_${currentProfileId}`, exercises);
  }, [exercises, currentProfileId, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentProfileId) saveToStorage(`vs_weights_${currentProfileId}`, weights);
  }, [weights, currentProfileId, isInitialized]);

  useEffect(() => {
    if (isInitialized && currentProfileId) saveToStorage(`vs_measurements_${currentProfileId}`, measurements);
  }, [measurements, currentProfileId, isInitialized]);

  // Save Profiles List
  useEffect(() => {
    if (isInitialized && profiles.length > 0) saveToStorage('vs_profiles', profiles);
  }, [profiles, isInitialized]);


  // Profile Management Handlers
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
      setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  const handleAddProfile = () => {
      const newId = `user_${Date.now()}`;
      const newProfile: UserProfile = {
          id: newId,
          name: "New User",
          gender: "female",
          age: 25,
          heightCm: 160
      };
      setProfiles(prev => [...prev, newProfile]);
      setCurrentProfileId(newId); // Switch to new user immediately
  };

  const handleSwitchProfile = (id: string) => {
      setCurrentProfileId(id);
      setDashboardDate(new Date()); // Reset date on profile switch
  };

  // Delete Handlers
  const handleDeleteFood = (id: string) => setFoods(prev => prev.filter(f => f.id !== id));
  const handleDeleteExercise = (id: string) => setExercises(prev => prev.filter(e => e.id !== id));
  const handleDeleteWeight = (id: string) => setWeights(prev => prev.filter(w => w.id !== id));
  const handleDeleteMeasurement = (id: string) => setMeasurements(prev => prev.filter(m => m.id !== id));

  // Derived Data for UI
  const currentProfile = useMemo(() => 
    profiles.find(p => p.id === currentProfileId) || INITIAL_PROFILE, 
  [profiles, currentProfileId]);

  // ---- "Today" Data (For Food/Exercise Modules logging context) ----
  const today = new Date().toLocaleDateString();
  const todayFoods = useMemo(() => 
    foods.filter(f => new Date(f.date).toLocaleDateString() === today),
  [foods, today]);
  const todayExercises = useMemo(() => 
    exercises.filter(e => new Date(e.date).toLocaleDateString() === today),
  [exercises, today]);

  // ---- "Dashboard" Data (For Viewing History) ----
  const dashboardDateStr = dashboardDate.toLocaleDateString();
  const dashboardFoods = useMemo(() => 
    foods.filter(f => new Date(f.date).toLocaleDateString() === dashboardDateStr),
  [foods, dashboardDateStr]);
  const dashboardExercises = useMemo(() => 
    exercises.filter(e => new Date(e.date).toLocaleDateString() === dashboardDateStr),
  [exercises, dashboardDateStr]);

  // Helper: Find weight on or before a specific date for accurate BMR history
  const getWeightForDate = (date: Date) => {
      if (weights.length === 0) return 70; // default
      // Sort weights ascending
      const sorted = [...weights].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      let applicableWeight = sorted[0].weight;
      // Find last entry before or on target
      for (let w of sorted) {
          if (new Date(w.date).getTime() <= endOfDay.getTime()) {
              applicableWeight = w.weight;
          } else {
              break;
          }
      }
      return applicableWeight;
  };
  
  const dashboardWeight = getWeightForDate(dashboardDate);
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 70; // For Body Module

  // BMR Calculation
  const calculateBMR = (p: UserProfile, w: number) => {
    let bmr = (10 * w) + (6.25 * p.heightCm) - (5 * p.age);
    if (p.gender === 'male') bmr += 5;
    else bmr -= 161;
    return bmr;
  };

  // Stats for "Today" (Used for historical graph aggregation if needed, or default)
  const todayBMR = calculateBMR(currentProfile, latestWeight);
  
  // Stats for "Dashboard View"
  const dashboardBMR = calculateBMR(currentProfile, dashboardWeight);
  const dashboardIntake = dashboardFoods.reduce((acc, curr) => acc + curr.calories, 0);
  const dashboardBurned = dashboardExercises.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
  const dashboardExerciseMins = dashboardExercises.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const dashboardStats: DailyStats = {
      date: dashboardDate.toISOString(),
      intake: dashboardIntake,
      burned: dashboardBurned,
      bmr: dashboardBMR,
      net: dashboardIntake - (dashboardBMR + dashboardBurned),
      exerciseMinutes: dashboardExerciseMins
  };

  const statsHistory: DailyStats[] = useMemo(() => {
    const map = new Map<string, DailyStats>();
    
    // Initialize map with foods
    foods.forEach(f => {
      const d = new Date(f.date).toLocaleDateString();
      if (!map.has(d)) map.set(d, { date: f.date, intake: 0, burned: 0, bmr: todayBMR, net: 0, exerciseMinutes: 0 }); // Note: BMR simplified here for history chart
      const entry = map.get(d)!;
      entry.intake += f.calories;
    });

    // Add exercises
    exercises.forEach(e => {
      const d = new Date(e.date).toLocaleDateString();
      if (!map.has(d)) map.set(d, { date: e.date, intake: 0, burned: 0, bmr: todayBMR, net: 0, exerciseMinutes: 0 });
      const entry = map.get(d)!;
      entry.burned += e.caloriesBurned;
      entry.exerciseMinutes += e.durationMinutes;
    });

    return Array.from(map.values()).map(s => ({
        ...s,
        net: s.intake - (s.bmr + s.burned)
    }));
  }, [foods, exercises, todayBMR]);

  if (statsHistory.length === 0) statsHistory.push(dashboardStats);

  // Exercise Notification Logic
  useEffect(() => {
    if (!currentProfile.exerciseReminderEnabled || !currentProfile.exerciseReminderTime) return;

    const checkReminder = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime === currentProfile.exerciseReminderTime) {
             const lastNotified = localStorage.getItem(`last_exercise_notification_${currentProfile.id}`);
             const todayStr = now.toDateString() + ':' + currentTime;
             
             // Ensure we only notify once per minute/day combo
             if (lastNotified !== todayStr) {
                 if ("Notification" in window && Notification.permission === "granted") {
                     new Notification("GetFit Time!", {
                         body: "It's time for your scheduled exercise routine! Let's get moving.",
                         icon: "/icon.png"
                     });
                 }
                 localStorage.setItem(`last_exercise_notification_${currentProfile.id}`, todayStr);
             }
        }
    };

    const interval = setInterval(checkReminder, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [currentProfile]);

  // View Rendering
  const renderView = () => {
    if (!isInitialized) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>;

    switch(currentView) {
      case 'dashboard':
        return <Dashboard 
          profile={currentProfile} 
          stats={dashboardStats} 
          todayExerciseCount={dashboardExercises.length} 
          onOpenSettings={() => setCurrentView('settings')}
          currentDate={dashboardDate}
          onDateChange={setDashboardDate}
        />;
      case 'food':
        return <FoodModule 
          entries={todayFoods} 
          onAddEntry={(f) => setFoods([...foods, f])}
          onDeleteEntry={handleDeleteFood} 
        />;
      case 'exercise':
         return <ExerciseModule 
            entries={todayExercises} 
            onAddEntry={(e) => setExercises([...exercises, e])} 
            onDeleteEntry={handleDeleteExercise}
            userProfile={currentProfile}
            onUpdateProfile={handleUpdateProfile}
         />;
      case 'body':
        return <BodyModule 
          measurements={measurements} 
          weights={weights} 
          currentWeight={latestWeight}
          onAddWeight={(w) => setWeights([...weights, w])}
          onAddMeasurement={(m) => setMeasurements([...measurements, m])}
          onDeleteWeight={handleDeleteWeight}
          onDeleteMeasurement={handleDeleteMeasurement}
        />;
      case 'stats':
        return <StatsModule 
            statsHistory={statsHistory} 
            foods={foods}
            exercises={exercises}
            weights={weights}
            measurements={measurements}
            onDeleteFood={handleDeleteFood}
            onDeleteExercise={handleDeleteExercise}
            onDeleteWeight={handleDeleteWeight}
            onDeleteMeasurement={handleDeleteMeasurement}
        />;
      case 'settings':
        return <ProfileSettings 
            currentProfile={currentProfile}
            allProfiles={profiles}
            onUpdateProfile={handleUpdateProfile}
            onSwitchProfile={handleSwitchProfile}
            onAddProfile={handleAddProfile}
            appVersion={APP_VERSION}
        />;
      default:
        return <Dashboard 
          profile={currentProfile} 
          stats={dashboardStats} 
          todayExerciseCount={dashboardExercises.length} 
          onOpenSettings={() => setCurrentView('settings')}
          currentDate={dashboardDate}
          onDateChange={setDashboardDate}
        />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
        {renderView()}
        
        {/* Update Notification Modal */}
        {showUpdateModal && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <Info size={32} />
                        </div>
                        <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">We've updated!</h3>
                    <div className="space-y-3 text-gray-600 text-sm">
                        <p>Welcome to version {APP_VERSION}. Here is what's new:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-semibold">Exercise Reminders:</span> Set a daily reminder to keep up with your routine.</li>
                            <li><span className="font-semibold">Rebranding:</span> We are now GetFit! Same great features, new name.</li>
                            <li>Enhanced performance and minor bug fixes.</li>
                        </ul>
                    </div>
                    <button 
                        onClick={() => setShowUpdateModal(false)}
                        className="w-full mt-6 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        )}
    </Layout>
  );
};

export default App;
