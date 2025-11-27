import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import { SystemWindow, SystemButton, ProgressBar, Typewriter } from './components/SystemUI';
import { MuscleSelector } from './components/MuscleSelector';
import { UserProfile, GameState, WorkoutPlan, Exercise } from './types';
import { generateDailyMotivation, generateWorkoutPlan, generateHiddenQuest } from './services/geminiService';

// Constants for leveling
const BASE_XP_REQ = 500;
const XP_GROWTH_FACTOR = 1.2;

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    currentXp: 0,
    requiredXp: BASE_XP_REQ,
    streak: 0,
    lastLogin: new Date().toISOString(),
    jobTitle: 'Rank E (Iniciante)'
  });
  
  const [dailyPlan, setDailyPlan] = useState<WorkoutPlan | null>(null);
  const [motivation, setMotivation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'missions'>('missions');

  // New states for muscle selection
  const [showMuscleSelector, setShowMuscleSelector] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  
  // State for expanding exercise details on mobile
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Load data from storage
  useEffect(() => {
    const storedProfile = localStorage.getItem('sl_profile');
    const storedState = localStorage.getItem('sl_gamestate');
    const storedPlan = localStorage.getItem('sl_dailyplan');

    if (storedProfile) setProfile(JSON.parse(storedProfile));
    if (storedState) setGameState(JSON.parse(storedState));
    if (storedPlan) {
      setDailyPlan(JSON.parse(storedPlan));
    }
  }, []);

  // Save data on change
  useEffect(() => {
    if (profile) localStorage.setItem('sl_profile', JSON.stringify(profile));
    if (gameState) localStorage.setItem('sl_gamestate', JSON.stringify(gameState));
    if (dailyPlan) localStorage.setItem('sl_dailyplan', JSON.stringify(dailyPlan));
  }, [profile, gameState, dailyPlan]);

  // Initial Motivation
  useEffect(() => {
    if (!profile) return;
    generateDailyMotivation(gameState.level, gameState.streak).then(setMotivation);
  }, [profile, gameState.level]);

  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setShowMuscleSelector(true);
  };

  const toggleMuscleSelection = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const confirmWorkoutCreation = async () => {
    if (!profile) return;
    setLoading(true);
    setShowMuscleSelector(false);
    await createNewWorkout(profile, selectedMuscles);
    setLoading(false);
    setSelectedMuscles([]); 
  };

  const createNewWorkout = async (userProfile: UserProfile, focus: string[] = []) => {
    const exercises = await generateWorkoutPlan(userProfile, focus);
    
    // 10% Chance of Hidden Boss
    const isDoubleXpEvent = Math.random() < 0.1;
    if (isDoubleXpEvent) {
       const hiddenBoss = await generateHiddenQuest();
       exercises.push(hiddenBoss);
    }

    const newPlan: WorkoutPlan = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      exercises,
      baseXp: 100 + (gameState.level * 10), 
      isDoubleXpEvent,
      focus
    };
    
    setDailyPlan(newPlan);
  };

  const toggleExercise = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent toggling expansion when checking the box
    if (!dailyPlan) return;
    const updatedExercises = dailyPlan.exercises.map(ex => {
      if (ex.id === id) {
        return { ...ex, completed: !ex.completed, skipped: false };
      }
      return ex;
    });
    setDailyPlan({ ...dailyPlan, exercises: updatedExercises });
  };

  const skipExercise = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!dailyPlan) return;
    const updatedExercises = dailyPlan.exercises.map(ex => 
      ex.id === id ? { ...ex, skipped: !ex.skipped, completed: false } : ex
    );
    setDailyPlan({ ...dailyPlan, exercises: updatedExercises });
  };
  
  const toggleExpandExercise = (id: string) => {
    setExpandedExerciseId(prev => prev === id ? null : id);
  };

  const completeDailyQuest = () => {
    if (!dailyPlan) return;
    
    let totalXp = dailyPlan.baseXp;
    const skippedCount = dailyPlan.exercises.filter(e => e.skipped).length;
    const totalCount = dailyPlan.exercises.length;
    
    if (skippedCount > 0) {
      const penaltyFactor = skippedCount / totalCount;
      totalXp = Math.floor(totalXp * (1 - penaltyFactor));
    }

    if (dailyPlan.isDoubleXpEvent) {
      const boss = dailyPlan.exercises.find(e => e.isHiddenBoss);
      if (boss && boss.completed) {
        totalXp *= 2;
      } else if (boss && (boss.skipped || !boss.completed)) {
        totalXp = Math.floor(totalXp / 2);
      }
    }

    addXp(totalXp);
    setDailyPlan(null);
    setGameState(prev => ({ ...prev, streak: prev.streak + 1 }));
  };

  const addXp = (amount: number) => {
    let newXp = gameState.currentXp + amount;
    let newLevel = gameState.level;
    let newReq = gameState.requiredXp;
    let leveledUp = false;

    while (newXp >= newReq) {
      newXp -= newReq;
      newLevel++;
      newReq = Math.floor(newReq * XP_GROWTH_FACTOR);
      leveledUp = true;
    }

    setGameState(prev => ({
      ...prev,
      level: newLevel,
      currentXp: newXp,
      requiredXp: newReq,
      jobTitle: getJobTitle(newLevel)
    }));

    if (leveledUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 4000);
    }
  };

  const getJobTitle = (level: number) => {
    if (level < 10) return "Rank E (Iniciante)";
    if (level < 20) return "Rank C (Intermediário)";
    if (level < 40) return "Rank B (Veterano)";
    if (level < 60) return "Rank A (Elite)";
    return "Rank S (Maromba)";
  }

  // BMI Calculation Helpers
  const calculateBMI = (weight: number, height: number) => {
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do Peso', color: 'text-yellow-500' };
    if (bmi < 24.9) return { label: 'Peso Normal', color: 'text-system-green' };
    if (bmi < 29.9) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    return { label: 'Obesidade', color: 'text-red-500' };
  };

  // Helper to generate image URL
  const getExerciseImageUrl = (name: string) => {
    const prompt = `gym workout exercise ${name} technical drawing white lines on black background minimal vector flat design`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=300&nologo=true`;
  };

  // Renders
  if (!profile) return <Onboarding onComplete={handleOnboardingComplete} />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-system-blue font-mono">
        <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-system-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl tracking-widest animate-pulse">CREATING INSTANCE DUNGEON...</h2>
        </div>
      </div>
    );
  }

  if (showMuscleSelector) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-2 md:p-4">
        <SystemWindow title="DUNGEON SELECTION" className="w-full max-w-lg">
          <div className="text-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-1 uppercase">Select Target Areas</h2>
            <p className="text-system-blue/70 text-[10px] uppercase tracking-widest font-mono">Simulated Combat Preparation</p>
          </div>
          
          <div className="mb-4 flex justify-center w-full">
             <MuscleSelector selectedMuscles={selectedMuscles} onToggle={toggleMuscleSelection} />
          </div>

          {/* TARGET ANALYSIS SUMMARY */}
          <div className="bg-black/40 border border-gray-800 p-3 mb-4 relative overflow-hidden">
             {/* Decorative Scanline */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-system-blue/30 animate-scan"></div>
             
             <h3 className="text-system-blue text-[10px] font-bold mb-2 uppercase tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 bg-system-blue rounded-full animate-pulse"></span>
               Target Analysis
             </h3>
             
             {selectedMuscles.length === 0 ? (
                <div className="text-center py-1">
                  <p className="text-gray-500 text-[10px] font-mono uppercase animate-pulse">No specific target locked</p>
                  <p className="text-white text-xs font-bold mt-1 uppercase tracking-wider glow">Mode: Full Body Sequence</p>
                </div>
             ) : (
                <div className="grid grid-cols-2 gap-2">
                  {selectedMuscles.map((muscle) => (
                    <div key={muscle} className="flex items-center justify-between bg-system-blue/5 border border-system-blue/20 px-2 py-1">
                       <span className="text-white text-[10px] font-bold uppercase">{muscle}</span>
                       <span className="text-[9px] text-system-green font-mono uppercase">READY</span>
                    </div>
                  ))}
                </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <SystemButton onClick={() => setShowMuscleSelector(false)} variant="ghost" className="text-xs">
               CANCEL
             </SystemButton>
             <SystemButton 
                onClick={confirmWorkoutCreation} 
                variant="primary"
                className={selectedMuscles.length === 0 ? "animate-pulse" : ""}
             >
               {selectedMuscles.length > 0 ? "ENTER GATE" : "FULL BODY"}
             </SystemButton>
          </div>
        </SystemWindow>
      </div>
    )
  }

  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(Number(bmi));

  return (
    <div className="min-h-screen text-white font-sans selection:bg-system-blue selection:text-white pb-24">
      
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="text-center transform scale-110">
            <div className="text-yellow-400 text-6xl font-bold tracking-tighter drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-bounce mb-2">
              LEVEL UP!
            </div>
            <p className="text-2xl font-mono text-white tracking-widest">LEVEL {gameState.level}</p>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-system-panel border-t border-system-blue z-40 flex justify-around items-stretch h-16 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
          <button 
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative overflow-hidden ${activeTab === 'status' ? 'text-system-blue bg-system-blue/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {activeTab === 'status' && <div className="absolute top-0 left-0 w-full h-0.5 bg-system-blue shadow-[0_0_10px_#00A2FF]"></div>}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Status</span>
          </button>
          
          <div className="w-[1px] bg-gray-800 h-full"></div>

          <button 
            onClick={() => setActiveTab('missions')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 relative overflow-hidden ${activeTab === 'missions' ? 'text-system-blue bg-system-blue/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {activeTab === 'missions' && <div className="absolute top-0 left-0 w-full h-0.5 bg-system-blue shadow-[0_0_10px_#00A2FF]"></div>}
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="text-[10px] font-bold tracking-widest uppercase">Quests</span>
          </button>
      </div>

      <div className="p-3 md:p-6 max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
        
        {/* === TAB: STATUS === */}
        {activeTab === 'status' && (
          <>
            {/* HEADER / STATUS CARD */}
            <SystemWindow>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-3 items-center border-b md:border-b-0 md:border-r border-gray-800 pb-3 md:pb-0 md:pr-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-system-blue/10 border border-system-blue flex items-center justify-center shrink-0">
                    <span className="text-xl md:text-2xl font-bold text-system-blue">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg md:text-xl font-bold uppercase tracking-wide truncate">{profile.name}</h1>
                    <p className="text-[10px] md:text-xs text-system-blue font-mono uppercase truncate">{gameState.jobTitle}</p>
                    <div className="mt-1 text-[10px] text-gray-500 font-mono">
                        STREAK: <span className="text-white">{gameState.streak} DAYS</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-center flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-white">LEVEL {gameState.level}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{gameState.currentXp} / {gameState.requiredXp}</span>
                  </div>
                  <ProgressBar current={gameState.currentXp} max={gameState.requiredXp} />
                </div>
              </div>
            </SystemWindow>

            {/* STATS GRID */}
            <div className="grid grid-cols-3 gap-2">
              <SystemWindow className="text-center py-2 px-1">
                <div className="text-[9px] md:text-[10px] text-gray-500 uppercase">STR</div>
                <div className="text-base md:text-lg font-bold text-white">{10 + Math.floor(gameState.level * 1.5)}</div>
              </SystemWindow>
              <SystemWindow className="text-center py-2 px-1">
                <div className="text-[9px] md:text-[10px] text-gray-500 uppercase">AGI</div>
                <div className="text-base md:text-lg font-bold text-white">{10 + Math.floor(gameState.level * 1.2)}</div>
              </SystemWindow>
              <SystemWindow className="text-center py-2 px-1">
                <div className="text-[9px] md:text-[10px] text-gray-500 uppercase">INT</div>
                <div className="text-base md:text-lg font-bold text-white">{10 + Math.floor(gameState.level * 0.8)}</div>
              </SystemWindow>
            </div>

            {/* PHYSICAL ANALYSIS (IMC) */}
            <SystemWindow title="ANÁLISE FÍSICA" className="py-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  
                  {/* Current IMC Display */}
                  <div className="text-center w-full md:w-auto">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">IMC CALCULADO</p>
                    <div className="text-3xl font-bold text-white font-mono">{bmi}</div>
                    <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${bmiCategory.color}`}>
                      {bmiCategory.label}
                    </div>
                  </div>

                  {/* IMC Table */}
                  <div className="w-full max-w-md">
                    <div className="grid grid-cols-2 text-[10px] uppercase font-mono border-b border-gray-800 pb-1 mb-1 text-gray-500">
                        <span>Categoria</span>
                        <span className="text-right">Intervalo</span>
                    </div>
                    <div className="space-y-1">
                        {[
                          { label: 'Abaixo do peso', range: '< 18.5', active: Number(bmi) < 18.5 },
                          { label: 'Normal', range: '18.5 - 24.9', active: Number(bmi) >= 18.5 && Number(bmi) <= 24.9 },
                          { label: 'Sobrepeso', range: '25.0 - 29.9', active: Number(bmi) >= 25.0 && Number(bmi) <= 29.9 },
                          { label: 'Obesidade', range: '> 30.0', active: Number(bmi) >= 30.0 },
                        ].map((row) => (
                          <div key={row.label} className={`flex justify-between items-center text-[10px] p-1 ${row.active ? 'bg-system-blue/20 border border-system-blue text-white' : 'text-gray-500'}`}>
                              <span>{row.label}</span>
                              <span className="font-mono">{row.range}</span>
                          </div>
                        ))}
                    </div>
                  </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800 text-[10px] text-gray-500 font-mono flex justify-between">
                <span>Weight: {profile.weight}kg</span>
                <span>Height: {profile.height}cm</span>
              </div>
            </SystemWindow>
          </>
        )}

        {/* === TAB: MISSIONS === */}
        {activeTab === 'missions' && (
          <>
             {/* NOTIFICATION BOX */}
            <SystemWindow title="MESSAGE" type="normal" className="min-h-[80px] flex items-center">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-system-blue animate-ping shrink-0"></div>
                <div className="font-mono text-xs md:text-sm text-system-text leading-relaxed w-full">
                    {motivation ? <Typewriter text={motivation} speed={20} /> : <span className="animate-pulse">Retrieving system data...</span>}
                </div>
              </div>
            </SystemWindow>

            {!dailyPlan ? (
              <SystemWindow title="QUEST ALERT" className="text-center py-8 md:py-10" type="warning">
                <div className="mb-4 text-red-500 animate-pulse">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-lg md:text-xl font-bold mb-2 uppercase tracking-wide">Daily Quest Available</h2>
                <p className="text-gray-400 text-xs md:text-sm mb-6 max-w-md mx-auto px-4">
                  Failing to complete the daily training will result in a penalty. Prepare your body for the upcoming dungeon.
                </p>
                <SystemButton onClick={() => setShowMuscleSelector(true)} className="w-full md:w-auto">
                  ACCEPT QUEST
                </SystemButton>
              </SystemWindow>
            ) : (
              /* THE DAILY QUEST UI */
              <div className="relative pt-2">
                <div className="absolute top-0 left-0 right-0 text-center z-20 pointer-events-none">
                    <span className="bg-system-dark border border-system-blue px-4 py-0.5 text-system-blue font-bold tracking-widest text-[10px] md:text-sm uppercase shadow-[0_0_15px_rgba(0,162,255,0.4)]">
                      Quest Info
                    </span>
                </div>
                
                <SystemWindow className="pt-6 md:pt-8 border-2" type={dailyPlan.isDoubleXpEvent ? 'warning' : 'normal'}>
                    
                    {dailyPlan.isDoubleXpEvent && (
                      <div className="absolute top-2 right-2 text-red-500 text-[9px] uppercase font-bold border border-red-500 px-1.5 py-0.5 animate-pulse">
                        Boss (2x XP)
                      </div>
                    )}

                    <div className="text-center mb-6 border-b border-gray-800 pb-3">
                      <h2 className="text-lg md:text-2xl font-bold uppercase text-white mb-1 tracking-widest">
                        Prepare to be Strong
                      </h2>
                      <p className="text-gray-400 text-[10px] font-mono uppercase">
                        Goal: {dailyPlan.exercises.every(e => e.completed) ? <span className="text-system-green">COMPLETE</span> : <span className="text-white">INCOMPLETE</span>}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {dailyPlan.exercises.map((ex) => {
                        const isExpanded = expandedExerciseId === ex.id;
                        return (
                          <div 
                            key={ex.id} 
                            onClick={() => toggleExpandExercise(ex.id)}
                            className={`
                              group relative flex flex-col md:flex-row gap-3 p-3 bg-black/40 border transition-all duration-300 cursor-pointer
                              ${ex.completed ? 'border-system-green/50 opacity-60' : isExpanded ? 'border-system-blue bg-system-blue/5' : 'border-gray-800 hover:border-system-blue/50'}
                              ${ex.skipped ? 'border-red-900 opacity-40 grayscale' : ''}
                              ${ex.isHiddenBoss ? 'border-red-600 bg-red-900/10' : ''}
                            `}
                          >
                            <div className="flex items-start gap-3 w-full">
                              {/* Custom Checkbox */}
                              <button
                                onClick={(e) => !ex.skipped && toggleExercise(ex.id, e)}
                                className={`
                                  w-10 h-10 md:w-8 md:h-8 shrink-0 border-2 flex items-center justify-center transition-all touch-manipulation
                                  ${ex.completed ? 'bg-system-green border-system-green' : 'border-gray-600 hover:border-system-blue'}
                                  ${ex.isHiddenBoss && !ex.completed ? 'border-red-500' : ''}
                                `}
                              >
                                {ex.completed && <span className="text-black font-bold text-lg">✓</span>}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="pr-6">
                                      <h4 className={`text-xs md:text-base font-bold uppercase ${ex.completed ? 'text-system-green line-through' : 'text-white'} ${!isExpanded && 'truncate'}`}>
                                        {ex.name}
                                      </h4>
                                      <span className="text-[10px] md:text-xs font-mono text-system-blue block mt-0.5">
                                        {ex.sets} SETS × {ex.reps} REPS
                                      </span>
                                    </div>
                                    <button 
                                      onClick={(e) => skipExercise(ex.id, e)}
                                      className="p-1 -mr-1 text-gray-600 hover:text-red-500 transition-colors touch-manipulation z-20"
                                      title="Skip"
                                    >
                                      ✕
                                    </button>
                                </div>
                                
                                {/* Description Area */}
                                <div className={`mt-2 text-gray-400 transition-all ${isExpanded ? 'animate-fade-in' : ''}`}>
                                  {isExpanded ? (
                                    <div className="space-y-3">
                                      <p className="text-xs md:text-sm leading-relaxed text-gray-300 border-l-2 border-system-blue pl-2">
                                        {ex.description}
                                      </p>
                                      
                                      {/* Mobile Image (Visible only when expanded on mobile) */}
                                      <div className="w-full aspect-video md:hidden rounded border border-gray-800 overflow-hidden mt-2">
                                         <img src={getExerciseImageUrl(ex.name)} alt={ex.name} className="w-full h-full object-cover grayscale opacity-80" />
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] md:text-[10px] leading-tight line-clamp-1">{ex.description}</p>
                                  )}
                                </div>
                                
                                {/* Expansion Chevron */}
                                <div className="flex justify-center mt-1 md:hidden opacity-50">
                                  <svg 
                                    className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              {/* Desktop Image Preview (Always hidden on mobile, block on desktop) */}
                              <div className="w-20 h-20 shrink-0 bg-black border border-gray-800 overflow-hidden hidden md:block group-hover:border-system-blue transition-colors self-center">
                                <img src={getExerciseImageUrl(ex.name)} alt="" className="w-full h-full object-cover grayscale opacity-70 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Warning */}
                    <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                      <p className="text-[9px] text-gray-500 font-mono mb-4 uppercase">
                        * Incomplete quests will not provide full rewards.
                      </p>
                      <SystemButton 
                        onClick={completeDailyQuest}
                        disabled={dailyPlan.exercises.every(e => !e.completed && !e.skipped)}
                        className="w-full"
                        variant={dailyPlan.exercises.every(e => e.completed) ? 'success' : 'primary'}
                      >
                        {dailyPlan.exercises.every(e => e.completed) ? 'COLLECT REWARD' : 'COMPLETE QUEST'}
                      </SystemButton>
                    </div>

                </SystemWindow>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;