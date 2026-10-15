import React from 'react';
import { Sparkles, Search } from 'lucide-react';

interface Props {
  feedTab: 'for_you' | 'following';
  onChangeTab: (tab: 'for_you' | 'following') => void;
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  personaOptions: string[];
  selectedPersona: string | null;
  onSelectPersona: (persona: string | null) => void;
}

export const FeedFilters: React.FC<Props> = ({
  feedTab,
  onChangeTab,
  searchQuery,
  onChangeSearch,
  personaOptions,
  selectedPersona,
  onSelectPersona,
}) => {
  return (
    <div className="space-y-4">
      {/* Search & For You / Following Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeTab('for_you')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              feedTab === 'for_you'
                ? 'bg-purple-50 text-[#534092]'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            For you <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onChangeTab('following')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              feedTab === 'following'
                ? 'bg-purple-50 text-[#534092]'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            Following
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Search notes, topics..."
            className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 rounded-xl focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
        </div>
      </div>

      {/* AI Persona Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[null, ...personaOptions].map((persona) => (
          <button
            key={persona ?? 'all-personas'}
            onClick={() => onSelectPersona(persona)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition ${
              selectedPersona === persona
                ? 'bg-[#EFEAFF] text-[#534092] border-purple-200'
                : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            {persona ?? 'All personas'}
          </button>
        ))}
      </div>
    </div>
  );
};
