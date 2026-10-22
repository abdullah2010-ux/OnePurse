import React from 'react';
import { Plus, Wallet, ListOrdered, Calculator, FileSpreadsheet } from 'lucide-react';

export type ActiveTab = 'people' | 'ledger' | 'cash-check' | 'summary';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddMoney: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddMoney,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'people', label: 'People & Tasks', icon: <Wallet className="w-4 h-4" /> },
    { id: 'ledger', label: 'Activity Ledger', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'cash-check', label: 'Cash Check', icon: <Calculator className="w-4 h-4" /> },
    { id: 'summary', label: 'Summary Sheet', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-stone-200/90">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('people');
            }}
            className="text-xl font-bold tracking-tight text-stone-900 font-display whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            OnePurse
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                    isActive
                      ? 'border-emerald-700 text-stone-950 font-semibold'
                      : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenAddMoney}
              className="min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 active:scale-[0.99] transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Money Received</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Strictly <= 56px height to respect 15% sticky cap) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 grid grid-cols-4 items-center h-14 px-2"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center rounded-lg transition-colors ${
                isActive ? 'text-emerald-800 font-semibold' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {item.icon}
              <span className="text-[11px] leading-tight mt-1 whitespace-nowrap px-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
