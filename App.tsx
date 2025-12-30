
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Temple, AppState } from './types';
import { INITIAL_TEMPLES, TOTAL_GOAL } from './constants';
import TempleMap from './components/TempleMap';
import Bell3D from './components/Bell3D';
import TempleInfo from './components/TempleInfo';
import { fetchTempleInfo, searchTemplesInArea } from './services/geminiService';

const App: React.FC = () => {
  const [temples, setTemples] = useState<Temple[]>(INITIAL_TEMPLES);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('joya_no_kane_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentTemple: null,
        ringCount: parsed.ringCount || 0,
        totalGoal: TOTAL_GOAL,
        isMapMode: true,
      };
    }
    return {
      currentTemple: null,
      ringCount: 0,
      totalGoal: TOTAL_GOAL,
      isMapMode: true,
    };
  });

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('joya_no_kane_state', JSON.stringify({
      ringCount: state.ringCount
    }));
  }, [state.ringCount]);

  const handleSelectTemple = async (temple: Temple) => {
    setState(prev => ({ ...prev, currentTemple: temple, isMapMode: false }));
    setLoadingInfo(true);
    
    const result = await fetchTempleInfo(temple.name);
    setState(prev => {
      if (!prev.currentTemple) return prev;
      return {
        ...prev,
        currentTemple: {
          ...prev.currentTemple,
          description: result.description,
          sources: result.sources,
        }
      };
    });
    setLoadingInfo(false);
  };

  const handleSearchArea = async (lat: number, lng: number) => {
    setIsSearching(true);
    const newTemples = await searchTemplesInArea(lat, lng);
    setTemples(prev => {
      const existingIds = new Set(prev.map(t => t.name)); // Deduplicate by name
      const filteredNew = newTemples.filter(t => !existingIds.has(t.name));
      return [...prev, ...filteredNew];
    });
    setIsSearching(false);
  };

  const playBellSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Low deep resonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 5);
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 8);

    // Metallic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 3);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 4);
    
    // Strike click
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'square';
    osc3.frequency.setValueAtTime(40, ctx.currentTime);
    gain3.gain.setValueAtTime(0.3, ctx.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start();
    osc3.stop(ctx.currentTime + 0.1);
  };

  const handleStrike = () => {
    if (state.ringCount >= state.totalGoal) return;
    playBellSound();
    setState(prev => ({
      ...prev,
      ringCount: Math.min(prev.ringCount + 1, TOTAL_GOAL)
    }));
  };

  const resetCount = () => {
    if (confirm('回数をリセットしますか？')) {
      setState(prev => ({ ...prev, ringCount: 0 }));
    }
  };

  const goBackToMap = () => {
    setState(prev => ({ ...prev, currentTemple: null, isMapMode: true }));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-gray-100 select-none">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-black border-b border-neutral-800 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-900 rounded-full flex items-center justify-center border border-red-600 shadow-lg shadow-red-900/20">
            <span className="text-xl">鐘</span>
          </div>
          <h1 className="text-xl font-bold tracking-widest text-red-600 uppercase">除夜の鐘</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">煩悩の数</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black tabular-nums ${state.ringCount === 108 ? 'text-green-500' : 'text-amber-500'}`}>
                {state.ringCount}
              </span>
              <span className="text-sm text-gray-600">/ {state.totalGoal}</span>
            </div>
          </div>
          {state.ringCount > 0 && (
            <button onClick={resetCount} className="text-[10px] text-gray-600 hover:text-red-500 underline transition-colors uppercase font-bold">RESET</button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
        {state.isMapMode ? (
          <div className="w-full h-full p-2 md:p-6 bg-[#0f0f0f]">
            <TempleMap 
              temples={temples} 
              onSelectTemple={handleSelectTemple} 
              onSearchArea={handleSearchArea}
              isSearching={isSearching}
            />
          </div>
        ) : (
          <>
            {/* Left: 3D Bell */}
            <div className="w-full md:w-3/5 h-[45vh] md:h-full relative overflow-hidden">
              <Bell3D onStrike={handleStrike} />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <button 
                  onClick={goBackToMap}
                  className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white/20 transition-all flex items-center gap-2 shadow-2xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-bold">地図へ戻る</span>
                </button>
              </div>

              {state.ringCount >= state.totalGoal && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-40">
                  <div className="bg-neutral-900 border-2 border-amber-500/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center animate-in fade-in zoom-in duration-500">
                    <h3 className="text-4xl font-black text-amber-500 mb-4 tracking-tighter">満願成就</h3>
                    <p className="text-gray-300 leading-relaxed mb-6">
                      108回の鐘を突き終えました。<br/>
                      すべての煩悩が消え去り、<br/>
                      清らかな心で新年を迎えられます。
                    </p>
                    <button 
                      onClick={resetCount}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-full font-bold transition-all"
                    >
                      もう一度最初から
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Temple Info */}
            <div className="w-full md:w-2/5 h-[55vh] md:h-full p-4 md:p-8 bg-[#0a0a0a] border-l border-neutral-800 shadow-2xl">
              {state.currentTemple && (
                <TempleInfo temple={state.currentTemple} loading={loadingInfo} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Progress Footer */}
      <footer className="h-1 bg-neutral-900 overflow-hidden shrink-0 z-50">
        <div 
          className="h-full bg-gradient-to-r from-red-800 via-amber-600 to-amber-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          style={{ width: `${(state.ringCount / state.totalGoal) * 100}%` }}
        />
      </footer>
    </div>
  );
};

export default App;
