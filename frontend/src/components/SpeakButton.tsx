'use client';

import { motion } from 'framer-motion';

interface SpeakButtonProps {
  text: string;
  lang?: string;
}

export function SpeakButton({ text, lang = 'es-ES' }: SpeakButtonProps) {
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering parent clicks (like selecting a tile)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleSpeak}
      className="w-8 h-8 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center hover:bg-secondary-fixed transition-colors"
      title="Listen"
      type="button"
    >
      <span className="material-symbols-outlined text-sm font-black">volume_up</span>
    </motion.button>
  );
}
