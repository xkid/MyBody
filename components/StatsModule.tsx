
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { DailyStats, FoodEntry, ExerciseEntry, WeightEntry, MeasurementEntry } from '../types';
import { Utensils, Dumbbell, Ruler, Scale, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StatsModuleProps {
  statsHistory: DailyStats[];
  foods: FoodEntry[];
  exercises: ExerciseEntry[];
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  onDeleteFood: (id: string) => void;
  onDeleteExercise: (id: string) => void;
  onDeleteWeight: (id: string) => void;
  onDeleteMeasurement: (id: string) => void;
}

type Tab = 'overview' | 'food' | 'exercise' | 'weight' | 'body';
type Period = 'daily' | 'monthly' | 'annual';
type FoodViewMode = 'day' | 'week' | 'month';

export const StatsModule: React.FC<StatsModuleProps> = ({ 
    statsHistory, foods, exercises, weights, measurements,
    onDeleteFood, onDeleteExercise, onDeleteWeight, onDeleteMeasurement
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period>('daily');
  
  // Specific state for Food tab
  const [foodViewMode, setFoodViewMode] = useState<FoodViewMode>('day');
  const [foodViewDate, setFoodViewDate] = useState<Date>(new Date());

  // Date Helpers
  const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day; // adjust when day is sunday
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d;
  };

  const getEndOfWeek = (date: Date) => {
    const d = getStartOfWeek(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23,59,59,999);
    return d;
  };

  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  };

  // Helper to filter data by date range (for non-Food tabs)
  const filterByPeriod = (data: any[], dateKey: string = 'date') => {
      const now = new Date();
      return data.filter(item => {
          const d = new Date(item[dateKey]);
          if (period === 'daily') {
              // Last 30 days
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(now.getDate() - 30);
              return d >= thirtyDaysAgo;
          } else if (period === 'monthly') {
              // Last 12 months
              const oneYearAgo = new Date();
              oneYearAgo.setMonth(now.getMonth() - 12);
              return d >= oneYearAgo;
          } else {
              // All time (Annual view)
              return true;
          }
      }).sort((a,b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime()); // Descending for lists
  };

  // Food Tab Logic
  const getFoodDateRangeLabel = () => {
      if (foodViewMode === 'day') {
          return foodViewDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      } else if (foodViewMode === 'week') {
          const start = getStartOfWeek(foodViewDate);
          const end = getEndOfWeek(foodViewDate);
          return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      } else {
          return foodViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }
  };

  const navigateFoodDate = (direction: 'prev' | 'next') => {
      const d = new Date(foodViewDate);
      if (foodViewMode === 'day') {
          d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      } else if (foodViewMode === 'week') {
          d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
      } else {
          d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      }
      setFoodViewDate(d);
  };

  const getFilteredFoodsForView = useMemo(() => {
      let start, end;
      if (foodViewMode === 'day') {
          start = getStartOfDay(foodViewDate);
          end = getEndOfDay(foodViewDate);
      } else if (foodViewMode === 'week') {
          start = getStartOfWeek(foodViewDate);
          end = getEndOfWeek(foodViewDate);
      } else {
          start = getStartOfMonth(foodViewDate);
          end = getEndOfMonth(foodViewDate);
      }

      return foods.filter(f => {
          const d = new Date(f.date);
          return d >= start && d <= end;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [foods, foodViewMode, foodViewDate]);

  const getFoodChartData = useMemo(() => {
      if (foodViewMode === 'day') return [];

      const map = new Map<string, number>();
      let start = foodViewMode === 'week' ? getStartOfWeek(foodViewDate) : getStartOfMonth(foodViewDate);
      let end = foodViewMode === 'week' ? getEndOfWeek(foodViewDate) : getEndOfMonth(foodViewDate);
      
      // Initialize map with 0s
      let curr = new Date(start);
      while (curr <= end) {
          map.set(curr.toLocaleDateString(), 0);
          curr.setDate(curr.getDate() + 1);
      }

      getFilteredFoodsForView.forEach(f => {
          const d = new Date(f.date).toLocaleDateString();
          if (map.has(d)) {
              map.set(d, (map.get(d) || 0) + f.calories);
          }
      });

      return Array.from(map.entries()).map(([date, calories]) => ({
          date,
          shortDate: new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
          calories
      }));
  }, [getFilteredFoodsForView, foodViewMode, foodViewDate]);

  const totalFoodCalories = getFilteredFoodsForView.reduce((acc, curr) => acc + curr.calories, 0);

  // Global Chart Data
  const getChartData = () => {
    // Clone and sort ascending for charts
    const sorted = [...statsHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let filtered = sorted;
    
    if (period === 'daily') filtered = sorted.slice(-30);
    else if (period === 'monthly') filtered = sorted.slice(-365); 
    
    return filtered.map(d => ({
        ...d,
        shortDate: new Date(d.date).toLocaleDateString('en-US', period === 'daily' ? { weekday: 'short', day: 'numeric'} : { month: 'short', year: '2-digit' }),
        totalOutput: d.burned + d.bmr
    }));
  };

  const chartData = getChartData();
  const filteredExercises = filterByPeriod(exercises);
  const filteredWeights = filterByPeriod(weights);
  const filteredMeasurements = filterByPeriod(measurements);

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 active:scale-95 touch-manipulation ${
            activeTab === id ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100'
        }`}
      >
          <Icon size={16} />
          <span>{label}</span>
      </button>
  );

  return (
    <div className="p-6 pb-32 space-y-6 max-w-full overflow-x-hidden">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trends & Data</h1>
        
        {/* Period Toggle - Only show for non-food tabs to avoid confusion */}
        {activeTab !== 'food' && (
            <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-6">
                {(['daily', 'monthly', 'annual'] as Period[]).map(p => (
                    <button 
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all touch-manipulation ${
                            period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        )}

        {/* Module Tabs - Scrollable */}
        <div className="flex space-x-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
            <TabButton id="overview" label="Overview" icon={Calendar} />
            <TabButton id="food" label="Food" icon={Utensils} />
            <TabButton id="exercise" label="Exercise" icon={Dumbbell} />
            <TabButton id="weight" label="Weight" icon={Scale} />
            <TabButton id="body" label="Body" icon={Ruler} />
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-4 min-h-[300px]">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
                 {/* Calories Chart */}
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <h3 className="font-bold text-gray-900 mb-4">Calorie Balance</h3>
                    <div className="h-64 sm:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="shortDate" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    minTickGap={30}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="intake" name="Intake" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="totalOutput" name="Output" fill="#fb923c" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* FOOD TAB */}
        {activeTab === 'food' && (
            <div className="space-y-4">
                {/* Custom Food Navigation */}
                <div className="bg-gray-100 p-1.5 rounded-2xl flex mb-4">
                    {(['day', 'week', 'month'] as FoodViewMode[]).map(mode => (
                        <button 
                            key={mode}
                            onClick={() => setFoodViewMode(mode)}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all touch-manipulation ${
                                foodViewMode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-100 shadow-sm mb-4">
                    <button onClick={() => navigateFoodDate('prev')} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-gray-800">{getFoodDateRangeLabel()}</span>
                    <button onClick={() => navigateFoodDate('next')} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Summary */}
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-6">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Total Consumption</p>
                    <p className="text-2xl font-bold text-gray-900">{totalFoodCalories} <span className="text-sm font-normal text-gray-500">kcal</span></p>
                </div>

                {/* Chart for Week/Month */}
                {foodViewMode !== 'day' && (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">Consumption Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={getFoodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="shortDate" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 10, fill: '#9ca3af'}} 
                                        minTickGap={20}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="calories" name="Calories" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* List of Foods */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">
                        {foodViewMode === 'day' ? 'Meals' : 'Log Entries'}
                    </h3>
                    {getFilteredFoodsForView.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl">No records found for this period.</div>
                    ) : (
                        getFilteredFoodsForView.map(f => (
                            <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-bold text-gray-900 truncate">{f.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(f.date).toLocaleDateString()} {new Date(f.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <span className="font-bold text-green-600 whitespace-nowrap">{f.calories} kcal</span>
                                    {/* Only show delete in Day mode to avoid accidental mass deletion if we enabled checkboxes later, but consistent with current UX */}
                                    <button onClick={() => onDeleteFood(f.id)} className="text-gray-300 hover:text-red-500 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* EXERCISE TAB */}
        {activeTab === 'exercise' && (
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900">Activity Log</h3>
                <div className="space-y-3">
                    {filteredExercises.map(e => (
                        <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                            <div className="min-w-0 flex-1 pr-2">
                                <p className="font-bold text-gray-900 truncate">{e.name}</p>
                                <p className="text-xs text-gray-500">{new Date(e.date).toLocaleDateString()} • {e.durationMinutes} mins</p>
                            </div>
                            <div className="flex items-center space-x-4 flex-shrink-0">
                                <div className="text-right">
                                    <span className="block font-bold text-orange-600 whitespace-nowrap">{e.caloriesBurned} kcal</span>
                                    {e.steps && <span className="text-xs text-blue-500 whitespace-nowrap">{e.steps} steps</span>}
                                </div>
                                <button onClick={() => onDeleteExercise(e.id)} className="text-gray-300 hover:text-red-500 p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredExercises.length === 0 && <div className="text-center text-gray-400 py-10">No records found for this period.</div>}
                </div>
            </div>
        )}

        {/* WEIGHT TAB */}
        {activeTab === 'weight' && (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-64 sm:h-80 w-full overflow-hidden">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[...filteredWeights].reverse()}>
                            <defs>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(t) => new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric'})} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10}} 
                                minTickGap={40}
                            />
                            <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10}} width={30} />
                            <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} contentStyle={{ borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="weight" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">History</h3>
                    {filteredWeights.map(w => (
                        <div key={w.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                            <span className="text-gray-500">{new Date(w.date).toLocaleDateString()}</span>
                            <div className="flex items-center space-x-3">
                                <span className="font-bold text-gray-900 text-lg">{w.weight} kg</span>
                                <button onClick={() => onDeleteWeight(w.id)} className="text-gray-300 hover:text-red-500 p-1">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

         {/* BODY TAB */}
         {activeTab === 'body' && (
            <div className="space-y-4">
                 <h3 className="font-bold text-gray-900">Measurement Logs</h3>
                 {filteredMeasurements.map(m => (
                    <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative group">
                        <button 
                            onClick={() => onDeleteMeasurement(m.id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"
                        >
                            <X size={16} />
                        </button>
                        <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-2 pr-8">
                             <span className="font-bold text-gray-900">{new Date(m.date).toLocaleDateString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Waist</span> <span>{m.measurements.waist}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Hips</span> <span>{m.measurements.hips}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Bust</span> <span>{m.measurements.bust}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Thigh (L)</span> <span>{m.measurements.thighLeft}</span></div>
                        </div>
                    </div>
                 ))}
                 {filteredMeasurements.length === 0 && <div className="text-center text-gray-400 py-10">No records found for this period.</div>}
            </div>
         )}
      </div>
    </div>
  );
};
