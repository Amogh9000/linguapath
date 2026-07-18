'use client';

import { motion } from 'framer-motion';
import { playClick } from '@/lib/sounds';

interface FeedbackSheetProps {
  status: 'correct' | 'incorrect' | null;
  correctAnswer?: string;
  onContinue: () => void;
}

export function FeedbackSheet({ status, correctAnswer, onContinue }: FeedbackSheetProps) {
  if (!status) return null;

  const isCorrect = status === 'correct';

  return (
    <motion.div 
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 200, opacity: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className={`fixed bottom-0 left-0 right-0 z-50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t-2 ${
        isCorrect ? 'bg-primary-container border-primary text-on-primary-container' : 'bg-error-container border-error text-on-error-container'
      }`}
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
          isCorrect ? 'bg-white text-green-600' : 'bg-white text-red-500'
        }`}>
          <span className="material-symbols-outlined text-3xl font-black">
            {isCorrect ? 'check' : 'close'}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-black mb-1">
            {isCorrect ? 'Excellent!' : 'Incorrect'}
          </h2>
          {!isCorrect && correctAnswer && (
            <p className="font-bold opacity-90">
              Correct answer: <span className="font-black">{correctAnswer}</span>
            </p>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => {
          playClick();
          onContinue();
        }}
        className={`w-full md:w-auto px-12 py-4 rounded-2xl font-black text-xl text-center uppercase tracking-wider ${
          isCorrect ? 'btn-3d-primary bg-primary text-white border-[#1e5000]' : 'btn-3d-danger bg-error text-white border-[#93000a]'
        }`}
      >
        Continue
      </button>
    </motion.div>
  );
}
