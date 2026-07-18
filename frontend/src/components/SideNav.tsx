'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import * as T from '@/lib/types';
import SettingsModal from '@/components/SettingsModal';
import ShopModal from '@/components/ShopModal';
import { playClick } from '@/lib/sounds';

type NavItem = 'learn' | 'leaderboard' | 'profile' | 'shop';

interface SideNavProps {
  active: NavItem;
  courseName?: string;
  /** Keep parent coin/heart counts in sync when shop purchases happen */
  onStatsUpdate?: (partial: Partial<T.UserStatsResponse>) => void;
}

export default function SideNav({ active, courseName, onStatsUpdate }: SideNavProps) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopStats, setShopStats] = useState<T.UserStatsResponse | null>(null);
  const [offerAvailable, setOfferAvailable] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Prefetch offer status for the Free badge
  useEffect(() => {
    let cancelled = false;
    api.getStats()
      .then((s) => {
        if (!cancelled) {
          setOfferAvailable(!s.free_coin_offer_claimed);
          setShopStats(s);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  const handleLogout = () => {
    api.clearToken();
    document.documentElement.removeAttribute('data-theme');
    router.push('/');
  };

  const openShop = async () => {
    playClick();
    try {
      const stats = await api.getStats();
      setShopStats(stats);
      setOfferAvailable(!stats.free_coin_offer_claimed);
      setShopOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'learn' as NavItem, href: '/learn', icon: 'school', label: 'Learn' },
    { id: 'leaderboard' as NavItem, href: '/leaderboard', icon: 'leaderboard', label: 'Leaderboard' },
    { id: 'profile' as NavItem, href: '/profile', icon: 'person', label: 'Profile' },
  ];

  const shopActive = shopOpen || active === 'shop';
  const showFreeBadge = offerAvailable;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 border-r-2 border-surface-container-highest bg-surface flex-col p-5 gap-2 z-50">
        <div className="flex flex-col items-center mb-8 mt-4">
          <Link href="/learn">
            <h1 className="text-3xl text-primary font-black cursor-pointer">LinguaPath</h1>
          </Link>
          {courseName && (
            <p className="text-on-surface-variant text-sm font-bold uppercase tracking-wider mt-1">
              {courseName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full flex-1">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container border-b-4 border-[#004c6e] active:translate-y-[2px] active:border-b-2'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-bold text-lg">{item.label}</span>
              </Link>
            );
          })}

          {/* Shop — left sidebar */}
          <button
            type="button"
            onClick={openShop}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all w-full text-left ${
              shopActive
                ? 'bg-[#ffc800]/25 text-[#a67c00] border-b-4 border-[#cc9d00] active:translate-y-[2px] active:border-b-2'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              storefront
            </span>
            <span className="font-bold text-lg flex-1">Shop</span>
            {showFreeBadge && (
              <span className="text-[10px] font-black uppercase bg-error text-white px-1.5 py-0.5 rounded-full">
                Free
              </span>
            )}
          </button>
        </div>

        {/* More Button */}
        <div ref={moreRef} className="relative mt-auto">
          <button
            onClick={() => setMoreOpen((p) => !p)}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg w-full transition-all text-on-surface-variant hover:bg-surface-container ${
              moreOpen ? 'bg-surface-container' : ''
            }`}
          >
            <span className="material-symbols-outlined">more_horiz</span>
            <span className="font-bold text-lg">More</span>
            <span className={`material-symbols-outlined ml-auto text-sm transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}>
              expand_less
            </span>
          </button>

          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-surface border-2 border-surface-container-highest rounded-xl shadow-xl overflow-hidden z-10"
              >
                <button
                  onClick={() => { setMoreOpen(false); setSettingsOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">settings</span>
                  <span className="font-bold">Settings</span>
                </button>
                <div className="border-t border-surface-container-highest" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-error hover:bg-error-container/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
                  <span className="font-bold">Log Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 right-0 left-0 h-20 bg-surface border-t-2 border-surface-container-highest flex justify-around items-center px-2 z-50">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary border-2 border-primary-container bg-primary-container/10'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openShop}
          className={`relative flex flex-col items-center p-2 rounded-xl transition-colors ${
            shopActive
              ? 'text-[#ddad00] border-2 border-[#ffc800] bg-[#ffc800]/15'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          {showFreeBadge && (
            <span className="absolute -top-0.5 right-0 w-2 h-2 rounded-full bg-error" />
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex flex-col items-center p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </nav>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {shopOpen && shopStats && (
        <ShopModal
          stats={shopStats}
          onClose={() => setShopOpen(false)}
          onUpdate={(partial) => {
            setShopStats((s) => (s ? { ...s, ...partial } : s));
            if (partial.free_coin_offer_claimed) setOfferAvailable(false);
            onStatsUpdate?.(partial);
          }}
        />
      )}
    </>
  );
}
