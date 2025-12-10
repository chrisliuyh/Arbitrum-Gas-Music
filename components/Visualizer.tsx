import React, { useRef, useEffect } from 'react';
import { GasBlock, MusicStyle } from '../types';

interface VisualizerProps {
  blocks: GasBlock[];
  isPlaying: boolean;
  highlightIndex: number; 
  styleMode: MusicStyle;
}

const Visualizer: React.FC<VisualizerProps> = ({ blocks, isPlaying, highlightIndex, styleMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || blocks.length === 0) return;
    
    // Handle retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale everything
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // --- Data Preprocessing ---
    const prices = blocks.map(b => b.baseFeePerGas);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const isFlat = (maxP - minP) < 0.0001;

    const rawValues = isFlat ? blocks.map(b => b.gasUsed) : prices;
    const maxVal = Math.max(...rawValues);
    const minVal = Math.min(...rawValues);
    const range = maxVal - minVal || 1;

    const values = rawValues.map(v => (v - minVal) / range);

    // --- Style Colors ---
    let primaryColor = '';
    let secondaryColor = '';
    let glowColor = '';
    
    switch (styleMode) {
        case 'CYBERPUNK':
            primaryColor = '#f43f5e'; // Rose
            secondaryColor = '#3b82f6'; // Blue
            glowColor = 'rgba(244, 63, 94, 0.8)';
            break;
        case 'ETHEREAL':
            primaryColor = '#2dd4bf'; // Teal
            secondaryColor = '#a78bfa'; // Purple
            glowColor = 'rgba(45, 212, 191, 0.6)';
            break;
        case 'RETRO':
            primaryColor = '#10b981'; // Emerald
            secondaryColor = '#fbbf24'; // Amber
            glowColor = 'rgba(16, 185, 129, 0.8)';
            break;
    }

    // Override if data source is Activity (Greenish/Emerald usually for gasUsed)
    // But let's stick to the MusicStyle for the "Vibe"
    
    // --- Rendering Constants ---
    const paddingX = 40;
    const paddingY = Math.min(height * 0.15, 60); 
    
    const drawWidth = width - paddingX * 2;
    const drawHeight = height - paddingY * 2;

    const getX = (i: number) => paddingX + (i / (values.length - 1)) * drawWidth;
    const getY = (val: number) => (height - paddingY) - (val * drawHeight);

    const points = values.map((val, i) => ({ x: getX(i), y: getY(val) }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Grid / Perspective Lines (Subtle)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let i = 0; i <= 4; i++) {
        const y = (height - paddingY) - (i / 4) * drawHeight;
        ctx.moveTo(paddingX, y);
        ctx.lineTo(width - paddingX, y);
      }
      ctx.stroke();

      // 2. The Data Ribbon (Filled)
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - paddingY);
      
      for (let i = 0; i < points.length; i++) {
        // Simple smoothing for Ethereal mode
        if (styleMode === 'ETHEREAL' && i > 0) {
             const cpX = (points[i-1].x + points[i].x) / 2;
             const cpY = (points[i-1].y + points[i].y) / 2;
             ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, cpX, cpY);
             // Note: this is a cheap smoothing hack, not perfect for end points, but looks nicer
             if (i === points.length - 1) ctx.lineTo(points[i].x, points[i].y);
        } else if (styleMode === 'RETRO') {
             // Step graph for Retro
             if (i > 0) {
                 ctx.lineTo(points[i].x, points[i-1].y);
                 ctx.lineTo(points[i].x, points[i].y);
             } else {
                 ctx.lineTo(points[i].x, points[i].y);
             }
        } else {
             // Standard line for Cyberpunk
             ctx.lineTo(points[i].x, points[i].y);
        }
      }
      
      ctx.lineTo(points[points.length - 1].x, height - paddingY);
      ctx.closePath();

      // Gradient
      const gradient = ctx.createLinearGradient(0, height - paddingY - drawHeight, 0, height - paddingY);
      gradient.addColorStop(0, glowColor); 
      gradient.addColorStop(1, 'rgba(0,0,0,0)'); 
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // 3. The Top Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length; i++) {
         if (styleMode === 'ETHEREAL' && i > 0) {
             const cpX = (points[i-1].x + points[i].x) / 2;
             const cpY = (points[i-1].y + points[i].y) / 2;
             ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, cpX, cpY);
             if (i === points.length - 1) ctx.lineTo(points[i].x, points[i].y);
         } else if (styleMode === 'RETRO') {
             if (i > 0) {
                 ctx.lineTo(points[i].x, points[i-1].y);
                 ctx.lineTo(points[i].x, points[i].y);
             } else {
                 ctx.lineTo(points[i].x, points[i].y);
             }
         } else {
            ctx.lineTo(points[i].x, points[i].y);
         }
      }
      ctx.lineWidth = styleMode === 'RETRO' ? 3 : 2;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();

      // 4. Highlight Cursor
      if (highlightIndex >= 0 && highlightIndex < points.length) {
         const p = points[highlightIndex];
         
         // Vertical laser line
         ctx.beginPath();
         ctx.moveTo(p.x, 0);
         ctx.lineTo(p.x, height);
         ctx.strokeStyle = secondaryColor;
         ctx.setLineDash([4, 4]);
         ctx.stroke();
         ctx.setLineDash([]);

         // Intersection dot
         ctx.beginPath();
         if (styleMode === 'RETRO') {
            ctx.rect(p.x - 5, p.y - 5, 10, 10);
         } else {
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
         }
         ctx.fillStyle = '#fff';
         ctx.fill();
         
         // Glow
         ctx.shadowColor = primaryColor;
         ctx.shadowBlur = 15;
         ctx.stroke();
         ctx.shadowBlur = 0;
      }
    };

    let animationFrameId: number;
    const loop = () => {
      render();
      animationFrameId = requestAnimationFrame(loop);
    }
    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [blocks, highlightIndex, isPlaying, styleMode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  );
};

export default Visualizer;
