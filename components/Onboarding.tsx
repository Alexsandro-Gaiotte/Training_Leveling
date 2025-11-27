import React, { useState } from 'react';
import { UserProfile } from '../types';
import { SystemWindow, SystemButton } from './SystemUI';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: 'male', // Default
    experienceLevel: 'beginner',
    goal: 'lose_weight',
    metabolism: 'average'
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        ...formData,
        onboarded: true,
      } as UserProfile);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-system-dark relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none"></div>

      <SystemWindow title="INICIAÇÃO DO JOGADOR" className="w-full max-w-lg z-10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">Perfil do Caçador</h2>
          <p className="text-gray-400 text-sm">Responda honestamente para calibrar o sistema.</p>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-system-blue text-sm mb-1 uppercase">Nome de Caçador</label>
              <input 
                type="text" 
                className="w-full bg-black/50 border border-gray-700 p-2 text-white focus:border-system-blue outline-none"
                placeholder="Ex: Jin-Woo"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-system-blue text-sm mb-1 uppercase">Gênero</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setFormData({...formData, gender: 'male'})}
                  className={`flex-1 p-2 border ${formData.gender === 'male' ? 'border-system-blue bg-system-blue/20 text-white shadow-[0_0_10px_rgba(0,162,255,0.3)]' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                >
                  MASCULINO
                </button>
                <button 
                  onClick={() => setFormData({...formData, gender: 'female'})}
                  className={`flex-1 p-2 border ${formData.gender === 'female' ? 'border-system-blue bg-system-blue/20 text-white shadow-[0_0_10px_rgba(0,162,255,0.3)]' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                >
                  FEMININO
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-system-blue text-sm mb-1 uppercase">Idade</label>
                <input 
                  type="number" 
                  className="w-full bg-black/50 border border-gray-700 p-2 text-white focus:border-system-blue outline-none"
                  value={formData.age || ''}
                  onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-system-blue text-sm mb-1 uppercase">Peso (kg)</label>
                <input 
                  type="number" 
                  className="w-full bg-black/50 border border-gray-700 p-2 text-white focus:border-system-blue outline-none"
                  value={formData.weight || ''}
                  onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
                <label className="block text-system-blue text-sm mb-1 uppercase">Altura (cm)</label>
                <input 
                  type="number" 
                  className="w-full bg-black/50 border border-gray-700 p-2 text-white focus:border-system-blue outline-none"
                  value={formData.height || ''}
                  onChange={e => setFormData({...formData, height: Number(e.target.value)})}
                />
              </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
             <div>
              <label className="block text-system-blue text-sm mb-2 uppercase">Nível de Experiência</label>
              <div className="grid grid-cols-3 gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({...formData, experienceLevel: level})}
                    className={`p-2 border text-xs uppercase ${formData.experienceLevel === level ? 'border-system-blue bg-system-blue/20 text-white' : 'border-gray-700 text-gray-500'}`}
                  >
                    {level === 'beginner' ? 'Rank E' : level === 'intermediate' ? 'Rank B' : 'Rank S'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-system-blue text-sm mb-2 uppercase">Objetivo Principal</label>
              <select 
                className="w-full bg-black/50 border border-gray-700 p-2 text-white focus:border-system-blue outline-none"
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value as any})}
              >
                <option value="lose_weight">Perder Peso (Assassino)</option>
                <option value="gain_muscle">Ganhar Músculo (Tanque)</option>
                <option value="endurance">Resistência (Ranger)</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in text-center">
            <h3 className="text-xl text-system-blue">Calibrando Sistema...</h3>
            <p className="text-gray-400">Metabolismo estimado:</p>
             <div className="grid grid-cols-3 gap-2 mt-2">
                {(['slow', 'average', 'fast'] as const).map((meta) => (
                  <button
                    key={meta}
                    onClick={() => setFormData({...formData, metabolism: meta})}
                    className={`p-2 border text-xs uppercase ${formData.metabolism === meta ? 'border-system-blue bg-system-blue/20 text-white' : 'border-gray-700 text-gray-500'}`}
                  >
                    {meta === 'slow' ? 'Lento' : meta === 'average' ? 'Médio' : 'Rápido'}
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 border border-system-blue/30 bg-black/40">
                <p className="text-sm text-yellow-500">AVISO: O descumprimento das missões diárias resultará em penalidade.</p>
              </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <SystemButton onClick={handleNext} disabled={step === 1 && (!formData.name || !formData.weight)}>
            {step === 3 ? 'ACEITAR MISSÃO' : 'PRÓXIMO'}
          </SystemButton>
        </div>
      </SystemWindow>
    </div>
  );
};

export default Onboarding;