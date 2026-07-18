'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLessonStore } from '@/lib/store';
import { FeedbackSheet } from '@/components/FeedbackSheet';
import { motion, AnimatePresence } from 'framer-motion';
import { playCorrect, playIncorrect, playClick } from '@/lib/sounds';
import MascotAvatar from '@/components/MascotAvatar';
import * as T from '@/lib/types';

import MatchPairs from '@/components/exercises/MatchPairs';
import MultipleChoice from '@/components/exercises/MultipleChoice';
import Translate from '@/components/exercises/Translate';

const FillBlank = ({ exercise, onSelectAnswer }: any) => (
  <Translate exercise={exercise} onSelectAnswer={onSelectAnswer} />
);
const TypeAnswer = ({ exercise, onSelectAnswer }: any) => (
  <div className="flex flex-col gap-4">
    <h1 className="text-2xl font-black">{exercise.prompt}</h1>
    <input
      autoFocus
      className="w-full bg-surface border-2 border-surface-container-highest rounded-xl p-4 font-bold text-lg focus:border-secondary outline-none"
      onChange={(e) => onSelectAnswer(e.target.value)}
      placeholder="Type here in the correct language"
    />
  </div>
);

type AvatarConfig = {
  outfit: string;
  accessory: string | null;
  color: string;
};

const DEFAULT_AVATAR: AvatarConfig = {
  outfit: 'Classic',
  accessory: null,
  color: 'Green',
};

