import React from 'react';
import { UserProfile, DailyStats } from '../types';
import { Activity, Flame, Utensils, TrendingUp, Settings } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  stats: DailyStats;
  todayExerciseCount: number;
  onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, stats, todayExerciseCount, onOpenSettings }) => {
  const caloriesRemaining = stats.net; 
  // We will assume 'stats.bmr' is the base burn.
  const totalBurned = stats.bmr + stats.burned;
  const balance = stats.intake - totalBurned; 
  
  // Color coding
  const isSurplus = balance > 0;
  
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</h2>
          <h1 className="text-3xl font-bold text-gray-900">Today</h1>
        </div>
        <div className="flex items-center space-x-3">
           <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
           </div>
           <button 
             onClick={onOpenSettings}
             className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
             aria-label="Profile Settings"
           >
             <Settings size={20} />
           </button>
        </div>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 border border-gray-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-2 h-full ${isSurplus ? 'bg-orange-500' : 'bg-green-500'}`}></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Calories Net</p>
            <div className="flex items-baseline space-x-1">
              <span className={`text-4xl font-bold ${isSurplus ? 'text-orange-600' : 'text-green-600'}`}>
                {Math.abs(Math.round(balance))}
              </span>
              <span className="text-gray-400 font-medium">kcal {isSurplus ? 'surplus' : 'deficit'}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-full">
            <TrendingUp className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <Utensils size={16} className="text-green-600" />
                    <span className="text-xs font-bold text-green-700 uppercase">Intake</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{Math.round(stats.intake)}</p>
                <p className="text-xs text-gray-500">kcal consumed</p>
            </div>
            
            <div className="bg-orange-50 rounded-2xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                    <Flame size={16} className="text-orange-600" />
                    <span className="text-xs font-bold text-orange-700 uppercase">Output</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{Math.round(totalBurned)}</p>
                <p className="text-xs text-gray-500">kcal burned</p>
            </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Activity Breakdown</h3>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <Activity size={24} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900">Resting (BMR)</p>
                    <p className="text-xs text-gray-500">Basal metabolic rate</p>
                </div>
            </div>
            <span className="font-bold text-gray-700">{Math.round(stats.bmr)} <span className="text-xs font-normal text-gray-400">kcal</span></span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                    <Flame size={24} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900">Active Exercise</p>
                    <p className="text-xs text-gray-500">{todayExerciseCount} sessions today</p>
                </div>
            </div>
            <div className="text-right">
                <span className="block font-bold text-gray-700">{Math.round(stats.burned)} <span className="text-xs font-normal text-gray-400">kcal</span></span>
                <span className="text-xs text-gray-400">{stats.exerciseMinutes} mins</span>
            </div>
        </div>
      </div>
    </div>
  );
};