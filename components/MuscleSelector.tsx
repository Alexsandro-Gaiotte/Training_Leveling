import React, { useState, useEffect } from 'react';
import { MuscleGroup } from '../types';

interface MusclePart {
  id: string;
  d: string;
  group?: MuscleGroup; // If undefined, it's decorative (BodyOutline)
  view: 'front' | 'back';
}

interface DecorationPart {
  id: string;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  type: 'path' | 'circle';
  className?: string;
}

// Data source for SVG Paths
const MUSCLE_DATA: MusclePart[] = [
  // --- FRONT VIEW ---
  { id: 'head-front', view: 'front', d: "M 60,0 L 80,0 L 85,15 L 70,25 L 55,15 L 60,0" }, // Decorative
  { id: 'chest', view: 'front', group: 'Peito', d: "M 45,35 L 95,35 L 90,65 L 70,70 L 50,65 Z" },
  { id: 'shoulders-front-L', view: 'front', group: 'Ombros', d: "M 30,35 L 45,35 L 45,55 L 30,50 Z" },
  { id: 'shoulders-front-R', view: 'front', group: 'Ombros', d: "M 95,35 L 110,35 L 110,50 L 95,55 Z" },
  { id: 'biceps-L', view: 'front', group: 'Bíceps', d: "M 28,52 L 43,57 L 40,80 L 25,75 Z" },
  { id: 'biceps-R', view: 'front', group: 'Bíceps', d: "M 97,57 L 112,52 L 115,75 L 100,80 Z" },
  { id: 'abs-core', view: 'front', d: "M 50,65 L 70,70 L 90,65 L 85,100 L 55,100 Z" }, // Decorative
  { id: 'forearm-front-L', view: 'front', d: "M 25,75 L 40,80 L 35,110 L 20,105 Z" }, // Decorative
  { id: 'forearm-front-R', view: 'front', d: "M 100,80 L 115,75 L 120,105 L 105,110 Z" }, // Decorative
  { id: 'quads', view: 'front', group: 'Pernas', d: "M 50,105 L 85,105 L 90,160 L 80,180 L 60,180 L 50,160 Z" },
  { id: 'calves-front-L', view: 'front', group: 'Pernas', d: "M 52,185 L 60,185 L 60,230 L 55,230 Z" },
  { id: 'calves-front-R', view: 'front', group: 'Pernas', d: "M 80,185 L 88,185 L 85,230 L 80,230 Z" },

  // --- BACK VIEW ---
  { id: 'head-back', view: 'back', d: "M 60,0 L 80,0 L 85,15 L 70,25 L 55,15 L 60,0" }, // Decorative
  { id: 'dorsal', view: 'back', group: 'Dorsal', d: "M 45,35 L 95,35 L 100,55 L 85,90 L 55,90 L 40,55 Z" },
  { id: 'shoulders-back-L', view: 'back', group: 'Ombros', d: "M 30,35 L 45,35 L 40,55 L 28,50 Z" },
  { id: 'shoulders-back-R', view: 'back', group: 'Ombros', d: "M 95,35 L 110,35 L 112,50 L 100,55 Z" },
  { id: 'triceps-L', view: 'back', group: 'Tríceps', d: "M 28,50 L 40,55 L 38,80 L 25,75 Z" },
  { id: 'triceps-R', view: 'back', group: 'Tríceps', d: "M 100,55 L 112,50 L 115,75 L 102,80 Z" },
  { id: 'lower-back', view: 'back', d: "M 55,90 L 85,90 L 90,110 L 50,110 Z" }, // Decorative
  { id: 'forearm-back-L', view: 'back', d: "M 25,75 L 38,80 L 35,110 L 20,105 Z" }, // Decorative
  { id: 'forearm-back-R', view: 'back', d: "M 102,80 L 115,75 L 120,105 L 105,110 Z" }, // Decorative
  { id: 'hams-glutes', view: 'back', group: 'Pernas', d: "M 50,110 L 90,110 L 95,160 L 85,180 L 55,180 L 45,160 Z" },
  { id: 'calves-back-L', view: 'back', group: 'Pernas', d: "M 55,185 L 65,185 L 62,230 L 55,230 Z" },
  { id: 'calves-back-R', view: 'back', group: 'Pernas', d: "M 75,185 L 85,185 L 85,230 L 78,230 Z" },
];

