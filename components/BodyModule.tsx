import React, { useState } from 'react';
import { MeasurementEntry, WeightEntry, BodyMeasurements } from '../types';
import { Ruler, Scale, ChevronLeft, History, Check } from 'lucide-react';

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-8 mb-4 border-b border-gray-100 pb-2">{children}</h3>
);

const InputGroup = ({ label, value, onChange, lastValue }: { label: string, value: number, onChange: (v: string) => void, lastValue?: number }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100">
        <label className="text-gray-900 font-semibold text-lg">{label}</label>
        <div className="flex items-center space-x-2">
            <input 
                type="number" 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                placeholder={lastValue !== undefined ? `${lastValue}` : "0"}
                className={`w-28 text-right text-xl font-bold outline-none bg-transparent transition-colors ${
                    !value && lastValue !== undefined ? 'placeholder:text-red-400' : 'text-gray-900 placeholder:text-gray-300'
                }`}
            />
            <span className="text-gray-400 text-sm font-medium w-6">cm</span>
        </div>
    </div>
);

const DualInputGroup = ({ label, left, right, onChangeLeft, onChangeRight, lastLeft, lastRight }: { 
  label: string; 
  left: number; 
  right: number; 
  onChangeLeft: (v: string) => void; 
  onChangeRight: (v: string) => void;
  lastLeft?: number;
  lastRight?: number;
}) => (
    <div className="py-4 border-b border-gray-100">
        <div className="flex justify-between mb-3">
            <label className="text-gray-900 font-semibold text-lg">{label}</label>
        </div>
        <div className="flex space-x-6">
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 flex justify-between items-center relative">
                <span className="text-xs font-bold text-gray-400 uppercase absolute top-2 left-3">Left</span>
                <input 
                    type="number" 
                    value={left || ''} 
                    onChange={e => onChangeLeft(e.target.value)} 
                    placeholder={lastLeft !== undefined ? `${lastLeft}` : "0"}
                    className={`w-full text-right bg-transparent outline-none text-xl font-bold mt-4 ${
                         !left && lastLeft !== undefined ? 'placeholder:text-red-400' : 'text-gray-900 placeholder:text-gray-300'
                    }`}
                />
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 flex justify-between items-center relative">
                <span className="text-xs font-bold text-gray-400 uppercase absolute top-2 left-3">Right</span>
                <input 
                    type="number" 
                    value={right || ''} 
                    onChange={e => onChangeRight(e.target.value)} 
                    placeholder={lastRight !== undefined ? `${lastRight}` : "0"}
                    className={`w-full text-right bg-transparent outline-none text-xl font-bold mt-4 ${
                         !right && lastRight !== undefined ? 'placeholder:text-red-400' : 'text-gray-900 placeholder:text-gray-300'
                    }`} 
                />
            </div>
        </div>
    </div>
);

interface BodyModuleProps {
  measurements: MeasurementEntry[];
  weights: WeightEntry[];
  currentWeight: number;
  onAddMeasurement: (m: MeasurementEntry) => void;
  onAddWeight: (w: WeightEntry) => void;
}

