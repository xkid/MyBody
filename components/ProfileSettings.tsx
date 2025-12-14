import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Plus, Check } from 'lucide-react';

interface ProfileSettingsProps {
  currentProfile: UserProfile;
  allProfiles: UserProfile[];
  onUpdateProfile: (p: UserProfile) => void;
  onSwitchProfile: (id: string) => void;
  onAddProfile: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  currentProfile, 
  allProfiles, 
  onUpdateProfile,
  onSwitchProfile,
  onAddProfile
}) => {
  // Local state for the form to avoid excessive re-renders/saves on every keystroke
  const [formData, setFormData] = useState<UserProfile>(currentProfile);

  // Sync form data if currentProfile changes (e.g. after switch)
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
    </div>
  );
};