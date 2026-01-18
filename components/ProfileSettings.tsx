
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { User, Plus, Check, Database, Download, Upload, Trash2, AlertTriangle, FileJson } from 'lucide-react';

interface ProfileSettingsProps {
  currentProfile: UserProfile;
  allProfiles: UserProfile[];
  onUpdateProfile: (p: UserProfile) => void;
  onSwitchProfile: (id: string) => void;
  onAddProfile: () => void;
  appVersion: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  currentProfile, 
  allProfiles, 
  onUpdateProfile,
  onSwitchProfile,
  onAddProfile,
  appVersion
}) => {
  const [formData, setFormData] = useState<UserProfile>(currentProfile);
  const [resetCode, setResetCode] = useState<string>('');
  const [userResetInput, setUserResetInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFormData(currentProfile);
  }, [currentProfile]);

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdateProfile(formData);
    alert("Profile updated!");
  };

  // Data Management Functions
  const handleExport = () => {
    const data: Record<string, any> = {};
    
    // 1. Gather App Data
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vs_')) {
            data[key] = localStorage.getItem(key);
        }
    }

    // 2. Add Metadata (using a non-vs key for backward compatibility with older import logic that filters for 'vs_')
    data['getfit_backup_meta'] = {
        version: appVersion,
        timestamp: new Date().toISOString(),
        platform: 'web',
        entryCount: Object.keys(data).length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `getfit_backup_v${appVersion.replace(/\./g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const jsonStr = event.target?.result as string;
            const backupData = JSON.parse(jsonStr);
            
            // Check for metadata
            const meta = backupData['getfit_backup_meta'];
            let confirmMsg = "This will overwrite your current data with the backup. Continue?";
            
            if (meta) {
                confirmMsg = `Found backup from version ${meta.version || 'Unknown'} (${new Date(meta.timestamp).toLocaleDateString()}).\n\nThis will overwrite your current data. Continue?`;
            }

            if (!window.confirm(confirmMsg)) {
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Perform Import
            // We only import keys starting with 'vs_' to ensure we only touch app data
            // This also naturally filters out the 'getfit_backup_meta' key
            let importCount = 0;
            
            // Optional: Clear existing app data to ensure clean state (prevent zombie data)
            // We collect keys to remove first to avoid modifying iterating collection
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('vs_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Restore keys
            Object.keys(backupData).forEach(key => {
                if (key.startsWith('vs_') && typeof backupData[key] === 'string') {
                    localStorage.setItem(key, backupData[key]);
                    importCount++;
                }
            });

            if (importCount > 0) {
                alert(`Successfully imported ${importCount} data items. The app will now reload to apply changes.`);
                window.location.reload();
            } else {
                alert("No valid data found in this file.");
            }

        } catch (error) {
            console.error(error);
            alert("Failed to parse backup file. Please ensure it is a valid JSON file.");
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const initiateReset = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setResetCode(code);
    setUserResetInput('');
    setShowResetModal(true);
  };

  const confirmReset = () => {
    if (userResetInput.toUpperCase() === resetCode) {
        localStorage.clear();
        alert("All data reset. The app will now reload.");
        window.location.reload();
    } else {
        alert("Incorrect confirmation code.");
    }
  };

  return (
    <div className="p-6 pb-32 space-y-8 animate-in fade-in slide-in-from-right-8">
      <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profiles</h1>
          <p className="text-gray-500 text-sm">Manage users and individual data.</p>
      </header>

      {/* Profile Switcher */}
      <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
        {allProfiles.map(p => (
            <button
                key={p.id}
                onClick={() => onSwitchProfile(p.id)}
                className={`flex flex-col items-center space-y-2 min-w-[80px] p-2 rounded-xl transition-all ${
                    p.id === currentProfile.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-100 opacity-70 hover:opacity-100'
                }`}
            >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${p.id === currentProfile.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <User size={20} />
                </div>
                <span className="text-xs font-bold truncate max-w-[80px]">{p.name}</span>
            </button>
        ))}
        
        <button
            onClick={onAddProfile}
            className="flex flex-col items-center space-y-2 min-w-[80px] p-2 rounded-xl border border-dashed border-gray-300 hover:bg-gray-50 transition-colors"
        >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                <Plus size={20} />
            </div>
            <span className="text-xs font-medium text-gray-500">Add New</span>
        </button>
      </div>

      <div className="border-t border-gray-100"></div>

      {/* Edit Form */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Details</h2>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">ID: {currentProfile.id.slice(-4)}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => handleChange('name', e.target.value)} 
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Age</label>
            <input 
              type="number" 
              value={formData.age} 
              onChange={e => handleChange('age', parseInt(e.target.value) || 0)} 
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Gender</label>
            <select 
              value={formData.gender} 
              onChange={e => handleChange('gender', e.target.value as 'male'|'female')} 
              className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900 appearance-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Height (cm)</label>
          <input 
            type="number" 
            value={formData.heightCm} 
            onChange={e => handleChange('heightCm', parseInt(e.target.value) || 0)} 
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-900"
          />
        </div>

        <button 
          onClick={handleSave} 
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center space-x-2"
        >
          <Check size={20} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="border-t border-gray-100"></div>

      {/* Data Management Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-gray-900">
            <Database size={24} className="text-gray-500" />
            <div>
                <h2 className="text-xl font-bold">Data Management</h2>
                <p className="text-xs text-gray-500">Backup and restore your health data.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
            <button 
                onClick={handleExport}
                className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
            >
                <Download size={20} />
                <span>Backup Data (JSON)</span>
            </button>
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-colors"
            >
                <Upload size={20} />
                <span>Restore from Backup</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            
            <button 
                onClick={initiateReset}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-semibold py-4 rounded-2xl flex items-center justify-center space-x-2 mt-2 transition-colors"
            >
                <Trash2 size={20} />
                <span>Factory Reset</span>
            </button>
        </div>
      </div>

      {/* Version Footer */}
      <div className="text-center py-8">
          <div className="flex justify-center items-center space-x-2 text-gray-300 mb-1">
              <FileJson size={14} />
              <span className="text-xs font-mono">{appVersion}</span>
          </div>
          <p className="text-[10px] text-gray-300">GetFit Health Tracker</p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Factory Reset</h3>
                    <p className="text-sm text-gray-500 mt-2">This will wipe ALL data from this device locally. This action cannot be undone.</p>
                </div>
                
                <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded-xl text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Type this code to confirm</p>
                        <p className="text-2xl font-mono font-black text-gray-900 tracking-widest mt-1 select-all">{resetCode}</p>
                    </div>
                    
                    <input 
                        type="text" 
                        value={userResetInput}
                        onChange={e => setUserResetInput(e.target.value)}
                        placeholder="Enter code"
                        className="w-full text-center text-xl font-bold p-3 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none uppercase"
                    />
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button 
                            onClick={() => setShowResetModal(false)}
                            className="w-full py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmReset}
                            disabled={userResetInput.toUpperCase() !== resetCode}
                            className="w-full py-3 font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-xl"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
