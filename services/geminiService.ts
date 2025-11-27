
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Exercise } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDailyMotivation = async (level: number, streak: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the "System" from Solo Leveling. The player is Level ${level} and has a streak of ${streak} days. 
      Generate a short, mysterious, and motivating message (max 2 sentences) in Portuguese (Brazil). 
      Make it sound like a system notification or a warning from a powerful entity.`,
    });
    return response.text || "O Sistema aguarda o seu progresso.";
  } catch (error) {
    console.error("Error generating motivation:", error);
    return "Complete a Missão Diária para sobreviver.";
  }
};

export const generateWorkoutPlan = async (profile: UserProfile, focusMuscles: string[] = []): Promise<Exercise[]> => {
  const muscleString = focusMuscles.length > 0 ? focusMuscles.join(", ") : "Corpo Todo (Full Body)";
  
  const prompt = `
    Atue como uma IA treinadora de elite no sistema gamificado Solo Leveling.
    Perfil do Jogador:
    - Experiência: ${profile.experienceLevel}
    - Objetivo: ${profile.goal}
    - Peso: ${profile.weight}kg
    - Altura: ${profile.height}cm
    - Foco do Treino de Hoje: ${muscleString}
    
    Crie uma lista de treino com 4 a 6 exercícios.
    Se houver foco muscular definido, priorize exercícios para essas áreas.
    
    Requisitos OBRIGATÓRIOS:
    1. Nome do exercício em Português (Brasil).
    2. Sets (séries) e Reps (repetições) adequados ao objetivo.
    3. Descrição detalhada da execução em Português.
    4. Resposta estritamente em JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.STRING },
              reps: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["name", "sets", "reps", "description"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    
    return data.map((item: any) => ({
      id: crypto.randomUUID(),
      name: item.name,
      sets: item.sets,
      reps: item.reps,
      description: item.description,
      completed: false,
      skipped: false
    }));

  } catch (error) {
    console.error("Error generating workout:", error);
    // Fallback workout
    return [
      { id: '1', name: 'Flexões de Braço', sets: '3', reps: '10', description: 'Mantenha o corpo reto e desça até o peito tocar o chão.', completed: false, skipped: false },
      { id: '2', name: 'Agachamento Livre', sets: '3', reps: '15', description: 'Pés na largura dos ombros, desça como se fosse sentar em uma cadeira.', completed: false, skipped: false },
      { id: '3', name: 'Abdominal Supra', sets: '3', reps: '20', description: 'Deitado, eleve o tronco contraindo o abdômen.', completed: false, skipped: false },
      { id: '4', name: 'Polichinelos', sets: '1', reps: '50', description: 'Saltos coordenados abrindo e fechando braços e pernas.', completed: false, skipped: false },
    ];
  }
};

export const generateHiddenQuest = async (): Promise<Exercise> => {
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: "Gere UM exercício extremamente difícil (calistênico ou com peso do corpo) para uma 'Missão Oculta' (Hidden Quest). Retorne JSON com name (em português), sets, reps, description (em português).",
       config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.STRING },
              reps: { type: Type.STRING },
              description: { type: Type.STRING }
            }
        }
       }
     });
     
     const data = JSON.parse(response.text);
     return {
       id: 'hidden-boss',
       name: data.name,
       sets: data.sets,
       reps: data.reps,
       description: data.description,
       completed: false,
       skipped: false,
       isHiddenBoss: true
     };
   } catch (e) {
     return {
       id: 'hidden-boss',
       name: "Burpees da Morte",
       sets: "3",
       reps: "MAX",
       description: "Faça o máximo que aguentar até a falha total.",
       completed: false,
       skipped: false,
       isHiddenBoss: true
     };
   }
}
