import React, { useEffect, useState, useRef } from 'react';
import { fetch7DayGasData } from './services/arbitrumService';
import { AudioService } from './services/audioService';
import { GasBlock, MusicStyle } from './types';
import Visualizer from './components/Visualizer';
import NftGenerator from './components/NftGenerator';
import { Play, Pause, RefreshCw, Zap, Clock, BarChart3, Info, Sliders, Volume2, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<GasBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  // New State
  const [musicStyle, setMusicStyle] = useState<MusicStyle>('CYBERPUNK');
  const [tempo, setTempo] = useState<number>(0.5); // Default 0.5s per block

  const audioService = useRef(new AudioService());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setCurrentNoteIndex(-1);
    try {
      const data = await fetch7DayGasData(); 
      setBlocks(data);
    } catch (err) {
      setError("Failed to load Arbitrum data.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      audioService.current.stop();
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioService.current.stop();
      setIsPlaying(false);
      setCurrentNoteIndex(-1);
    } else {
      setIsPlaying(true);
      audioService.current.playSequence(
        blocks, 
        musicStyle,
        tempo,
        (index) => setCurrentNoteIndex(index),
        () => {
          setIsPlaying(false);
          setCurrentNoteIndex(-1);
        }
      );
    }
  };

  const isFlatPrice = blocks.length > 1 && 
    (Math.max(...blocks.map(b => b.baseFeePerGas)) - Math.min(...blocks.map(b => b.baseFeePerGas)) < 0.0001);

  const activeBlock = currentNoteIndex >= 0 ? blocks[currentNoteIndex] : blocks[blocks.length - 1];
  const activeDate = activeBlock ? new Date(activeBlock.timestamp * 1000) : new Date();

  // Color theme helper
  const getThemeColor = () => {
      switch(musicStyle) {
          case 'ETHEREAL': return 'text-teal-400';
          case 'RETRO': return 'text-emerald-400';
          default: return 'text-rose-500';
      }
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white flex flex-col overflow-hidden font-sans selection:bg-rose-500/30">
      
      {/* TOP SECTION: Visualization Area */}
      <div className="h-[38vh] min-h-[250px] relative bg-gradient-to-b from-[#111] to-[#09090b] flex-shrink-0 border-b border-white/5">
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-white/90">
              Arbitrum <span className={`font-bold ${getThemeColor()}`}>7-Day</span> Pulse
            </h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               RPC Connection Active
            </p>
          </div>
          <div className="text-right pointer-events-auto">
             <button onClick={loadData} className="p-2 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md transition-all border border-white/5">
                <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`}/>
             </button>
          </div>
        </div>

        <div className="w-full h-full">
            {loading ? (
               <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className={`w-10 h-10 border-4 ${musicStyle === 'CYBERPUNK' ? 'border-rose-500' : 'border-teal-500'} border-t-transparent rounded-full animate-spin`}></div>
                  <p className="text-gray-400 text-xs animate-pulse">Synchronizing Node Data...</p>
               </div>
            ) : (
               <Visualizer 
                 blocks={blocks} 
                 isPlaying={isPlaying} 
                 highlightIndex={currentNoteIndex} 
                 styleMode={musicStyle}
               />
            )}
        </div>
      </div>

      {/* BOTTOM SECTION: Glassmorphic Command Center */}
      <div className="flex-grow bg-[#0c0c0e] flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
        
        {/* Left: Sequencer */}
        <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center relative group">
             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
             
             <div className="flex items-center gap-2 mb-6">
                 <Sliders size={14} className="text-gray-500"/>
                 <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Sequencer Engine</span>
             </div>

             <div className="flex items-center gap-6 mb-8">
                 <button 
                  onClick={togglePlay}
                  disabled={loading}
                  className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-2xl relative overflow-hidden
                    ${isPlaying 
                      ? 'bg-white text-black translate-y-[1px]' 
                      : 'bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/10 text-white hover:-translate-y-1'}
                  `}
                >
                  <div className={`absolute inset-0 bg-current opacity-10 ${isPlaying ? 'animate-ping' : 'hidden'}`}></div>
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1"/>}
                </button>
                
                <div className="space-y-1">
                   <div className="text-3xl font-mono font-light text-white">
                      {currentNoteIndex >= 0 ? (
                        <span className="tabular-nums">
                            {(currentNoteIndex + 1).toString().padStart(3, '0')}
                            <span className="text-gray-600 text-lg mx-1">/</span>
                            <span className="text-gray-600 text-lg">{blocks.length}</span>
                        </span>
                      ) : (
                        <span className="text-gray-600">IDLE</span>
                      )}
                   </div>
                   <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-500"/>
                        <span className="text-xs font-mono text-gray-400">
                             {activeDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                   </div>
                </div>
              </div>

              {/* Tempo Slider */}
              <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase text-gray-500 tracking-wider">
                      <span>Tempo (Duration/Block)</span>
                      <span>{tempo.toFixed(2)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.05" 
                    max="1.0" 
                    step="0.05" 
                    value={tempo}
                    onChange={(e) => setTempo(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white hover:accent-gray-300"
                  />
                  <div className="flex justify-between text-[9px] text-gray-600">
                      <span>Fast (20/s)</span>
                      <span>Slow (1/s)</span>
                  </div>
              </div>
        </div>

        {/* Center: Sound & Style Config */}
        <div className="md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center bg-[#0e0e11]">
            <div className="flex items-center gap-2 mb-6">
                 <Volume2 size={14} className="text-gray-500"/>
                 <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Audio Synthesis</span>
             </div>

             {/* Style Selector */}
             <div className="grid grid-cols-3 gap-2 mb-8">
                 {(['CYBERPUNK', 'ETHEREAL', 'RETRO'] as MusicStyle[]).map((style) => (
                     <button
                        key={style}
                        onClick={() => setMusicStyle(style)}
                        className={`
                            py-3 px-2 rounded-lg text-xs font-bold border transition-all relative overflow-hidden
                            ${musicStyle === style 
                                ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                                : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'}
                        `}
                     >
                        {style}
                        {musicStyle === style && (
                            <div className={`absolute bottom-0 left-0 h-0.5 w-full 
                                ${style === 'CYBERPUNK' ? 'bg-rose-500' : style === 'ETHEREAL' ? 'bg-teal-500' : 'bg-emerald-500'}
                            `}></div>
                        )}
                     </button>
                 ))}
             </div>

             {/* Telemetry Cards */}
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#121215] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">AVG GAS (GWEI)</span>
                        <Zap size={10} className="text-yellow-500"/>
                    </div>
                    <div className="text-xl font-mono text-white">
                        {(blocks.reduce((a,b) => a + b.baseFeePerGas, 0) / (blocks.length || 1)).toFixed(3)}
                    </div>
                </div>
                <div className="bg-[#121215] p-3 rounded-lg border border-white/5">
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500">MODE</span>
                        <Cpu size={10} className={isFlatPrice ? "text-emerald-500" : "text-gray-500"}/>
                    </div>
                    <div className="text-xs font-mono text-gray-300 mt-1">
                        {isFlatPrice ? 'L2 ACTIVITY' : 'L1 FEES'}
                    </div>
                </div>
             </div>
        </div>

        {/* Right: Export */}
        <div className="md:w-1/3 p-6 flex flex-col justify-center bg-[#0a0a0c]">
           <div className="mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Artifact Generation</span>
           </div>
           
           <NftGenerator 
              blocks={blocks} 
              currentStyle={musicStyle} 
              currentTempo={tempo} 
           />
        </div>

      </div>
    </div>
  );
};

export default App;
