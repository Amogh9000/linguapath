'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import * as T from '@/lib/types';
import SideNav from '@/components/SideNav';
import HeartsModal from '@/components/HeartsModal';
import { GlobalLoader } from '@/components/GlobalLoader';

gsap.registerPlugin(ScrollTrigger);

export default function LearnPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<T.UserProfileResponse | null>(null);
  const [stats, setStats] = useState<T.UserStatsResponse | null>(null);
  const [pathData, setPathData] = useState<T.PathResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<T.LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootDone, setBootDone] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [heartsOpen, setHeartsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lp_boot_loader');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [profData, pData, lbData] = await Promise.all([
          api.getProfile(),
          api.getPath(),
          api.getLeaderboard(),
        ]);
        if (cancelled) return;
        setProfile(profData);
        setStats(profData.stats);
        setPathData(pData);
        setLeaderboard(lbData);
        setLoadError('');
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        if (err.message && err.message.toLowerCase().includes('onboarding')) {
          router.push('/onboarding');
          return;
        }
        setLoadError(err.message || 'Failed to load your path');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Boot screen runs once, then never remounts
  if (!bootDone) {
    return <GlobalLoader onComplete={() => setBootDone(true)} />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1cb0f6]">
        <p className="text-white font-black text-2xl">Almost there...</p>
      </div>
    );
  }

  if (loadError || !profile || !pathData || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white p-6 text-center">
        <p className="text-xl font-black text-on-surface">
          {loadError || 'Could not load your dashboard'}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-[#58cc02] text-white font-black px-6 py-3 rounded-2xl border-b-4 border-[#58a700]"
        >
          Try again
        </button>
      </div>
    );
  }

  const dailyPct = Math.min(100, (stats.daily_xp_today / stats.daily_goal_xp) * 100);
  const dailyDone = stats.daily_xp_today >= stats.daily_goal_xp;
  const top3 = leaderboard?.entries.slice(0, 3) ?? [];
  const myRank = leaderboard?.current_user_rank;
  const rankMedal = ['🥇','🥈','🥉'];

  return (
    <div className="bg-surface-container-lowest text-on-background font-sans min-h-screen">
      <SideNav
        active="learn"
        courseName={pathData.course_name}
        onStatsUpdate={(partial) => setStats((s) => (s ? { ...s, ...partial } : s))}
      />

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b-2 border-surface-container-highest px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border-2 border-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">flag</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-error font-bold">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            <span className="text-base">{stats.streak_count}</span>
          </div>
          <div className="flex items-center gap-1 font-bold">
            <span className="material-symbols-outlined text-xl text-[#ddad00]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
            <span className="text-[#ddad00] text-base">{stats.gems}</span>
          </div>
          <button
            onClick={() => setHeartsOpen(true)}
            className={`flex items-center gap-1 font-bold ${stats.hearts_current === 0 ? 'animate-pulse' : ''}`}
          >
            <span className="material-symbols-outlined text-xl text-error" style={{ fontVariationSettings: stats.hearts_current === 0 ? "'FILL' 0" : "'FILL' 1" }}>favorite</span>
            <span className="text-base text-error">{stats.hearts_current}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="md:ml-64 md:pt-8 min-h-screen pb-24 md:pb-0 relative">
        <div className="max-w-[1200px] mx-auto p-5 md:px-8 lg:px-16 flex flex-col lg:flex-row gap-8 relative">
          
          {/* Center Column: Skill Path */}
          <div className="flex-grow flex flex-col items-center pt-8">
            <ZigzagPath units={pathData.units} onStartLesson={(id) => router.push(`/lesson/${id}`)} />
          </div>

          {/* Right Column: Widgets */}
          <div className="w-full lg:w-[350px] flex flex-col gap-6 lg:sticky lg:top-8 lg:self-start lg:h-max lg:pt-8 hidden md:flex">
            
            {/* Stats Row */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low p-2 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-highest border-2 border-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">flag</span>
                </div>
              </div>
              {/* Streak */}
              <div className="flex items-center gap-2 text-error font-bold hover:bg-surface-container-low p-2 rounded-xl cursor-pointer transition-all">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="text-lg">{stats.streak_count}</span>
              </div>
              {/* Coins (balance only — shop is in left sidebar) */}
              <div className="flex items-center gap-2 font-bold p-2 rounded-xl">
                <span className="material-symbols-outlined text-2xl text-[#ddad00]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                <span className="text-[#ddad00] text-lg">{stats.gems}</span>
              </div>
              {/* Hearts → opens HeartsModal */}
              <button
                onClick={() => setHeartsOpen(true)}
                className={`flex items-center gap-2 font-bold hover:bg-surface-container-low p-2 rounded-xl cursor-pointer transition-all ${stats.hearts_current === 0 ? 'animate-pulse' : ''}`}
              >
                <span className="material-symbols-outlined text-2xl text-error" style={{ fontVariationSettings: stats.hearts_current === 0 ? "'FILL' 0" : "'FILL' 1" }}>favorite</span>
                <span className="text-lg text-error">{stats.hearts_current}</span>
              </button>
            </div>

            {/* Super Card Promo */}
            <div className="rounded-2xl border-2 border-surface-container-highest overflow-hidden flex flex-col relative group cursor-pointer hover:border-[#1cb0f6] transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-[#1cb0f6]/10 to-transparent z-0"></div>
               <div className="p-4 z-10 flex items-center gap-4">
                 <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXl06QJbiyp9RRiqC6OnOmaVT1SEZkoqlkzSpPItj7o3p5AEn1ArCFNIeJJHgblA6_SIT34_jc6-qvWOGQUFY1LD18eaSIqoabR00EzY32CJe_uFNlwl5Ye-RO3Muf6sQCtYf0uqpxi52hKz6wlwzM3nodgkc_iWTMT2RDV8eHg3j42JQFGKPH8aNInrz1pN9yX0uk2z0OO4RMH9Vhl04k2570pVhqVymiDsMYTpr7iNppKU515I_J" alt="Super" className="w-16 h-16 object-contain" />
                 <div>
                   <h3 className="font-black text-lg text-on-surface">Try Super for free</h3>
                   <p className="text-sm font-bold text-on-surface-variant">No ads, personalized practice, and unlimited hearts!</p>
                 </div>
               </div>
            </div>

            {/* Real Leaderboard Widget */}
            <div
              className="rounded-2xl border-2 border-surface-container-highest p-4 flex flex-col cursor-pointer hover:bg-surface-container-low transition-colors"
              onClick={() => router.push('/leaderboard')}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg text-on-surface">Leaderboard</h3>
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </div>
              {top3.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {top3.map((entry, i) => {
                    const isMe = entry.rank === myRank;
                    return (
                      <div key={entry.user_id} className={`flex items-center gap-3 p-2 rounded-xl ${isMe ? 'bg-primary-container/20' : ''}`}>
                        <span className="text-lg w-6 text-center">{rankMedal[i]}</span>
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-black text-sm flex-shrink-0">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-bold text-sm flex-1 truncate ${isMe ? 'text-primary' : 'text-on-surface'}`}>
                          {entry.username}{isMe ? ' (You)' : ''}
                        </span>
                        <span className="font-black text-sm text-on-surface-variant">{entry.xp_total} XP</span>
                      </div>
                    );
                  })}
                  {myRank && myRank > 3 && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary-container/20 mt-1">
                      <span className="text-sm font-black text-secondary-container w-6 text-center">#{myRank}</span>
                      <span className="font-bold text-sm text-on-surface-variant flex-1">Your rank</span>
                      <span className="font-black text-sm text-on-surface-variant">{stats.xp_total} XP</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-bold text-on-surface-variant">Complete lessons to join the leaderboard!</p>
              )}
            </div>

            {/* Daily Quest Widget */}
            <div className="rounded-2xl border-2 border-surface-container-highest p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg text-on-surface">Daily Quest</h3>
                {dailyDone && (
                  <span className="text-xs font-black text-primary bg-primary-container/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Complete!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${dailyDone ? 'bg-primary-container/30' : 'bg-surface-container-highest'}`}>
                  <span className={`material-symbols-outlined text-2xl ${dailyDone ? 'text-primary-container' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {dailyDone ? 'emoji_events' : 'bolt'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-2 text-on-surface">
                    Earn {stats.daily_goal_xp} XP today
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-4 flex-1 bg-surface-container-highest rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dailyPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`absolute top-0 left-0 h-full rounded-full ${dailyDone ? 'bg-primary-container' : 'bg-secondary'}`}
                      />
                    </div>
                    <span className="text-xs font-black text-on-surface-variant w-14 text-right tabular-nums">
                      {stats.daily_xp_today}/{stats.daily_goal_xp}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modals */}
      {heartsOpen && (
        <HeartsModal
          stats={stats}
          onClose={() => setHeartsOpen(false)}
          onUpdate={(updated) => setStats((s) => s ? { ...s, ...updated } : s)}
        />
      )}
    </div>
  );
}




function ZigzagPath({ units, onStartLesson }: { units: T.UnitInfo[], onStartLesson: (id: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  // Guard against duplicate units from API/seed glitches
  const uniqueUnits = (() => {
    const seenTitles = new Set<string>();
    const seenIds = new Set<number>();
    return units.filter((u) => {
      if (seenIds.has(u.id) || seenTitles.has(u.title)) return false;
      seenIds.add(u.id);
      seenTitles.add(u.title);
      return true;
    });
  })();

  // GSAP: ScrollTrigger for drawing the SVG path connecting nodes
  useEffect(() => {
    if (!pathRef.current) return;
    const length = pathRef.current.getTotalLength();
    gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length });
    
    gsap.to(pathRef.current, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top center",
        end: "bottom center",
        scrub: true
      }
    });
  }, [uniqueUnits]);

  // Flatten skills
  const NODE_SPACING_Y = 120;
  const X_AMPLITUDE = 60;

  return (
    <div className="w-full max-w-xl">
      {uniqueUnits.map((unit, uIdx) => {
        // Find starting index of this unit's skills in the flattened array
        const startSkillIdx = uniqueUnits.slice(0, uIdx).reduce((acc, curr) => acc + curr.skills.length, 0);

        return (
          <div key={unit.id} className="w-full flex flex-col items-center mb-12">
            {/* Unit Banner */}
            <div className="w-full bg-primary-container text-white rounded-2xl p-6 mb-8 tile-3d border-primary border-b-4 border-2">
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className="text-2xl font-black mb-1">{unit.title}</h2>
                  <p className="font-bold opacity-90">{unit.description}</p>
                </div>
              </div>
            </div>

            {/* Nodes Container */}
            <div ref={containerRef} className="relative w-[300px] flex flex-col items-center" style={{ height: unit.skills.length * NODE_SPACING_Y }}>
              {/* Note: In a real app we'd draw one continuous SVG across ALL units, but here we scope it per unit for simplicity or use absolute positioning over the whole column. For this demo, let's keep it simple with just absolute positioned nodes. */}
              
              {unit.skills.map((skill, sIdx) => {
                const globalIdx = startSkillIdx + sIdx;
                const offsetX = Math.sin(globalIdx * Math.PI / 2) * X_AMPLITUDE;
                
                const isLocked = skill.progress.status === 'locked';
                const isAvailable = skill.progress.status === 'available';
                const isCompleted = skill.progress.status === 'completed';

                const shapes = ['circle', 'square', 'change_history', 'hexagon', 'pentagon', 'diamond'];
                const shapeIcon = shapes[globalIdx % shapes.length];

                return (
                  // GSAP: Pop-in animation on scroll using ScrollTrigger natively
                  <motion.div
                    key={skill.id}
                    initial={{ scale: 0, x: offsetX }}
                    whileInView={{ scale: 1, x: offsetX }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute z-10 flex flex-col items-center w-24"
                    style={{ 
                      top: sIdx * NODE_SPACING_Y,
                      left: 'calc(50% - 48px)'
                    }}
                  >
                    <button
                      disabled={isLocked}
                      onClick={() => isAvailable || isCompleted ? onStartLesson(skill.lessons[0].id) : null}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 group 
                        ${isLocked ? 'bg-surface-container-highest border-surface-dim opacity-60 cursor-not-allowed' : 
                          isAvailable ? 'bg-secondary-container border-[#004666] btn-3d-secondary' : 
                          'bg-primary-container border-[#1e5000] btn-3d-primary'}`}
                    >
                      {isAvailable && <div className="pulse-ring absolute inset-0 rounded-full z-0"></div>}
                      
                      <span className={`material-symbols-outlined text-4xl relative z-10 ${
                        isLocked ? 'text-on-surface-variant' : 
                        isAvailable ? 'text-on-secondary-container' : 
                        'text-on-primary-container'
                      }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isLocked ? 'lock' : shapeIcon}
                      </span>
                      
                      {isCompleted && (
                        <div className="absolute -bottom-2 -right-2 bg-tertiary-fixed-dim rounded-full w-8 h-8 flex items-center justify-center border-2 border-white z-20">
                          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      )}
                    </button>
                    {isAvailable && (
                      <motion.div 
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-10 bg-white border-2 border-surface-container-highest rounded-xl px-4 py-2 font-bold text-primary shadow-sm"
                      >
                        Start
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-surface-container-highest rotate-45"></div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
