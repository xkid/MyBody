
import React, { useState } from 'react';
import { UserProfile, DailyStats } from '../types';
import { Activity, Flame, Utensils, TrendingUp, Settings, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  stats: DailyStats;
  todayExerciseCount: number;
  onOpenSettings: () => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  profile, 
  stats, 
  todayExerciseCount, 
  onOpenSettings,
  currentDate,
  onDateChange
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const caloriesRemaining = stats.net; 
  // We will assume 'stats.bmr' is the base burn.
  const totalBurned = stats.bmr + stats.burned;
  const balance = stats.intake - totalBurned; 
  
  // Color coding
  const isSurplus = balance > 0;

  // Date Helpers
  const isToday = new Date().toDateString() === currentDate.toDateString();
  
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const days = [];

      // Empty slots for previous month
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="h-8"></div>);
      }

      for (let d = 1; d <= daysInMonth; d++) {
          const isSelected = d === currentDate.getDate();
          const isTodayDate = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
          days.push(
              <button 
                key={d}
                onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setDate(d);
                    onDateChange(newDate);
                    setShowCalendar(false);
                }}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}
                    ${isTodayDate && !isSelected ? 'border border-blue-600 text-blue-600' : ''}
                `}
              >
                  {d}
              </button>
          );
      }
      return days;
  };
  
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 relative">
      <header className="flex justify-between items-center relative z-20">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Summary</h2>
          <div className="flex items-center space-x-1 mt-1 -ml-2">
            <button 
                onClick={handlePrevDay} 
                className="p-1 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
                <ChevronLeft size={28} />
            </button>
            
            <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center justify-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <h1 className="text-3xl font-bold text-gray-900 min-w-[100px] text-center">
                    {isToday ? "Today" : currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </h1>
                <CalendarIcon size={16} className="text-gray-400" />
            </button>

            <button 
                onClick={handleNextDay} 
                disabled={isToday}
                className={`p-1 rounded-full transition-colors ${isToday ? 'text-gray-200' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
            >
                <ChevronRight size={28} />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={onOpenSettings}
             className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
             aria-label="Profile Settings"
           >
             <Settings size={20} />
           </button>
        </div>
      </header>

      {/* Calendar Dropdown */}
      {showCalendar && (
          <div className="absolute top-20 left-6 right-6 bg-white rounded-3xl shadow-xl border border-gray-100 z-50 p-4 animate-in slide-in-from-top-5">
              <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-900 text-lg">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setShowCalendar(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-xs font-bold text-gray-400">{d}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1 place-items-center">
                  {renderCalendar()}
              </div>
          </div>
      )}

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
                    <p className="text-xs text-gray-500">{todayExerciseCount} sessions</p>
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
