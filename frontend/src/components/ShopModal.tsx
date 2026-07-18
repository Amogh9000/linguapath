'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as T from '@/lib/types';
import { api } from '@/lib/api';
import { playClick, playCorrect } from '@/lib/sounds';

interface ShopModalProps {
  stats: T.UserStatsResponse;
  onClose: () => void;
  onUpdate: (updated: Partial<T.UserStatsResponse>) => void;
}

interface CoinPack {
  id: string;
  title: string;
  coins: number;
  priceLabel: string;
  badge?: string;
  highlight?: boolean;
}

const COIN_PACKS: CoinPack[] = [
  { id: 'starter', title: 'Starter Pack', coins: 500, priceLabel: '$0.99' },
  { id: 'popular', title: 'Popular Pack', coins: 1200, priceLabel: '$1.99', badge: 'Best value', highlight: true },
  { id: 'mega', title: 'Mega Pack', coins: 2500, priceLabel: '$4.99' },
  { id: 'legendary', title: 'Legendary Pack', coins: 6500, priceLabel: '$9.99', badge: 'Bonus!' },
];

interface SpendItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  cost: number;
  action: 'hearts' | 'mock';
}

const SPEND_ITEMS: SpendItem[] = [
  {
    id: 'hearts',
    icon: 'favorite',
    iconColor: 'text-error',
    title: 'Heart Refill',
    description: 'Restore all hearts instantly.',
    cost: 350,
    action: 'hearts',
  },
  {
    id: 'streak_freeze',
    icon: 'ac_unit',
    iconColor: 'text-secondary',
    title: 'Streak Freeze',
    description: 'Protect your streak for one day.',
    cost: 200,
    action: 'mock',
  },
  {
    id: 'xp_boost',
    icon: 'bolt',
    iconColor: 'text-[#ddad00]',
    title: 'Double XP (1 day)',
    description: 'Earn 2× XP on lessons today.',
    cost: 100,
    action: 'mock',
  },
];

