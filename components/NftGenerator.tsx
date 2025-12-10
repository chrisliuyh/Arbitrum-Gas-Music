import React, { useState, useRef } from 'react';
import { GasBlock, NftMetadata, MusicStyle } from '../types';
import { Download, Sparkles, Music, Image as ImageIcon, FileJson, Loader2 } from 'lucide-react';
import { generateNftDescription } from '../services/geminiService';
import { AudioService } from '../services/audioService';

interface NftGeneratorProps {
  blocks: GasBlock[];
  currentStyle: MusicStyle;
  currentTempo: number;
}

const NftGenerator: React.FC<NftGeneratorProps> = ({ blocks, currentStyle, currentTempo }) => {
  const [loadingType, setLoadingType] = useState<'metadata' | 'audio' | 'image' | null>(null);
  const audioServiceRef = useRef(new AudioService());

  // --- SVG Generator Logic ---
  const generateSVG = (data: GasBlock[]): string => {
    const width = 1200; // High res for export
    const height = 600;
    
    const prices = data.map(d => d.baseFeePerGas);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const isFlat = (maxP - minP) < 0.0001;

    const values = isFlat ? data.map(d => d.gasUsed) : prices;
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;

    const points = values.map((v, i) => {
        const norm = (v - minVal) / range;
        const x = (i / (values.length - 1)) * (width - 160) + 80; 
        const y = (height - 100) - (norm * 350); 
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    const fillPoints = `80,${height-100} ${points} ${width-80},${height-100}`;
    const accentColor = isFlat ? '#10b981' : '#f43f5e';

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: #09090b">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:${accentColor};stop-opacity:0.0" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#09090b" />
        <rect width="100%" height="100%" fill="url(#grad)" opacity="0.1"/>
        
        <text x="80" y="80" font-family="Courier New, monospace" font-weight="bold" fill="white" font-size="32">ARBITRUM // 7 DAY PULSE</text>
        <text x="80" y="115" font-family="Courier New, monospace" fill="${accentColor}" font-size="16" letter-spacing="2">STYLE: ${currentStyle} // TEMPO: ${currentTempo}s</text>
        
        <polygon points="${fillPoints}" fill="url(#grad)" opacity="0.6" />
        <polyline points="${points}" fill="none" stroke="${accentColor}" stroke-width="3" />

        <text x="80" y="${height-60}" font-family="Courier New, monospace" fill="#555" font-size="16">${new Date(data[0].timestamp * 1000).toLocaleString()}</text>
        <text x="${width-80}" y="${height-60}" font-family="Courier New, monospace" fill="#555" font-size="16" text-anchor="end">${new Date(data[data.length-1].timestamp * 1000).toLocaleString()}</text>
      </svg>
    `;
  };

  // --- Downloads ---

  const handleDownloadJSON = async () => {
    setLoadingType('metadata');
    try {
        const svgString = generateSVG(blocks);
        const svgBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
        const description = await generateNftDescription(blocks);
        const avgGas = blocks.reduce((acc, b) => acc + b.baseFeePerGas, 0) / blocks.length;

        const metadata: NftMetadata = {
            name: `Arb Pulse #${blocks[blocks.length-1]?.number}`,
            description: description,
            image: svgBase64,
            attributes: [
                { trait_type: "Network", value: "Arbitrum One" },
                { trait_type: "Audio Style", value: currentStyle },
                { trait_type: "Duration", value: "168 Hours" },
                { trait_type: "Average Gas", value: parseFloat(avgGas.toFixed(4)) }
            ]
        };

        const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arb-pulse-${blocks[blocks.length-1].number}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingType(null);
    }
  };

  const handleDownloadAudio = async () => {
      setLoadingType('audio');
      try {
        const blob = await audioServiceRef.current.renderAudio(blocks, currentStyle, currentTempo);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arb-melody-${currentStyle.toLowerCase()}-${blocks[blocks.length-1].number}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
          console.error("Audio export failed", e);
      } finally {
          setLoadingType(null);
      }
  };

  const handleDownloadImage = async () => {
      setLoadingType('image');
      try {
        const svgString = generateSVG(blocks);
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1200;
            canvas.height = 600;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `arb-visual-${blocks[blocks.length-1].number}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setLoadingType(null);
        };
        img.src = url;

      } catch (e) {
          console.error("Image export failed", e);
          setLoadingType(null);
      }
  };

  const isDisabled = blocks.length === 0 || loadingType !== null;

  return (
    <div className="flex flex-col h-full">
        <div className="grid grid-cols-1 gap-3">
            <button 
                onClick={handleDownloadAudio}
                disabled={isDisabled}
                className="group relative flex items-center justify-between p-4 bg-[#18181b] border border-white/5 rounded-xl hover:bg-[#202025] hover:border-white/10 transition-all text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        {loadingType === 'audio' ? <Loader2 size={20} className="animate-spin"/> : <Music size={20}/>}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-200">Export Audio</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">WAV • {currentStyle}</div>
                    </div>
                </div>
                <Download size={16} className="text-gray-600 group-hover:text-white transition-colors"/>
            </button>

            <button 
                onClick={handleDownloadImage}
                disabled={isDisabled}
                className="group relative flex items-center justify-between p-4 bg-[#18181b] border border-white/5 rounded-xl hover:bg-[#202025] hover:border-white/10 transition-all text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        {loadingType === 'image' ? <Loader2 size={20} className="animate-spin"/> : <ImageIcon size={20}/>}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-200">Export Image</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">High-Res PNG</div>
                    </div>
                </div>
                <Download size={16} className="text-gray-600 group-hover:text-white transition-colors"/>
            </button>

            <button 
                onClick={handleDownloadJSON}
                disabled={isDisabled}
                className="group relative flex items-center justify-between p-4 bg-[#18181b] border border-white/5 rounded-xl hover:bg-[#202025] hover:border-white/10 transition-all text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        {loadingType === 'metadata' ? <Loader2 size={20} className="animate-spin"/> : <FileJson size={20}/>}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-200">NFT Metadata</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">JSON + SVG</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <Sparkles size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"/>
                     <Download size={16} className="text-gray-600 group-hover:text-white transition-colors"/>
                </div>
            </button>
        </div>
    </div>
  );
};

export default NftGenerator;
