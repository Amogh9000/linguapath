'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import * as T from '@/lib/types';
import SideNav from '@/components/SideNav';

export default function LeaderboardPage() {
  const [data, setData] = useState<T.LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getLeaderboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-surface-container-lowest text-on-background font-sans min-h-screen">
      {/* Desktop Top Nav */}
      <div className="hidden md:flex fixed top-0 right-0 left-64 h-16 bg-surface border-b-2 border-surface-container-highest justify-end items-center px-16 z-40">
        <h1 className="font-black text-xl">Leaderboard</h1>
      </div>

      <SideNav active="leaderboard" />

      {/* Main Content Area */}
      <main className="md:ml-64 md:pt-16 min-h-screen pb-24 md:pb-0">
        <div className="max-w-[800px] mx-auto p-5 md:p-16 flex flex-col gap-6">
          <div className="flex flex-col items-center mb-8">
            <span className="material-symbols-outlined text-6xl text-[#ddad00] mb-4">emoji_events</span>
            <h1 className="text-3xl font-black">Diamond League</h1>
            <p className="font-bold text-on-surface-variant">Top 10 advance to the next league</p>
          </div>

          <div className="flex flex-col gap-3">
            {data?.entries.map((entry) => {
              const isCurrentUser = entry.rank === data.current_user_rank;
              return (
                <div 
                  key={entry.user_id} 
                  className={`flex items-center gap-4 p-4 rounded-2xl ${
                    isCurrentUser ? 'bg-primary-container/20 border-2 border-primary-container' : 'hover:bg-surface-container-low border-2 border-transparent'
                  }`}
                >
                  <div className={`font-black w-8 text-center text-lg ${entry.rank <= 3 ? 'text-[#ddad00]' : 'text-on-surface-variant'}`}>
                    {entry.rank}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-black text-xl">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={`font-bold text-lg flex-grow ${isCurrentUser ? 'text-primary font-black' : ''}`}>
                    {entry.username} {isCurrentUser ? '(You)' : ''}
                  </div>
                  <div className="font-black text-on-surface-variant">
                    {entry.xp_total} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