export default function LessonPlayer({ params }: { params: { lessonId: string } }) {
  const router = useRouter();
  const store = useLessonStore();
  const [loading, setLoading] = useState(true);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'correct' | 'incorrect' | null;
    correctAnswer?: string;
  }>({ status: null });
  const [showComplete, setShowComplete] = useState<any>(null);
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);

  useEffect(() => {
    async function init() {
      try {
        const [stats, me, res] = await Promise.all([
          api.getStats(),
          api.getMe().catch(() => null),
          api.startLesson(parseInt(params.lessonId, 10)),
        ]);
        store.startSession(res.session_id, res.exercises, stats.hearts_current);
        const cfg = (me as T.UserResponse | null)?.avatar_config;
        if (cfg) {
          setAvatar({
            outfit: cfg.outfit || 'Classic',
            accessory: cfg.accessory || null,
            color: cfg.color || 'Green',
          });
        }
      } catch (err) {
        console.error(err);
        router.push('/learn');
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => store.clearSession();
  }, [params.lessonId]);

  if (loading || !store.sessionId) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const exercise = store.exercises[store.currentIndex];
  const progressPercent = (store.currentIndex / store.exercises.length) * 100;

  const mascotLine =
    feedback.status === 'correct'
      ? 'Nice one!'
      : feedback.status === 'incorrect'
        ? 'Almost — keep going!'
        : "You're doing great!";

  const handleCheck = async () => {
    if (!currentAnswer || submitting) return;
    playClick();
    setSubmitting(true);
    try {
      const res = await api.submitAnswer(store.sessionId as number, {
        exercise_id: exercise.id,
        response: currentAnswer,
      });
      let formattedAnswer = String(res.correct_answer);
      if (Array.isArray(res.correct_answer)) {
        formattedAnswer = res.correct_answer
          .map((item: any) => {
            if (item && typeof item === 'object' && 'left' in item && 'right' in item) {
              return `${item.left} = ${item.right}`;
            }
            return String(item);
          })
          .join(', ');
      } else if (typeof res.correct_answer === 'object' && res.correct_answer !== null) {
        formattedAnswer = Object.entries(res.correct_answer)
          .map(([k, v]) => `${k} = ${v}`)
          .join(', ');
      }

      if (res.is_correct) {
        playCorrect();
      } else {
        playIncorrect();
      }

      setFeedback({
        status: res.is_correct ? 'correct' : 'incorrect',
        correctAnswer: res.is_correct ? undefined : formattedAnswer,
      });
      if (!res.is_correct) {
        store.recordMistake(res.hearts_remaining);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = async () => {
    setFeedback({ status: null });
    setCurrentAnswer(null);

    if (store.status === 'failed') {
      router.push('/learn');
      return;
    }

    if (store.currentIndex < store.exercises.length - 1) {
      store.nextExercise();
    } else {
      try {
        const res = await api.completeLesson(store.sessionId as number);
        setShowComplete(res);
        store.completeSession();
      } catch (err) {
        console.error(err);
        router.push('/learn');
      }
    }
  };

  if (showComplete) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-surface-container-lowest">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <MascotAvatar
            outfit={avatar.outfit}
            accessory={avatar.accessory}
            color={avatar.color}
            size={160}
            className="mb-4 drop-shadow-lg"
          />
          <h1 className="text-4xl font-black text-primary mb-2">Lesson Complete!</h1>
          <div className="flex gap-4 mt-8">
            <div className="tile-3d rounded-xl p-6 bg-tertiary-container text-on-tertiary-container border-[#ddad00]">
              <div className="font-bold">XP Earned</div>
              <div className="text-3xl font-black">+{showComplete.xp_earned}</div>
            </div>
            <div className="tile-3d rounded-xl p-6 bg-secondary-container text-on-secondary-container border-[#004c6e]">
              <div className="font-bold">Streak</div>
              <div className="text-3xl font-black">{showComplete.new_streak}</div>
            </div>
          </div>
          <button
            onClick={() => router.push('/learn')}
            className="btn-3d-primary bg-primary text-white rounded-xl px-12 py-4 text-xl font-black mt-12 w-full max-w-sm"
          >
            Continue
          </button>
        </motion.div>
      </div>
    );
  }

  const ExerciseComponent =
    {
      match_pairs: MatchPairs,
      multiple_choice: MultipleChoice,
      translate: Translate,
      fill_blank: FillBlank,
      type_answer: TypeAnswer,
    }[exercise?.type] || TypeAnswer;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <header className="flex items-center justify-between px-5 py-4 bg-surface z-10 w-full max-w-[1200px] mx-auto">
        <button
          onClick={() => router.push('/learn')}
          className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
        <div className="flex-1 mx-4">
          <div className="h-4 bg-surface-container-highest rounded-full overflow-hidden w-full relative">
            <motion.div
              className="h-full bg-primary-container rounded-full absolute left-0 top-0"
              initial={{
                width: `${(Math.max(0, store.currentIndex - 1) / store.exercises.length) * 100}%`,
              }}
              animate={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"></div>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-error font-black text-xl">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <span>{store.hearts}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center justify-center w-full max-w-4xl mx-auto pb-28">
        <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-between h-full">
          {/* Customized 2D mascot — matches profile choices, static */}
          <div className="flex flex-col items-center justify-start w-full md:w-1/4 pt-2 md:pt-12 shrink-0">
            <div className="w-28 h-28 md:w-48 md:h-48 flex items-center justify-center">
              <MascotAvatar
                outfit={avatar.outfit}
                accessory={avatar.accessory}
                color={avatar.color}
                size={192}
                className="w-full h-full drop-shadow-md"
              />
            </div>
            <div
              className={`mt-3 md:mt-4 bg-surface p-3 md:p-4 rounded-xl rounded-tl-none border-2 shadow-sm relative text-center max-w-[200px] ${
                feedback.status === 'correct'
                  ? 'border-primary text-primary'
                  : feedback.status === 'incorrect'
                    ? 'border-error text-error'
                    : 'border-surface-container-highest text-on-surface'
              }`}
            >
              <p className="font-bold text-base md:text-lg">{mascotLine}</p>
            </div>
          </div>

          <div className="w-full md:w-3/4 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={exercise?.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <ExerciseComponent
                  exercise={exercise}
                  onSelectAnswer={setCurrentAnswer}
                  currentAnswer={currentAnswer}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {!feedback.status && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-surface border-t-2 border-surface-container-highest flex justify-center z-40">
          <button
            disabled={!currentAnswer || submitting}
            onClick={handleCheck}
            className={`w-full max-w-xl py-4 rounded-2xl font-black text-xl text-center uppercase tracking-wider transition-all select-none ${
              currentAnswer
                ? 'bg-green-500 text-white border-b-4 border-green-700 active:border-b-0 active:translate-y-[4px]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed border-b-4 border-gray-300'
            }`}
          >
            Check
          </button>
        </div>
      )}

      <AnimatePresence>
        {feedback.status && (
          <FeedbackSheet
            status={feedback.status}
            correctAnswer={feedback.correctAnswer}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {store.status === 'failed' && !feedback.status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          >
            <div className="bg-surface rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center">
              <MascotAvatar
                outfit={avatar.outfit}
                accessory={avatar.accessory}
                color={avatar.color}
                size={96}
                className="mb-2"
              />
              <span
                className="material-symbols-outlined text-5xl text-error mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                heart_broken
              </span>
              <h2 className="text-2xl font-black mb-2">Out of Hearts!</h2>
              <p className="font-bold text-on-surface-variant mb-6">
                You&apos;ve made too many mistakes. Wait for hearts to refill or use coins.
              </p>
              <button
                onClick={() => router.push('/learn')}
                className="btn-3d-neutral bg-surface-container-highest w-full py-4 rounded-xl font-black"
              >
                End Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
