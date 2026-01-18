import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, Legend
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
type ViewMode = 'day' | 'week' | 'month';

// Helpers moved outside component to ensure correct type inference
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

const getFilterRange = (viewMode: ViewMode, viewDate: Date) => {
    let start, end;
    if (viewMode === 'day') {
        start = getStartOfDay(viewDate);
        end = getEndOfDay(viewDate);
    } else if (viewMode === 'week') {
        start = getStartOfWeek(viewDate);
        end = getEndOfWeek(viewDate);
    } else {
        start = getStartOfMonth(viewDate);
        end = getEndOfMonth(viewDate);
    }
    return { start, end };
};

const filterData = <T extends { date: string }>(data: T[], start: Date, end: Date): T[] => {
    return data.filter(item => {
        const d = new Date(item.date);
        return d >= start && d <= end;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const getAggregatedData = <T extends { date: string }>(
    data: T[], 
    valueKey: keyof T | ((item: T) => number),
    start: Date,
    end: Date,
    viewMode: ViewMode
) => {
    if (viewMode === 'day') return []; 

    const map = new Map<string, any>();
    let curr = new Date(start);
    
    // Initialize map
    while (curr <= end) {
        map.set(curr.toLocaleDateString(), { 
            date: curr.toLocaleDateString(),
            shortDate: new Date(curr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            value: 0 
        });
        curr.setDate(curr.getDate() + 1);
    }

    data.forEach(item => {
        const d = new Date(item.date);
        if (d >= start && d <= end) {
            const dateStr = d.toLocaleDateString();
            if (map.has(dateStr)) {
                const entry = map.get(dateStr);
                const val = typeof valueKey === 'function' ? valueKey(item) : (item[valueKey] as number);
                entry.value += val;
            }
        }
    });

    return Array.from(map.values());
};

export const StatsModule: React.FC<StatsModuleProps> = ({ 
    statsHistory, foods, exercises, weights, measurements,
    onDeleteFood, onDeleteExercise, onDeleteWeight, onDeleteMeasurement
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Unified Date State for all tabs
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [viewDate, setViewDate] = useState<Date>(new Date());

  const getDateRangeLabel = () => {
      if (viewMode === 'day') {
          return viewDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      } else if (viewMode === 'week') {
          const start = getStartOfWeek(viewDate);
          const end = getEndOfWeek(viewDate);
          return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      } else {
          return viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
      const d = new Date(viewDate);
      if (viewMode === 'day') {
          d.setDate(d.getDate() + (direction === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
          d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
      } else {
          d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      }
      setViewDate(d);
  };

  // Get current filter range
  const { start, end } = getFilterRange(viewMode, viewDate);

  // Specific Data filtering
  const filteredFoods = useMemo(() => filterData(foods, start, end), [foods, start, end]);
  const filteredExercises = useMemo(() => filterData(exercises, start, end), [exercises, start, end]);
  const filteredWeights = useMemo(() => filterData(weights, start, end), [weights, start, end]);
  const filteredMeasurements = useMemo(() => filterData(measurements, start, end), [measurements, start, end]);
  
  // Data for Charts
  const overviewChartData = useMemo(() => {
      const map = new Map<string, any>();
      let curr = new Date(start);
      while(curr <= end) {
          map.set(curr.toLocaleDateString(), {
              date: curr.toLocaleDateString(),
              shortDate: new Date(curr).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
              intake: 0,
              burned: 0
          });
          curr.setDate(curr.getDate() + 1);
      }
      
      statsHistory.forEach(s => {
          const d = new Date(s.date);
          if (d >= start && d <= end) {
              const dateStr = d.toLocaleDateString();
              if (map.has(dateStr)) {
                  const entry = map.get(dateStr);
                  entry.intake = s.intake;
                  entry.burned = s.burned + s.bmr;
              }
          }
      });
      return Array.from(map.values());
  }, [statsHistory, start, end]);

  const foodChartData = useMemo(() => getAggregatedData(foods, 'calories', start, end, viewMode), [foods, start, end, viewMode]);
  const exerciseChartData = useMemo(() => getAggregatedData(exercises, 'caloriesBurned', start, end, viewMode), [exercises, start, end, viewMode]);
  
  // Weight Line Chart Data (Non-aggregated, just chronological points)
  const weightChartData = useMemo(() => {
      // For line chart, we want chronological order
      return [...filteredWeights].reverse().map(w => ({
          ...w,
          shortDate: new Date(w.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      }));
  }, [filteredWeights]);

  // Body Line Chart Data
  const bodyChartData = useMemo(() => {
      return [...filteredMeasurements].reverse().map(m => ({
          ...m,
          shortDate: new Date(m.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
          waist: m.measurements.waist,
          hips: m.measurements.hips,
          bust: m.measurements.bust
      }));
  }, [filteredMeasurements]);


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
        
        {/* Date Navigation & View Mode */}
        <div className="space-y-4 mb-6">
            <div className="bg-gray-100 p-1.5 rounded-2xl flex">
                {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-xl transition-all touch-manipulation ${
                            viewMode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-gray-800">{getDateRangeLabel()}</span>
                <button onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-50 rounded-full text-gray-500">
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>

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
                 {/* Calories Chart - Only show if not single day view, or if we want to show a single bar? Usually range chart is better. */}
                 {viewMode !== 'day' ? (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <h3 className="font-bold text-gray-900 mb-4">Calorie Balance</h3>
                        <div className="h-64 sm:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={overviewChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <Bar dataKey="intake" name="Intake" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="burned" name="Total Output" fill="#fb923c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 ) : (
                     <div className="grid grid-cols-2 gap-4">
                         <div className="bg-green-50 p-4 rounded-2xl">
                             <p className="text-xs text-green-600 font-bold uppercase">Intake</p>
                             <p className="text-2xl font-bold text-gray-900">{Math.round(overviewChartData.reduce((acc, c) => acc + c.intake, 0))}</p>
                         </div>
                         <div className="bg-orange-50 p-4 rounded-2xl">
                             <p className="text-xs text-orange-600 font-bold uppercase">Output</p>
                             <p className="text-2xl font-bold text-gray-900">{Math.round(overviewChartData.reduce((acc, c) => acc + c.burned, 0))}</p>
                         </div>
                     </div>
                 )}
            </div>
        )}

        {/* FOOD TAB */}
        {activeTab === 'food' && (
            <div className="space-y-4">
                {/* Summary */}
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mb-6">
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">Total Consumption</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredFoods.reduce((acc, curr) => acc + curr.calories, 0)} <span className="text-sm font-normal text-gray-500">kcal</span></p>
                </div>

                {/* Chart for Week/Month */}
                {viewMode !== 'day' && (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">Consumption Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={foodChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <Bar dataKey="value" name="Calories" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* List of Foods */}
                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">
                        {viewMode === 'day' ? 'Meals' : 'Log Entries'}
                    </h3>
                    {filteredFoods.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl">No records found for this period.</div>
                    ) : (
                        filteredFoods.map(f => (
                            <div key={f.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-bold text-gray-900 truncate">{f.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(f.date).toLocaleDateString()} {new Date(f.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0">
                                    <span className="font-bold text-green-600 whitespace-nowrap">{f.calories} kcal</span>
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
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6 flex justify-between">
                    <div>
                        <p className="text-xs font-bold text-orange-700 uppercase mb-1">Total Burned</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredExercises.reduce((acc, curr) => acc + curr.caloriesBurned, 0)} <span className="text-sm font-normal text-gray-500">kcal</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-orange-700 uppercase mb-1">Total Minutes</p>
                        <p className="text-2xl font-bold text-gray-900">{filteredExercises.reduce((acc, curr) => acc + curr.durationMinutes, 0)} <span className="text-sm font-normal text-gray-500">min</span></p>
                    </div>
                </div>

                {viewMode !== 'day' && (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                        <h3 className="font-bold text-gray-900 mb-4">Activity Trend</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={exerciseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <Bar dataKey="value" name="Calories" fill="#fb923c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {filteredExercises.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl">No records found for this period.</div>
                    ) : (
                        filteredExercises.map(e => (
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
                        ))
                    )}
                </div>
            </div>
        )}

        {/* WEIGHT TAB */}
        {activeTab === 'weight' && (
            <div className="space-y-6">
                {viewMode !== 'day' && (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-64 sm:h-80 w-full overflow-hidden">
                        <h3 className="font-bold text-gray-900 mb-4">Weight Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="shortDate" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    minTickGap={20}
                                />
                                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} width={30} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r:4, fill:'#3b82f6'}} activeDot={{r:6}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="space-y-3">
                    <h3 className="font-bold text-gray-900">History</h3>
                    {filteredWeights.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl">No records found for this period.</div>
                    ) : (
                        filteredWeights.map(w => (
                            <div key={w.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                                <span className="text-gray-500">{new Date(w.date).toLocaleDateString()}</span>
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold text-gray-900 text-lg">{w.weight} kg</span>
                                    <button onClick={() => onDeleteWeight(w.id)} className="text-gray-300 hover:text-red-500 p-1">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

         {/* BODY TAB */}
         {activeTab === 'body' && (
            <div className="space-y-4">
                 {viewMode !== 'day' && (
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm h-64 sm:h-80 w-full overflow-hidden">
                        <h3 className="font-bold text-gray-900 mb-4">Measurements Trend</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="shortDate" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    minTickGap={20}
                                />
                                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} width={30} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="waist" name="Waist" stroke="#ec4899" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="hips" name="Hips" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="bust" name="Bust" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                 )}

                 <h3 className="font-bold text-gray-900">Measurement Logs</h3>
                 {filteredMeasurements.length === 0 ? (
                        <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl">No records found for this period.</div>
                 ) : (
                     filteredMeasurements.map(m => (
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
                     ))
                 )}
            </div>
         )}
      </div>
    </div>
  );
};