const DECORATION_DATA: DecorationPart[] = [
  { id: 'conn-top', type: 'path', d: "M 140,50 L 160,50", className: "stroke-system-blue/20 stroke-[0.5]" },
  { id: 'conn-bot', type: 'path', d: "M 140,150 L 160,150", className: "stroke-system-blue/20 stroke-[0.5]" },
  { id: 'node-top', type: 'circle', cx: 150, cy: 50, r: 2, className: "fill-system-blue/40" },
  { id: 'node-bot', type: 'circle', cx: 150, cy: 150, r: 2, className: "fill-system-blue/40" },
];

const VIEWS = [
  { id: 'front', label: 'Frente', translate: 'translate(10, 20)' },
  { id: 'back', label: 'Costas', translate: 'translate(150, 20)' }
] as const;

interface MusclePathProps {
  d: string;
  group: MuscleGroup;
  isActive: boolean;
  onToggle: (muscle: string) => void;
}

const MusclePath: React.FC<MusclePathProps> = ({ d, group, isActive, onToggle }) => {
  return (
    <g onClick={() => onToggle(group)} className="cursor-pointer group transition-all duration-300">
      <path
        d={d}
        className={`stroke-system-blue stroke-1 transition-all duration-300
          ${isActive 
            ? 'fill-system-blue drop-shadow-[0_0_10px_rgba(0,162,255,0.9)] animate-pulse' 
            : 'fill-transparent group-hover:fill-system-blue/20'
          }`}
      />
      {/* Transparent Hitbox Helper for thin lines */}
      <path d={d} className="fill-transparent stroke-transparent stroke-[15]" />
    </g>
  );
};

const BodyOutline: React.FC<{ d: string }> = ({ d }) => (
  <path d={d} className="fill-system-dark/50 stroke-system-blue/30 stroke-1 pointer-events-none" />
);

interface MuscleSelectorProps {
  selectedMuscles: string[];
  onToggle: (muscle: string) => void;
}

export const MuscleSelector: React.FC<MuscleSelectorProps> = ({ selectedMuscles, onToggle }) => {
  const [mobileView, setMobileView] = useState<'front' | 'back'>('front');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  
  // Center logic: The body drawing is roughly centered at local x=75. 
  // SVG center is 150. 75 * 1.35 (scale) = ~101. 150 - 101 = 49 (offset needed).
  const mobileTransform = "translate(45px, 10px) scale(1.35)";

  const renderParts = (view: 'front' | 'back') => {
    return MUSCLE_DATA.filter(part => part.view === view).map((part) => {
      if (part.group) {
        return (
          <MusclePath 
            key={part.id} 
            d={part.d} 
            group={part.group} 
            isActive={selectedMuscles.includes(part.group)} 
            onToggle={onToggle} 
          />
        );
      }
      return <BodyOutline key={part.id} d={part.d} />;
    });
  };

  const renderDecorations = () => {
    return DECORATION_DATA.map((deco) => {
      if (deco.type === 'path' && deco.d) {
        return <path key={deco.id} d={deco.d} className={deco.className} />;
      }
      if (deco.type === 'circle' && deco.cx && deco.cy && deco.r) {
        return <circle key={deco.id} cx={deco.cx} cy={deco.cy} r={deco.r} className={deco.className} />;
      }
      return null;
    });
  };

  return (
    <div className="w-full relative bg-system-panel/50 border border-system-blue/20 rounded p-2 md:p-4">
      
      {/* Mobile Toggle Tabs */}
      <div className="flex md:hidden mb-2 border border-system-blue/30 rounded overflow-hidden">
        {VIEWS.map((view) => (
          <button 
            key={view.id}
            onClick={() => setMobileView(view.id)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${mobileView === view.id ? 'bg-system-blue text-black' : 'text-gray-400 hover:text-white bg-black/40'}`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 300 320" className="w-full h-auto max-h-[60vh] md:max-h-[400px] select-none touch-manipulation">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {VIEWS.map((view) => (
          <g 
            key={view.id}
            className={`transition-all duration-300 ease-in-out ${mobileView !== view.id ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}
            transform={view.translate}
            style={{ transform: isMobile && mobileView === view.id ? mobileTransform : undefined }}
          >
              <text x="70" y="-5" textAnchor="middle" className="fill-system-blue/70 text-[10px] tracking-[0.3em] font-mono md:block hidden">
                {view.label.toUpperCase()}
              </text>
              {renderParts(view.id)}
          </g>
        ))}
        
        {/* Connection Lines (Decorative Tech Elements - Hidden on mobile view to avoid clutter) */}
        <g className="hidden md:block">
           {renderDecorations()}
        </g>

      </svg>
      
      <div className="mt-1 md:mt-2 text-center">
        <p className="text-[9px] text-system-blue/60 uppercase tracking-widest">Sistema de Mapeamento Biológico v3.2</p>
      </div>
    </div>
  );
};