import React, { useState } from 'react';
import { MeasurementEntry, WeightEntry, BodyMeasurements } from '../types';
import { Ruler, Scale, ChevronRight, History } from 'lucide-react';

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">{children}</h3>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void, children?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <label className="text-gray-700 font-medium">{label}</label>
        <div className="flex items-center space-x-2">
            <input 
                type="number" 
                value={value || ''} 
                onChange={e => onChange(e.target.value)} 
                placeholder="0"
                className="w-20 text-right font-bold text-gray-900 focus:text-blue-600 outline-none bg-transparent"
            />
            <span className="text-gray-400 text-sm">cm</span>
        </div>
    </div>
);

const DualInputGroup = ({ label, left, right, onChangeLeft, onChangeRight }: { 
  label: string; 
  left: number; 
  right: number; 
  onChangeLeft: (v: string) => void; 
  onChangeRight: (v: string) => void;
  children?: React.ReactNode; 
}) => (
    <div className="py-2 border-b border-gray-100">
        <div className="flex justify-between mb-1">
            <label className="text-gray-700 font-medium">{label}</label>
        </div>
        <div className="flex space-x-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-2 flex justify-between items-center">
                <span className="text-xs text-gray-400">L</span>
                <input type="number" value={left || ''} onChange={e => onChangeLeft(e.target.value)} className="w-full text-right bg-transparent outline-none font-semibold" placeholder="0" />
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-2 flex justify-between items-center">
                <span className="text-xs text-gray-400">R</span>
                <input type="number" value={right || ''} onChange={e => onChangeRight(e.target.value)} className="w-full text-right bg-transparent outline-none font-semibold" placeholder="0" />
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
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center space-x-2"
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

      {/* Weight Modal */}
      {showAddWeight && (
         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-4">Log Weight</h2>
                <input 
                    type="number" 
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    placeholder="kg"
                    className="w-full text-center text-4xl font-bold border-b-2 border-gray-200 focus:border-blue-500 outline-none py-4 mb-6"
                    autoFocus
                />
                <div className="flex space-x-3">
                    <button onClick={() => setShowAddWeight(false)} className="flex-1 py-3 text-gray-600 font-medium">Cancel</button>
                    <button onClick={handleSaveWeight} className="flex-1 bg-blue-600 text-white rounded-xl font-bold py-3">Save</button>
                </div>
            </div>
         </div>
      )}

      {/* Measurement Modal */}
      {showAddMeasure && (
         <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
                     <h2 className="text-xl font-bold">New Measurements</h2>
                     <button onClick={() => setShowAddMeasure(false)} className="text-gray-400">Cancel</button>
                </div>
                
                <div className="space-y-6 pb-20">
                    <div className="p-4 bg-gray-50 rounded-xl mb-4 border border-gray-100">
                        <span className="text-sm text-gray-500 block mb-1">Current Synced Weight</span>
                        <span className="text-lg font-bold text-gray-900">{currentWeight} kg</span>
                    </div>

                    <SectionTitle>Core</SectionTitle>
                    <InputGroup label="Bust" value={measureForm.bust} onChange={v => handleMeasureChange('bust', v)} />
                    <InputGroup label="Waist" value={measureForm.waist} onChange={v => handleMeasureChange('waist', v)} />
                    <InputGroup label="Tummy" value={measureForm.tummy} onChange={v => handleMeasureChange('tummy', v)} />
                    <InputGroup label="Hips" value={measureForm.hips} onChange={v => handleMeasureChange('hips', v)} />

                    <SectionTitle>Limbs (Left & Right)</SectionTitle>
                    <DualInputGroup label="Thigh" 
                        left={measureForm.thighLeft} right={measureForm.thighRight}
                        onChangeLeft={v => handleMeasureChange('thighLeft', v)}
                        onChangeRight={v => handleMeasureChange('thighRight', v)}
                    />
                    <DualInputGroup label="Arm" 
                        left={measureForm.armLeft} right={measureForm.armRight}
                        onChangeLeft={v => handleMeasureChange('armLeft', v)}
                        onChangeRight={v => handleMeasureChange('armRight', v)}
                    />
                    <DualInputGroup label="Calf" 
                        left={measureForm.calfLeft} right={measureForm.calfRight}
                        onChangeLeft={v => handleMeasureChange('calfLeft', v)}
                        onChangeRight={v => handleMeasureChange('calfRight', v)}
                    />
                </div>
                
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 sm:relative sm:border-0 sm:p-0">
                    <button onClick={handleSaveMeasurement} className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold">Save All</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};