import { create } from 'zustand';
import { ExerciseOut } from './types';

interface LessonState {
  sessionId: number | null;
  exercises: ExerciseOut[];
  currentIndex: number;
  hearts: number;
  mistakes: number;
  status: 'in_progress' | 'completed' | 'failed' | 'idle';
  
  startSession: (sessionId: number, exercises: ExerciseOut[], initialHearts: number) => void;
  nextExercise: () => void;
  recordMistake: (heartsRemaining: number) => void;
  completeSession: () => void;
  failSession: () => void;
  clearSession: () => void;
}

export const useLessonStore = create<LessonState>((set: any) => ({
  sessionId: null,
  exercises: [],
  currentIndex: 0,
  hearts: 5,
  mistakes: 0,
  status: 'idle',

  startSession: (sessionId: number, exercises: ExerciseOut[], initialHearts: number) => set({
    sessionId,
    exercises,
    currentIndex: 0,
    hearts: initialHearts,
    mistakes: 0,
    status: 'in_progress'
  }),

  nextExercise: () => set((state: LessonState) => ({
    currentIndex: state.currentIndex + 1
  })),

  recordMistake: (heartsRemaining: number) => set((state: LessonState) => ({
    hearts: heartsRemaining,
    mistakes: state.mistakes + 1,
    status: heartsRemaining <= 0 ? 'failed' : state.status
  })),

  completeSession: () => set({ status: 'completed' }),
  failSession: () => set({ status: 'failed' }),
  
  clearSession: () => set({
    sessionId: null,
    exercises: [],
    currentIndex: 0,
    status: 'idle'
  })
}));
