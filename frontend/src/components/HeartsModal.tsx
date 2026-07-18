'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as T from '@/lib/types';
import { api } from '@/lib/api';

interface HeartsModalProps {
  stats: T.UserStatsResponse;
  onClose: () => void;
  onUpdate: (updated: T.UserStatsResponse) => void;
}

const REGEN_MINUTES = 30; // 1 heart every 30 min (mirrors backend)
const REFILL_COST = 350;

function calcCountdown(stats: T.UserStatsResponse) {
  if (stats.hearts_current >= stats.hearts_max || !stats.hearts_last_lost_at) return null;

  const lostAt = new Date(stats.hearts_last_lost_at).getTime();
  const heartsNeeded = stats.hearts_max - stats.hearts_current;
  // Next single heart
  const nextHeartMs = lostAt + REGEN_MINUTES * 60 * 1000;
  // Full refill
  const fullRefillMs = lostAt + heartsNeeded * REGEN_MINUTES * 60 * 1000;
  const now = Date.now();

  const nextSecs = Math.max(0, Math.floor((nextHeartMs - now) / 1000));
  const fullSecs = Math.max(0, Math.floor((fullRefillMs - now) / 1000));

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
    return `${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  };

  return { nextLabel: fmt(nextSecs), fullLabel: fmt(fullSecs) };
}

export default function HeartsModal({ stats, onClose, onUpdate }: HeartsModalProps) {
  const [countdown, setCountdown] = useState(() => calcCountdown(stats));
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live countdown ticker
  useEffect(() => {
    const id = setInterval(() => setCountdown(calcCountdown(stats)), 1000);
    return () => clearInterval(id);
  }, [stats]);

  const handleBuy = async () => {
    setBuying(true);
    setError(null);
    try {
      const res = await api.refillHearts();
      // Merge returned data into a partial stats update
      onUpdate({
        ...stats,
        hearts_current: (res as any).hearts_current ?? stats.hearts_max,
        gems: (res as any).gems_remaining ?? stats.gems - REFILL_COST,
        hearts_last_lost_at: null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed. Try again.');
    } finally {
      setBuying(false);
    }
  };

  const isOutOfHearts = stats.hearts_current === 0;
  const canAfford = stats.gems >= REFILL_COST;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          className="relative w-full max-w-sm bg-surface rounded-2xl border-2 border-surface-container-highest shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-surface-container-highest">
            <h2 className="font-black text-xl text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              Hearts
            </h2>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="p-6 flex flex-col gap-5">
            {/* Hearts display */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: stats.hearts_max }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', bounce: 0.6 }}
                  className={`material-symbols-outlined text-4xl ${i < stats.hearts_current ? 'text-error' : 'text-surface-container-highest'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </motion.span>
              ))}
            </div>

            {isOutOfHearts ? (
              /* Out of hearts state */
              <div className="flex flex-col gap-4">
                <div className="bg-error-container/20 border-2 border-error/30 rounded-xl p-4 text-center">
                  <p className="font-black text-error text-lg mb-1">You&apos;re out of hearts!</p>
                  <p className="text-sm font-semibold text-on-surface-variant">
                    Hearts refill automatically over time. Keep practicing!
                  </p>
                </div>

                {countdown && (
                  <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3 border-2 border-surface-container-highest">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span className="text-sm font-bold">Next heart</span>
                      </div>
                      <span className="font-black text-primary text-lg tabular-nums">{countdown.nextLabel}</span>
                    </div>
                    <div className="border-t border-surface-container-highest" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        <span className="text-sm font-bold">Full refill</span>
                      </div>
                      <span className="font-black text-on-surface text-lg tabular-nums">{countdown.fullLabel}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : countdown ? (
              /* Has some hearts but not full */
              <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between border-2 border-surface-container-highest">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-sm font-bold">Full refill in</span>
                </div>
                <span className="font-black text-primary tabular-nums">{countdown.fullLabel}</span>
              </div>
            ) : (
              <div className="bg-primary-container/20 border-2 border-primary-container/40 rounded-xl p-4 text-center">
                <p className="font-black text-primary">Hearts are full! ❤️</p>
                <p className="text-sm text-on-surface-variant font-semibold mt-1">Go complete a lesson!</p>
              </div>
            )}

            {/* Instant refill section */}
            {stats.hearts_current < stats.hearts_max && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-surface-container-highest" />
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">or get instant play</span>
                  <div className="flex-1 border-t border-surface-container-highest" />
                </div>

                {error && (
                  <p className="text-sm font-bold text-error text-center bg-error-container/20 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={handleBuy}
                  disabled={buying || !canAfford}
                  className={`w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-3 border-b-4 transition-all active:translate-y-[2px] active:border-b-0 ${canAfford
                    ? 'bg-[#ddad00] text-white border-[#b8900a] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed'
                    : 'bg-surface-container-highest text-on-surface-variant border-surface-dim cursor-not-allowed'
                    }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                  {buying
                    ? 'Buying…'
                    : canAfford
                      ? `Refill now for ${REFILL_COST} coins`
                      : `Need ${REFILL_COST} coins (you have ${stats.gems})`}
                </button>

                {!canAfford && (
                  <p className="text-center text-xs font-bold text-on-surface-variant">
                    Visit the Shop to earn more coins! 🪙
                  </p>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