export const BodyModule: React.FC<BodyModuleProps> = ({ 
  measurements, 
  weights, 
  currentWeight,
  onAddMeasurement, 
  onAddWeight 
}) => {
  const [activeTab, setActiveTab] = useState<'weight' | 'measure'>('weight');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddMeasure, setShowAddMeasure] = useState(false);
  
  // Weight Form
  const [newWeight, setNewWeight] = useState('');

  // Measurement Form
  const [measureForm, setMeasureForm] = useState<BodyMeasurements>({
    bust: 0, waist: 0, tummy: 0, hips: 0,
    thighRight: 0, thighLeft: 0,
    armRight: 0, armLeft: 0,
    calfRight: 0, calfLeft: 0
  });

  const getLastMeasurements = () => {
    return measurements.length > 0 ? measurements[measurements.length - 1].measurements : undefined;
  };
  const lastMeas = getLastMeasurements();

  const handleSaveWeight = () => {
    if (!newWeight) return;
    onAddWeight({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight: parseFloat(newWeight)
    });
    setNewWeight('');
    setShowAddWeight(false);
  };

  const handleSaveMeasurement = () => {
    onAddMeasurement({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      measurements: measureForm,
      syncedWeight: currentWeight
    });
    setShowAddMeasure(false);
    // Reset form to 0 or keep last values? Usually reset implies new entry.
    setMeasureForm({
        bust: 0, waist: 0, tummy: 0, hips: 0,
        thighRight: 0, thighLeft: 0,
        armRight: 0, armLeft: 0,
        calfRight: 0, calfLeft: 0
    });
  };

  const handleMeasureChange = (field: keyof BodyMeasurements, value: string) => {
    setMeasureForm(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="p-6 pb-32 space-y-6">
       <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Body & Stats</h1>
      </header>

      {/* Toggle */}
      <div className="bg-gray-100 p-1 rounded-xl flex">
        <button 
          onClick={() => setActiveTab('weight')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'weight' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Weight Tracker
        </button>
        <button 
           onClick={() => setActiveTab('measure')}
           className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'measure' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Measurements
        </button>
      </div>

      {activeTab === 'weight' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-200">
                <p className="text-blue-100 font-medium mb-1">Current Weight</p>
                <div className="flex items-baseline space-x-2">
                    <span className="text-5xl font-bold">{currentWeight > 0 ? currentWeight : '--'}</span>
                    <span className="text-xl opacity-80">kg</span>
                </div>
                <button 
                    onClick={() => setShowAddWeight(true)}
                    className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                    <Scale size={20} />
                    <span>Log Weight</span>
                </button>
            </div>

            <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <History size={18} />
                    <span>History</span>
                </h3>
                {weights.slice().reverse().map(w => (
                    <div key={w.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                        <span className="text-gray-500">{new Date(w.date).toLocaleDateString()}</span>
                        <span className="font-bold text-gray-900">{w.weight} kg</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'measure' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <button 
                onClick={() => setShowAddMeasure(true)}
                className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2 transition-all"
            >
                <Ruler size={20} />
                <span>New Measurement</span>
            </button>

            <div className="space-y-4">
                {measurements.slice().reverse().map(m => (
                    <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <span className="text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</span>
                            {m.syncedWeight && <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">Synced: {m.syncedWeight}kg</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <div className="flex justify-between"><span>Bust</span> <span className="font-semibold">{m.measurements.bust}</span></div>
                            <div className="flex justify-between"><span>Waist</span> <span className="font-semibold">{m.measurements.waist}</span></div>
                            <div className="flex justify-between"><span>Hips</span> <span className="font-semibold">{m.measurements.hips}</span></div>
                            <div className="flex justify-between"><span>Tummy</span> <span className="font-semibold">{m.measurements.tummy}</span></div>
                            
                            <div className="col-span-2 border-t border-dashed border-gray-200 my-1"></div>
                            
                            <div className="flex justify-between text-xs text-gray-500 uppercase tracking-wider col-span-2"><span>Left</span> <span>Right</span></div>
                            
                            <div className="flex justify-between items-center col-span-2">
                                <span className="font-semibold">{m.measurements.thighLeft}</span>
                                <span className="text-gray-400 text-xs">Thighs</span>
                                <span className="font-semibold">{m.measurements.thighRight}</span>
                            </div>
                             <div className="flex justify-between items-center col-span-2">
                                <span className="font-semibold">{m.measurements.armLeft}</span>
                                <span className="text-gray-400 text-xs">Arms</span>
                                <span className="font-semibold">{m.measurements.armRight}</span>
                            </div>
                             <div className="flex justify-between items-center col-span-2">
                                <span className="font-semibold">{m.measurements.calfLeft}</span>
                                <span className="text-gray-400 text-xs">Calves</span>
                                <span className="font-semibold">{m.measurements.calfRight}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Full Screen Weight Modal */}
      {showAddWeight && (
         <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                <button onClick={() => setShowAddWeight(false)} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100"><ChevronLeft size={24}/></button>
                <h2 className="text-lg font-bold">Log Weight</h2>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <label className="text-gray-500 font-bold uppercase tracking-wider mb-4">Weight (kg)</label>
                <input 
                    type="number" 
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder={currentWeight ? `${currentWeight}` : "0"}
                    autoFocus
                    className={`w-full text-center text-6xl font-black bg-transparent outline-none transition-colors ${
                        !newWeight && currentWeight ? 'placeholder:text-red-400' : 'text-gray-900 placeholder:text-gray-200'
                    }`}
                />
            </div>

            <div className="p-6 safe-area-bottom">
                <button 
                    onClick={handleSaveWeight} 
                    disabled={!newWeight}
                    className="w-full bg-blue-600 disabled:bg-gray-300 hover:bg-blue-700 text-white rounded-2xl font-bold py-4 text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                    <Check size={24} />
                    <span>Save Weight</span>
                </button>
            </div>
         </div>
      )}

      {/* Full Screen Measurement Modal */}
      {showAddMeasure && (
         <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom-5">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                 <button onClick={() => setShowAddMeasure(false)} className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100"><ChevronLeft size={24}/></button>
                 <h2 className="text-lg font-bold">New Measurements</h2>
                 <div className="w-10"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
                <div className="p-4 bg-gray-50 rounded-2xl mb-6 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Weight at this moment</span>
                    <span className="text-lg font-bold text-gray-900">{currentWeight} kg</span>
                </div>

                <SectionTitle>Core (cm)</SectionTitle>
                <InputGroup label="Bust" value={measureForm.bust} onChange={v => handleMeasureChange('bust', v)} lastValue={lastMeas?.bust} />
                <InputGroup label="Waist" value={measureForm.waist} onChange={v => handleMeasureChange('waist', v)} lastValue={lastMeas?.waist} />
                <InputGroup label="Tummy" value={measureForm.tummy} onChange={v => handleMeasureChange('tummy', v)} lastValue={lastMeas?.tummy} />
                <InputGroup label="Hips" value={measureForm.hips} onChange={v => handleMeasureChange('hips', v)} lastValue={lastMeas?.hips} />

                <SectionTitle>Limbs (cm)</SectionTitle>
                <DualInputGroup label="Thigh" 
                    left={measureForm.thighLeft} right={measureForm.thighRight}
                    onChangeLeft={v => handleMeasureChange('thighLeft', v)}
                    onChangeRight={v => handleMeasureChange('thighRight', v)}
                    lastLeft={lastMeas?.thighLeft} lastRight={lastMeas?.thighRight}
                />
                <DualInputGroup label="Arm" 
                    left={measureForm.armLeft} right={measureForm.armRight}
                    onChangeLeft={v => handleMeasureChange('armLeft', v)}
                    onChangeRight={v => handleMeasureChange('armRight', v)}
                    lastLeft={lastMeas?.armLeft} lastRight={lastMeas?.armRight}
                />
                <DualInputGroup label="Calf" 
                    left={measureForm.calfLeft} right={measureForm.calfRight}
                    onChangeLeft={v => handleMeasureChange('calfLeft', v)}
                    onChangeRight={v => handleMeasureChange('calfRight', v)}
                    lastLeft={lastMeas?.calfLeft} lastRight={lastMeas?.calfRight}
                />
                <div className="h-10"></div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white safe-area-bottom">
                <button 
                    onClick={handleSaveMeasurement} 
                    className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl py-4 font-bold text-lg shadow-lg flex items-center justify-center space-x-2"
                >
                    <Check size={24} />
                    <span>Save All</span>
                </button>
            </div>
         </div>
      )}
    </div>
  );
};