'use client';

import { useState, useEffect } from 'react';
import { SpeakButton } from '../SpeakButton';
import { getExerciseInstruction, getSpeechLanguage } from './exerciseCopy';

interface MatchPairsProps {
  exercise: any;
  onSelectAnswer: (answer: any) => void;
  courseLanguageLabel?: string;
}

export default function MatchPairs({ exercise, onSelectAnswer, courseLanguageLabel }: MatchPairsProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});

  const optionsList = Array.isArray(exercise.options) ? exercise.options : [];
  const leftWords = optionsList.map((opt: any) => opt.left);
  const rightWords = optionsList.map((opt: any) => opt.right);
  const instruction = getExerciseInstruction(exercise, courseLanguageLabel);
  const speechLang = getSpeechLanguage(courseLanguageLabel);

  const [shuffledLeft, setShuffledLeft] = useState<string[]>([]);
  const [shuffledRight, setShuffledRight] = useState<string[]>([]);

  useEffect(() => {
    setShuffledLeft([...leftWords].sort(() => Math.random() - 0.5));
    setShuffledRight([...rightWords].sort(() => Math.random() - 0.5));
    setMatchedPairs({});
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [exercise]);

  const checkAndEmit = (updatedPairs: Record<string, string>) => {
    // Once all unique options are successfully mapped out, pass it up to enable 'Check'
    if (Object.keys(updatedPairs).length === optionsList.length) {
      // The backend expects an array of objects: [{ left: "A", right: "B" }] in the EXACT original order.
      const formattedForBackend = optionsList.map((opt: any) => ({
        left: opt.left,
        right: updatedPairs[opt.left]
      }));
      onSelectAnswer(formattedForBackend);
    }
  };

  const handleLeftClick = (word: string) => {
    if (matchedPairs[word]) return;
    if (word === selectedLeft) {
      setSelectedLeft(null);
      return;
    }

    if (selectedRight) {
      // Check if it's a valid match based on our standard options template
      const isValidMatch = optionsList.some((opt: any) => opt.left === word && opt.right === selectedRight);
      if (isValidMatch) {
        const newPairs = { ...matchedPairs, [word]: selectedRight };
        setMatchedPairs(newPairs);
        checkAndEmit(newPairs);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedLeft(word);
    }
  };

  const handleRightClick = (word: string) => {
    if (Object.values(matchedPairs).includes(word)) return;
    if (word === selectedRight) {
      setSelectedRight(null);
      return;
    }

    if (selectedLeft) {
      const isValidMatch = optionsList.some((opt: any) => opt.left === selectedLeft && opt.right === word);
      if (isValidMatch) {
        const newPairs = { ...matchedPairs, [selectedLeft]: word };
        setMatchedPairs(newPairs);
        checkAndEmit(newPairs);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      setSelectedRight(word);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-black text-on-surface mb-4">
        {exercise.prompt || 'Match the pairs'}
      </h1>

      <p className="text-base md:text-lg font-semibold text-on-surface-variant -mt-2">
        {instruction}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left Column */}
        <div className="flex flex-col gap-3">
          {shuffledLeft.map(word => {
            const isMatched = !!matchedPairs[word];
            const isSelected = selectedLeft === word;
            return (
              <div
                key={word}
                onClick={() => handleLeftClick(word)}
                role="button"
                tabIndex={isMatched ? -1 : 0}
                className={`rounded-xl p-4 flex items-center justify-between text-left outline-none cursor-pointer transition-all border-2 select-none ${isSelected
                    ? 'bg-primary-container/20 border-primary text-primary border-b-2 translate-y-[2px]'
                    : 'bg-surface border-surface-container-highest border-b-4 hover:bg-surface-container-low text-on-surface active:translate-y-[2px] active:border-b-2'
                  } ${isMatched ? 'opacity-50 bg-surface-container-highest pointer-events-none' : ''}`}
              >
                <span className="font-bold text-lg">{word}</span>
              </div>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-3">
          {shuffledRight.map(word => {
            const isMatched = Object.values(matchedPairs).includes(word);
            const isSelected = selectedRight === word;
            return (
              <div
                key={word}
                onClick={() => handleRightClick(word)}
                role="button"
                tabIndex={isMatched ? -1 : 0}
                className={`rounded-xl p-4 flex items-center justify-between text-left outline-none cursor-pointer transition-all border-2 select-none ${isSelected
                    ? 'bg-primary-container/20 border-primary text-primary border-b-2 translate-y-[2px]'
                    : 'bg-surface border-surface-container-highest border-b-4 hover:bg-surface-container-low text-on-surface active:translate-y-[2px] active:border-b-2'
                  } ${isMatched ? 'opacity-50 bg-surface-container-highest pointer-events-none' : ''}`}
              >
                <span className="font-bold text-lg flex items-center gap-2">
                  {!isMatched && <SpeakButton text={word} lang={speechLang} />}
                  {word}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
