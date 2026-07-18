'use client';

import { useState } from 'react';
import { SpeakButton } from '../SpeakButton';
import { motion, LayoutGroup } from 'framer-motion';

export default function Translate({ exercise, onSelectAnswer }: { exercise: any, onSelectAnswer: (answer: string) => void }) {
  const options: string[] = exercise.options || [];
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(options);

  const handleSelect = (word: string) => {
    setAvailableWords(prev => prev.filter(w => w !== word));
    setSelectedWords(prev => {
      const next = [...prev, word];
      onSelectAnswer(next.join(' '));
      return next;
    });
  };

  const handleDeselect = (word: string) => {
    setSelectedWords(prev => {
      const next = prev.filter(w => w !== word);
      onSelectAnswer(next.join(' '));
      return next;
    });
    setAvailableWords(prev => [...prev, word]);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-black text-on-surface mb-4">
        {exercise.prompt}
      </h1>

      {exercise.audio_text && (
        <div className="flex items-center gap-4 mb-4 bg-surface p-4 rounded-xl border-2 border-surface-container-highest w-max">
          <SpeakButton text={exercise.audio_text} />
          <span className="font-bold text-lg">{exercise.audio_text}</span>
        </div>
      )}

      {options.length > 0 ? (
        <LayoutGroup>
          {/* Answer Box */}
          <div className="min-h-[60px] border-b-2 border-surface-container-highest pb-4 flex flex-wrap gap-2 items-end mb-8">
            {selectedWords.map((word, i) => (
              <motion.button
                layout
                key={word + i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => handleDeselect(word)}
                className="bg-surface border-2 border-surface-container-highest border-b-4 border-b-surface-dim px-4 py-2 rounded-xl font-bold active:translate-y-[2px] active:border-b-2"
              >
                {word}
              </motion.button>
            ))}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
            {availableWords.map((word, i) => (
              <motion.button
                layout
                key={word + i}
                onClick={() => handleSelect(word)}
                className="bg-surface border-2 border-surface-container-highest border-b-4 border-b-surface-dim px-4 py-2 rounded-xl font-bold active:translate-y-[2px] active:border-b-2"
              >
                {word}
              </motion.button>
            ))}
          </div>
        </LayoutGroup>
      ) : (
        <div className="w-full mt-4">
          <textarea
            autoFocus
            className="w-full bg-surface-container-lowest border-2 border-surface-container-highest rounded-xl p-4 font-bold text-lg text-on-surface focus:border-primary focus:bg-primary-container/10 transition-colors outline-none min-h-[120px] resize-none" 
            onChange={e => onSelectAnswer(e.target.value)} 
            placeholder="Type your translation here..." 
          />
        </div>
      )}
    </div>
  );
}
