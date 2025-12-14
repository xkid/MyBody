import React, { useState, useMemo } from 'react';
import { FixDepositEntry } from '../types';
import { Plus, ChevronLeft, ChevronRight, Calendar, List, TrendingUp, X, Landmark, Receipt, Check, PiggyBank } from 'lucide-react';

interface FixDepositModuleProps {
  entries: FixDepositEntry[];
  onAddEntry: (entry: FixDepositEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const FixDepositModule: React.FC<FixDepositModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'annual'>('calendar');
  const [isAdding, setIsAdding] = useState(false);
  
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Form State
  const [bankName, setBankName] = useState('');
  const [slipNumber, setSlipNumber] = useState('');
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [maturityDate, setMaturityDate] = useState('');
  const [dividend, setDividend] = useState('');

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const days = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const grid = [];

    // Empty cells for offset
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days
    for (let d = 1; d <= days; d++) {
      const dateStr = new Date(year, month, d).toDateString();
      const isSelected = selectedDate?.toDateString() === dateStr;
      
      // Check if any FD matures on this day
      const maturingFDs = entries.filter(e => new Date(e.maturityDate).toDateString() === dateStr);
      const hasMaturity = maturingFDs.length > 0;
      
      grid.push(
        <button
          key={d}
          onClick={() => setSelectedDate(new Date(year, month, d))}
          className={`h-10 w-full flex flex-col items-center justify-center rounded-lg relative transition-all ${
            isSelected 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className={`text-sm ${hasMaturity && !isSelected ? 'font-bold' : ''}`}>{d}</span>
          {hasMaturity && (
            <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-green-500'}`}></div>
          )}
        </button>
      );
    }
    return grid;
  };

  // --- DATA DERIVATION ---
  const selectedDateFDs = useMemo(() => {
    if (!selectedDate) return [];
    const target = selectedDate.toDateString();
    return entries.filter(e => new Date(e.maturityDate).toDateString() === target);
  }, [selectedDate, entries]);

  const annualStats = useMemo(() => {
    const stats: Record<string, number> = {};
    entries.forEach(e => {
        const year = new Date(e.maturityDate).getFullYear().toString();
        stats[year] = (stats[year] || 0) + e.dividend;
    });
    return Object.entries(stats).sort((a,b) => parseInt(b[0]) - parseInt(a[0])); // Descending years
  }, [entries]);

  // --- FORM HANDLERS ---
  const handleAutoCalcDividend = () => {
    if (principal && rate && startDate && maturityDate) {
        const p = parseFloat(principal);
        const r = parseFloat(rate);
        const start = new Date(startDate);
        const end = new Date(maturityDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Simple Interest Formula: P * R * T(in years) / 100
        const estDividend = (p * r * (diffDays / 365)) / 100;
        setDividend(estDividend.toFixed(2));
    }
  };

  const handleSave = () => {
    if (!bankName || !slipNumber || !principal || !maturityDate) return;
    
    onAddEntry({
        id: Date.now().toString(),
        bankName,
        slipNumber,
        principal: parseFloat(principal),
        interestRate: parseFloat(rate) || 0,
        startDate,
        maturityDate,
        dividend: parseFloat(dividend) || 0
    });
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setBankName('');
    setSlipNumber('');
    setPrincipal('');
    setRate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setMaturityDate('');
    setDividend('');
  };

  return (
    <div className="p-6 pb-32 space-y-6">
       <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Fixed Deposits</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-900 hover:bg-black text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* View Toggle */}
      <div className="bg-gray-100 p-1 rounded-xl flex">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg flex items-center justify-center space-x-1 transition-all ${
            viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}
        >
          <Calendar size={14} /> <span>Calendar</span>
        </button>
        <button 
           onClick={() => setViewMode('list')}
           className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg flex items-center justify-center space-x-1 transition-all ${
            viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}
        >
          <List size={14} /> <span>List</span>
        </button>
        <button 
           onClick={() => setViewMode('annual')}
           className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg flex items-center justify-center space-x-1 transition-all ${
            viewMode === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'
          }`}
        >
          <TrendingUp size={14} /> <span>Annual</span>
        </button>
      </div>

      {/* --- CALENDAR VIEW --- */}
      {viewMode === 'calendar' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            {/* Calendar Widget */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-50 rounded-full"><ChevronLeft size={20}/></button>
                    <span className="font-bold text-lg text-gray-900">
                        {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-gray-50 rounded-full"><ChevronRight size={20}/></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S','M','T','W','T','F','S'].map((d,i) => (
                        <span key={i} className="text-xs font-bold text-gray-400">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>
            </div>

            {/* Selected Date Details */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    {selectedDate ? `Maturing on ${selectedDate.toLocaleDateString()}` : 'Select a date'}
                </h3>
                
                {selectedDateFDs.length > 0 ? (
                    selectedDateFDs.map(fd => (
                        <div key={fd.id} className="bg-white p-4 rounded-2xl border-l-4 border-green-500 shadow-sm relative group">
                             <button 
                                onClick={() => onDeleteEntry(fd.id)}
                                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1"
                             >
                                <X size={16} />
                            </button>
                            <div className="flex items-center space-x-3 mb-2">
                                <Landmark size={20} className="text-gray-400"/>
                                <span className="font-bold text-gray-900 text-lg">{fd.bankName}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Slip Number</p>
                                    <p className="font-medium text-gray-800">{fd.slipNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Principal</p>
                                    <p className="font-medium text-gray-800">{fd.principal.toLocaleString()}</p>
                                </div>
                                <div className="col-span-2 bg-green-50 p-2 rounded-lg flex justify-between items-center">
                                    <span className="text-green-700 font-medium">Dividend Return</span>
                                    <span className="font-bold text-green-700">+{fd.dividend.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <PiggyBank size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No deposits maturing on this date.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             {entries.length === 0 ? (
                 <div className="text-center py-10 text-gray-400">No active deposits found.</div>
             ) : (
                 entries.slice().sort((a,b) => new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime()).map(fd => (
                    <div key={fd.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
                         <button 
                            onClick={() => onDeleteEntry(fd.id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1"
                         >
                            <X size={16} />
                        </button>
                        <div className="flex justify-between items-start mb-3 pr-8">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{fd.bankName}</h3>
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                    <Receipt size={12} className="mr-1"/> Slip: {fd.slipNumber}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-xl">{fd.principal.toLocaleString()}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{fd.interestRate}% p.a.</span>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400">Maturity Date</span>
                                <span className="font-medium text-gray-800 flex items-center">
                                    <Calendar size={14} className="mr-1 text-blue-500"/>
                                    {new Date(fd.maturityDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-xs text-gray-400">Expected Dividend</span>
                                <span className="font-bold text-green-600">+{fd.dividend.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                 ))
             )}
        </div>
      )}

      {/* --- ANNUAL STATS VIEW --- */}
      {viewMode === 'annual' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-200">
                <p className="text-blue-100 font-medium mb-1">Total Dividends (All Time)</p>
                <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold">
                        {entries.reduce((acc, curr) => acc + curr.dividend, 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Yearly Breakdown</h3>
            <div className="space-y-3">
                {annualStats.map(([year, total]) => (
                    <div key={year} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold">
                                {year}
                            </div>
                            <span className="text-gray-500 text-sm">Maturity Year</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg">+{total.toLocaleString()}</span>
                    </div>
                ))}
                {annualStats.length === 0 && <div className="text-center text-gray-400 py-4">No data available.</div>}
            </div>
        </div>
      )}

      {/* --- ADD MODAL --- */}
      {isAdding && (
         <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                <button onClick={() => setIsAdding(false)} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100"><ChevronLeft size={24}/></button>
                <h2 className="text-lg font-bold">New Deposit</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Bank Name</label>
                    <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. DBS, Maybank" className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Slip Number</label>
                    <input type="text" value={slipNumber} onChange={e => setSlipNumber(e.target.value)} placeholder="FD-12345678" className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Principal</label>
                        <input type="number" value={principal} onBlur={handleAutoCalcDividend} onChange={e => setPrincipal(e.target.value)} placeholder="0.00" className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Rate (%)</label>
                        <input type="number" value={rate} onBlur={handleAutoCalcDividend} onChange={e => setRate(e.target.value)} placeholder="3.5" className="w-full p-4 bg-gray-50 rounded-2xl text-lg font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Start Date</label>
                        <input type="date" value={startDate} onBlur={handleAutoCalcDividend} onChange={e => setStartDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Maturity Date</label>
                        <input type="date" value={maturityDate} onBlur={handleAutoCalcDividend} onChange={e => setMaturityDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl text-base font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all"/>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-green-600 uppercase tracking-wide mb-2 flex justify-between">
                        <span>Expected Dividend</span>
                        <span className="text-xs text-gray-400 font-normal normal-case">Auto-calculated</span>
                    </label>
                    <input type="number" value={dividend} onChange={e => setDividend(e.target.value)} placeholder="0.00" className="w-full p-4 bg-green-50 text-green-800 rounded-2xl text-xl font-bold outline-none border border-green-100 focus:ring-2 focus:ring-green-500 transition-all"/>
                </div>
            </div>

            <div className="p-6 safe-area-bottom border-t border-gray-100 bg-white">
                <button 
                    onClick={handleSave} 
                    disabled={!bankName || !slipNumber || !principal || !maturityDate}
                    className="w-full bg-blue-900 hover:bg-black disabled:bg-gray-300 text-white rounded-2xl font-bold py-4 text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                    <Check size={24} />
                    <span>Save Deposit Record</span>
                </button>
            </div>
         </div>
      )}
    </div>
  );
};