'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SpeakButtonProps {
  text: string;
  lang?: string;
}

export function SpeakButton({ text, lang = 'ja-JP' }: SpeakButtonProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Pre-load voices when the component mounts
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;

    // Grab them immediately if they are already available
    setVoices(synth.getVoices());

    // Listen for the async load to finish (crucial for Chrome)
    const handleVoicesChanged = () => {
      setVoices(synth.getVoices());
    };

    synth.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  const handleSpeak = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.volume = 1.0;
    utterance.pitch = 1.0;

    const normalizedLang = lang.toLowerCase();
    const languageCode = normalizedLang.split('-')[0];

    // Some mobile browsers have an empty voices array at mount, so we fetch it again here
    const currentVoices = synth.getVoices();
    const availableVoices = currentVoices.length > 0 ? currentVoices : voices;

    const voice = availableVoices.find((item) => item.lang.toLowerCase() === normalizedLang)
      ?? availableVoices.find((item) => item.lang.toLowerCase().startsWith(languageCode));

    if (voice) {
      utterance.voice = voice;
      console.log(`🗣️ Speaking with voice: ${voice.name} (${voice.lang})`);
    } else {
      alert(`Missing language pack for ${lang}. Please install the Text-to-Speech language in your device settings.`);
      console.warn(`⚠️ No voice found for ${lang}. Ensure your OS has this language pack installed.`);
    }

    utterance.onerror = (event) => {
      console.error('SpeechSynthesis Utterance Error:', event);
      if (event.error === 'not-allowed') {
        alert('Audio playback blocked by browser. Make sure your volume is up and you tap the button directly.');
      }
    };

    // On some mobile Safari versions, cancel() immediately before speak() drops the audio.
    // We'll only cancel if it's currently speaking.
    if (synth.speaking) {
      synth.cancel();
    }

    synth.speak(utterance);
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
