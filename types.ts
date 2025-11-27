

export type MuscleGroup = 'Peito' | 'Dorsal' | 'Pernas' | 'Ombros' | 'Bíceps' | 'Tríceps';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female'; // Added gender
  weight: number;
  height: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: 'lose_weight' | 'gain_muscle' | 'endurance';
  metabolism: 'slow' | 'average' | 'fast';
  onboarded: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  description: string;
  completed: boolean;
  skipped: boolean;
  isHiddenBoss?: boolean; // For the 10% chance event
}

export interface WorkoutPlan {
  id: string;
  createdAt: number; // timestamp
  exercises: Exercise[];
  baseXp: number;
  isDoubleXpEvent: boolean;
  completedAt?: number;
  focus?: string[];
}

export interface GameState {
  level: number;
  currentXp: number;
  requiredXp: number;
  streak: number;
  lastLogin: string; // ISO date string
  jobTitle: string; // e.g., "Necromancer", "Shadow Monarch"
}