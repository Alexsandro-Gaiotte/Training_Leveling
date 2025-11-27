import React, { ReactNode } from 'react';

// Corner Bracket Decoration Component
const CornerBrackets = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-system-blue"></div>
    <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-system-blue"></div>
    <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-system-blue"></div>
    <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-system-blue"></div>
  </>
);

interface SystemWindowProps {
  children?: ReactNode;
  title?: string;
  className?: string;
  type?: 'normal' | 'quest' | 'warning';
}

export const SystemWindow: React.FC<SystemWindowProps> = ({ children, title, className = "", type = 'normal' }) => {
  let borderColor = "border-system-blue";
  let shadowColor = "shadow-[0_0_15px_rgba(0,162,255,0.15)]";
  let titleBg = "bg-system-blue";
  
  if (type === 'warning') {
    borderColor = "border-system-red";
    shadowColor = "shadow-[0_0_15px_rgba(255,51,51,0.2)]";
    titleBg = "bg-system-red";
  }

  return (
    <div className={`relative border ${borderColor} bg-system-panel/95 backdrop-blur-md ${shadowColor} p-4 md:p-6 ${className}`}>
      <CornerBrackets />
      
      {title && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
           <div className={`${titleBg} px-4 py-0.5 text-black font-bold text-[10px] md:text-xs tracking-widest uppercase shadow-[0_0_10px_currentColor] whitespace-nowrap`}>
             {title}
           </div>
        </div>
      )}
      
      {/* Internal Grid Line decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface SystemButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  className?: string;
  disabled?: boolean;
  selected?: boolean;
}

export const SystemButton: React.FC<SystemButtonProps> = ({ onClick, children, variant = 'primary', className = "", disabled = false, selected = false }) => {
  const baseStyles = "relative px-4 py-3 md:px-6 md:py-2.5 font-sans font-bold uppercase text-[10px] md:text-xs tracking-widest transition-all duration-150 disabled:opacity-40 disabled:grayscale touch-manipulation";
  
  const variants = {
    primary: "bg-transparent border border-system-blue text-system-blue hover:bg-system-blue hover:text-black hover:shadow-[0_0_15px_#00A2FF]",
    danger: "bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-black hover:shadow-[0_0_15px_#EF4444]",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
    success: "bg-transparent border border-system-green text-system-green hover:bg-system-green hover:text-black hover:shadow-[0_0_15px_#00FF9D]"
  };

  const selectedStyles = selected 
    ? "bg-system-blue text-black shadow-[0_0_15px_#00A2FF] border-system-blue" 
    : "";

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${selectedStyles} ${className}`}>
      {children}
    </button>
  );
};

interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, color = "bg-system-blue", label }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  return (
    <div className="w-full">
      {label && <div className="text-[10px] uppercase text-gray-500 mb-1 flex justify-between"><span>{label}</span> <span>{percentage.toFixed(0)}%</span></div>}
      <div className="w-full h-1.5 bg-gray-900 border border-gray-800">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_8px_currentColor]`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 30, className = "" }) => {
  const [displayed, setDisplayed] = React.useState("");

  React.useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <p className={`font-mono ${className}`}>{displayed}</p>;
};