export default function ShopModal({ stats, onClose, onUpdate }: ShopModalProps) {
  const [tab, setTab] = useState<'buy' | 'spend'>('buy');
  const [busy, setBusy] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const offerClaimed = !!stats.free_coin_offer_claimed;

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    playCorrect();
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const claimFreeOffer = async () => {
    if (offerClaimed || busy) return;
    playClick();
    setBusy('free');
    setError(null);
    try {
      const res = await api.claimFreeCoins();
      onUpdate({
        gems: res.gems,
        free_coin_offer_claimed: true,
      });
      flashSuccess(res.message);
    } catch (err: any) {
      setError(err.message ?? 'Could not claim offer');
    } finally {
      setBusy(null);
    }
  };

  const buyPack = async (pack: CoinPack) => {
    if (busy) return;
    playClick();
    setBusy(pack.id);
    setError(null);
    try {
      const res = await api.purchaseCoinPack(pack.id);
      onUpdate({ gems: res.gems });
      flashSuccess(res.message);
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed');
    } finally {
      setBusy(null);
    }
  };

  const spendCoins = async (item: SpendItem) => {
    if (stats.gems < item.cost || busy) return;
    playClick();
    setBusy(item.id);
    setError(null);
    try {
      if (item.action === 'hearts') {
        const res: any = await api.refillHearts();
        onUpdate({
          hearts_current: res.hearts_current ?? 5,
          gems: res.gems_remaining ?? stats.gems - item.cost,
          hearts_last_lost_at: null,
        });
      } else {
        onUpdate({ gems: stats.gems - item.cost });
      }
      flashSuccess(`Got ${item.title}!`);
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
          className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl border-2 border-surface-container-highest shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1.5 bg-surface-container-highest rounded-full" />
          </div>

          {/* Fixed header block — never overlaps scroll content */}
          <div className="shrink-0 bg-surface z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-surface-container-highest">
              <div>
                <h2 className="font-black text-xl text-on-surface">Shop</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[#ddad00] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                  <span className="font-black text-[#ddad00]">{stats.gems}</span>
                  <span className="text-sm font-bold text-on-surface-variant">coins</span>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 pt-4 pb-3">
              {([
                ['buy', 'Buy coins'],
                ['spend', 'Spend coins'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { playClick(); setTab(id); }}
                  className={`flex-1 py-2.5 rounded-xl font-black text-sm border-b-4 transition-all ${
                    tab === id
                      ? 'bg-secondary text-white border-[#004666]'
                      : 'bg-surface-container-low text-on-surface-variant border-surface-container-highest'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="mx-4 mb-3 bg-error-container/20 border border-error/40 rounded-xl px-4 py-2 text-sm font-bold text-error text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mx-4 mb-3 bg-primary-container/25 border border-primary/40 rounded-xl px-4 py-2 text-sm font-bold text-primary text-center">
                {successMsg}
              </div>
            )}
          </div>

          {/* Scrollable packs — block layout so cards can't flex-shrink */}
          <div className="overflow-y-auto min-h-0 flex-1 px-4 pb-5 pt-4 space-y-3">
            {tab === 'buy' && (
              <>
                {/* One-time free offer */}
                <div
                  className={`shrink-0 rounded-2xl border-2 p-4 ${
                    offerClaimed
                      ? 'border-surface-container-highest bg-surface-container-low opacity-70'
                      : 'border-[#ffc800] bg-gradient-to-br from-[#ffc800]/25 to-[#ff9600]/10'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-white border-2 border-[#ffc800] flex items-center justify-center shadow-sm shrink-0">
                      <span className="material-symbols-outlined text-3xl text-[#ddad00]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        featured_seasonal_and_gifts
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-black text-on-surface text-base">Welcome Gift</p>
                        {!offerClaimed && (
                          <span className="text-[10px] font-black uppercase tracking-wide bg-error text-white px-2 py-0.5 rounded-full shrink-0">
                            One-time
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-on-surface-variant">
                        {offerClaimed ? 'Already claimed on this account' : '1,000 coins — free, once per account'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={offerClaimed || busy === 'free'}
                    onClick={claimFreeOffer}
                    className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide border-b-4 transition-all active:translate-y-[2px] active:border-b-0 disabled:opacity-60 disabled:cursor-not-allowed ${
                      offerClaimed
                        ? 'bg-surface-container-highest text-on-surface-variant border-surface-dim'
                        : 'bg-[#58cc02] text-white border-[#58a700] hover:brightness-105'
                    }`}
                  >
                    {offerClaimed ? 'Claimed ✓' : busy === 'free' ? 'Claiming…' : 'Claim 1,000 free coins'}
                  </button>
                </div>

                {COIN_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={`shrink-0 flex items-center gap-4 p-4 rounded-2xl border-2 ${
                      pack.highlight
                        ? 'border-secondary bg-secondary-container/15'
                        : 'border-surface-container-highest bg-surface-container-low'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-surface flex flex-col items-center justify-center flex-shrink-0 border-2 border-[#ddad00]/40">
                      <span className="material-symbols-outlined text-2xl text-[#ddad00]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                      <span className="text-[10px] font-black text-[#ddad00]">{pack.coins >= 1000 ? `${pack.coins / 1000}k` : pack.coins}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black text-on-surface text-sm">{pack.title}</p>
                        {pack.badge && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-primary-container text-on-primary-container">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-on-surface-variant">
                        +{pack.coins.toLocaleString()} coins
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => buyPack(pack)}
                      disabled={!!busy}
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl border-b-4 font-black text-sm bg-[#1cb0f6] text-white border-[#1899d6] hover:brightness-105 active:translate-y-[2px] active:border-b-0 disabled:opacity-60 min-w-[72px]"
                    >
                      {busy === pack.id ? '…' : pack.priceLabel}
                    </button>
                  </div>
                ))}
                <p className="text-center text-xs font-bold text-on-surface-variant pt-1">
                  Demo shop — purchases credit coins instantly (no real charge)
                </p>
              </>
            )}

            {tab === 'spend' &&
              SPEND_ITEMS.map((item) => {
                const canAfford = stats.gems >= item.cost;
                return (
                  <div
                    key={item.id}
                    className={`shrink-0 flex items-center gap-4 p-4 rounded-2xl border-2 border-surface-container-highest bg-surface-container-low ${
                      !canAfford ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 border-2 border-surface-container-highest">
                      <span className={`material-symbols-outlined text-3xl ${item.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {item.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-on-surface text-sm mb-0.5">{item.title}</p>
                      <p className="text-xs font-semibold text-on-surface-variant">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => spendCoins(item)}
                      disabled={!canAfford || !!busy}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border-b-4 font-black text-xs min-w-[64px] active:translate-y-[2px] active:border-b-0 disabled:cursor-not-allowed ${
                        canAfford
                          ? 'bg-[#ddad00] text-white border-[#b8900a]'
                          : 'bg-surface-container-highest text-on-surface-variant border-surface-dim'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                      <span>{busy === item.id ? '…' : item.cost}</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
