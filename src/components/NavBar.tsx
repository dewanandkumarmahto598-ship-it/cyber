import React from 'react';
import { Home, Search, PlusSquare, User } from 'lucide-react';
import { TabType, Profile } from '../types';

interface NavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  currentProfile?: Profile;
  sharedCount: number;
}

export const NavBar: React.FC<NavBarProps> = ({
  activeTab,
  onChangeTab,
  currentProfile,
  sharedCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg)]/95 backdrop-blur-md border-t border-[var(--ln)] transition-colors">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14 px-2">
        <button
          onClick={() => onChangeTab('home')}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors relative ${
            activeTab === 'home' ? 'text-[var(--tx)] font-semibold' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="Home Feed"
        >
          <Home className={`w-6 h-6 transition-transform ${activeTab === 'home' ? 'scale-110' : ''}`} />
          {activeTab === 'home' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--ac)]" />}
        </button>

        <button
          onClick={() => onChangeTab('explore')}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors relative ${
            activeTab === 'explore' ? 'text-[var(--tx)] font-semibold' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="Explore and Search"
        >
          <Search className={`w-6 h-6 transition-transform ${activeTab === 'explore' ? 'scale-110' : ''}`} />
          {activeTab === 'explore' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--ac)]" />}
        </button>

        <button
          onClick={() => onChangeTab('create')}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors relative ${
            activeTab === 'create' ? 'text-[var(--ac)]' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="New Note"
        >
          <div className="p-1 rounded-lg border-2 border-current">
            <PlusSquare className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => onChangeTab('profile')}
          className={`flex-1 h-full flex flex-col items-center justify-center transition-colors relative ${
            activeTab === 'profile' ? 'text-[var(--tx)] font-semibold' : 'text-[var(--mu)] hover:text-[var(--tx)]'
          }`}
          aria-label="Profile"
        >
          <div className="relative">
            {currentProfile?.pic ? (
              <img
                src={currentProfile.pic}
                alt={currentProfile.name}
                className={`w-6 h-6 rounded-full object-cover border ${
                  activeTab === 'profile' ? 'border-[var(--ac)] ring-1 ring-[var(--ac)]' : 'border-[var(--ln)]'
                }`}
              />
            ) : (
              <User className={`w-6 h-6 transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`} />
            )}
            {sharedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--ac)] ring-2 ring-[var(--bg)]" />
            )}
          </div>
          {activeTab === 'profile' && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--ac)]" />}
        </button>
      </div>
    </nav>
  );
};
