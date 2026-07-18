'use client';

import { SpeakButton } from '../SpeakButton';
import { getExerciseInstruction, getSpeechLanguage } from './exerciseCopy';

interface MultipleChoiceProps {
  exercise: any;
  onSelectAnswer: (answer: string) => void;
  currentAnswer: string | null;
  courseLanguageLabel?: string;
}

export default function MultipleChoice({ exercise, onSelectAnswer, currentAnswer, courseLanguageLabel }: MultipleChoiceProps) {
  const options: string[] = exercise.options || [];
  const instruction = getExerciseInstruction(exercise, courseLanguageLabel);
  const speechLang = getSpeechLanguage(courseLanguageLabel);

  return (
    <div className="w-full flex flex-col gap-6 items-center">
      <h1 className="text-2xl md:text-3xl font-black text-on-surface mb-8 text-center">
        {exercise.prompt}
      </h1>

      <p className="text-base md:text-lg font-semibold text-on-surface-variant text-center -mt-4">
        {instruction}
      </p>

      {exercise.audio_text && (
        <div className="mb-4">
          <SpeakButton text={exercise.audio_text} lang={speechLang} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        {options.map((opt) => {
          const isSelected = currentAnswer === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelectAnswer(opt)}
              className={`rounded-xl p-6 text-center outline-none border-2 transition-all font-bold text-lg select-none ${isSelected
                  ? 'bg-primary-container/20 border-primary text-primary border-b-2 translate-y-[2px]'
                  : 'bg-surface border-surface-container-highest border-b-4 hover:bg-surface-container-low text-on-surface active:translate-y-[2px] active:border-b-2'
                }`}
            >
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
