
import React from 'react';
import { AppView } from '../types';
import { 
  LayoutDashboard, 
  Utensils, 
  Ruler, 
  BarChart2, 
  Dumbbell,
  Landmark
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const NavItem: React.FC<{ 
  view: AppView; 
  current: AppView; 
  icon: React.ReactNode; 
  label: string; 
  onClick: (v: AppView) => void 
}> = ({ view, current, icon, label, onClick }) => (
  <button
    onClick={() => onClick(view)}
    className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors min-w-[60px] ${
      current === view ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
        <div className="max-w-md mx-auto min-h-full bg-white sm:shadow-xl sm:border-x sm:border-gray-200">
           {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-md mx-auto h-16 px-2">
          <div className="flex justify-between items-center h-full overflow-x-auto no-scrollbar">
            <NavItem 
              view="dashboard" 
              current={currentView} 
              icon={<LayoutDashboard size={24} />} 
              label="Today" 
              onClick={onChangeView} 
            />
            <NavItem 
              view="food" 
              current={currentView} 
              icon={<Utensils size={24} />} 
              label="Food" 
              onClick={onChangeView} 
            />
            <NavItem 
              view="exercise" 
              current={currentView} 
              icon={<Dumbbell size={24} />} 
              label="Exercise" 
              onClick={onChangeView} 
            />
            <NavItem 
              view="body" 
              current={currentView} 
              icon={<Ruler size={24} />} 
              label="Body" 
              onClick={onChangeView} 
            />
            <NavItem 
              view="stats" 
              current={currentView} 
              icon={<BarChart2 size={24} />} 
              label="Stats" 
              onClick={onChangeView} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};