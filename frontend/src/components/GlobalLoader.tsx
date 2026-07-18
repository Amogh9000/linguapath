'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const LOADING_MESSAGES = [
  'Warming up the bird...',
  'Packing your bags...',
  'Loading the world...',
  'Preparing your lessons...',
];

type GlobalLoaderProps = {
  onComplete?: () => void;
};

export function GlobalLoader({ onComplete }: GlobalLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onCompleteRef.current?.();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Hard safety: never leave the user stuck on this screen
  useEffect(() => {
    const safety = setTimeout(finish, 3500);
    return () => clearTimeout(safety);
  }, []);

  useLayoutEffect(() => {
    const bar = barRef.current;
    const container = containerRef.current;
    if (!bar || !container) {
      finish();
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: finish,
      });

      tl.to(bar, {
        width: '100%',
        duration: 1.5,
        ease: 'power2.inOut',
      }).to(
        container,
        {
          yPercent: -100,
          duration: 0.75,
          ease: 'power4.inOut',
        },
        '+=0.1'
      );
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1cb0f6]"
    >
      <div className="w-full max-w-md px-6 flex flex-col items-center gap-6">
        <h2 className="text-white text-2xl md:text-3xl font-black text-center">
          {LOADING_MESSAGES[messageIndex]}
        </h2>

        <div className="w-full h-10 bg-black/20 rounded-full border-4 border-black/10 overflow-hidden relative p-1 shadow-inner">
          <div
            ref={barRef}
            className="h-full w-0 bg-[#ffc800] rounded-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1/3 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
