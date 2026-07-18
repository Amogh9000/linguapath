'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import * as T from '@/lib/types';
import SideNav from '@/components/SideNav';
import MascotAvatar, {
  AccessoryPreview,
  MASCOT_COLORS,
  MASCOT_COLOR_KEYS,
  MASCOT_OUTFITS,
  OutfitPreview,
} from '@/components/MascotAvatar';
import { playClick } from '@/lib/sounds';

const TAB_OUTFIT = 'outfit';
const TAB_ACCESSORY = 'accessory';
const TAB_COLOR = 'color';

// ─── Manage Courses Section ──────────────────────────────────────────────────

type CourseAction = null | { type: 'reset' | 'remove'; language: string; courseName: string };

function ManageCoursesSection() {
  const router = useRouter();
  const [courses, setCourses] = useState<T.CourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<CourseAction>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getUserCourses()
      .then((r) => setCourses(r.courses))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const langEmoji: Record<string, string> = {
    spanish: '🇪🇸',
    french: '🇫🇷',
    japanese: '🇯🇵',
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    setSubmitting(true);
    setError(null);
    try {
      if (pendingAction.type === 'reset') {
        await api.resetCourse(pendingAction.language);
        setSuccessMsg(`${pendingAction.courseName} progress has been reset.`);
        // Refresh course list to show updated completion counts
        const refreshed = await api.getUserCourses();
        setCourses(refreshed.courses);
      } else {
        await api.removeCourse(pendingAction.language);
        // Redirect to onboarding — user must pick a new course
        document.documentElement.removeAttribute('data-theme');
        router.push('/onboarding');
        return; // don't run finally cleanup, we're navigating away
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="tile-3d bg-surface rounded-xl p-6 flex items-center justify-center h-32">
        <span className="text-on-surface-variant font-bold animate-pulse">Loading courses…</span>
      </div>
    );
  }

  return (
    <>
      <div className="tile-3d bg-surface p-5 rounded-xl flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-xl text-on-surface">Manage Courses</h4>
          <span className="material-symbols-outlined text-on-surface-variant">school</span>
        </div>

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-primary-container/20 border border-primary-container rounded-lg px-4 py-2 text-sm font-bold text-on-surface"
          >
            ✅ {successMsg}
          </motion.div>
        )}

        {courses.length === 0 ? (
          <p className="text-on-surface-variant font-bold text-sm text-center py-4">
            No active courses. Complete onboarding to add a language!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((course) => {
              const pct = course.total_skills > 0
                ? Math.round((course.completed_skills / course.total_skills) * 100)
                : 0;
              return (
                <div
                  key={course.language}
                  className="rounded-xl border-2 border-surface-container-highest p-4 flex flex-col gap-3 bg-surface-container-low"
                >
                  {/* Course header */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{langEmoji[course.language] ?? '🌐'}</span>
                    <div className="flex-1">
                      <p className="font-black text-on-surface">{course.course_name}</p>
                      <p className="text-xs font-bold text-on-surface-variant">
                        {course.completed_skills}/{course.total_skills} skills completed
                      </p>
                    </div>
                    <span className="font-black text-primary text-sm">{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-primary-container rounded-full"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPendingAction({ type: 'reset', language: course.language, courseName: course.course_name })}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-secondary/40 bg-secondary-container/20 text-secondary font-bold text-sm hover:bg-secondary-container/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Reset Progress
                    </button>
                    <button
                      onClick={() => setPendingAction({ type: 'remove', language: course.language, courseName: course.course_name })}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-error/40 bg-error-container/20 text-error font-bold text-sm hover:bg-error-container/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove Course
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => !submitting && setPendingAction(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="w-full max-w-sm bg-surface rounded-2xl border-2 border-surface-container-highest shadow-2xl p-6 flex flex-col gap-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <span
                  className={`material-symbols-outlined text-5xl mb-3 ${pendingAction.type === 'remove' ? 'text-error' : 'text-secondary'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {pendingAction.type === 'remove' ? 'delete_forever' : 'restart_alt'}
                </span>
                <h3 className="font-black text-xl text-on-surface mb-1">
                  {pendingAction.type === 'reset' ? 'Reset Progress?' : 'Remove Course?'}
                </h3>
                <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
                  {pendingAction.type === 'reset'
                    ? `This will reset all your skill progress for ${pendingAction.courseName} back to the beginning. Your XP earned will remain.`
                    : `This will permanently remove ${pendingAction.courseName} and all progress from your profile. You will be taken back to course selection and cannot undo this.`}
                </p>
              </div>

              {error && (
                <p className="text-sm font-bold text-error text-center bg-error-container/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className={`w-full py-3 rounded-xl font-black text-base border-b-4 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:translate-y-[2px] active:border-b-0 ${
                    pendingAction.type === 'remove'
                      ? 'bg-error text-on-error border-on-error-container'
                      : 'bg-secondary text-on-secondary border-on-secondary-container'
                  }`}
                >
                  {submitting
                    ? 'Processing…'
                    : pendingAction.type === 'reset'
                    ? 'Yes, Reset Progress'
                    : 'Yes, Remove Course'}
                </button>
                <button
                  onClick={() => { setPendingAction(null); setError(null); }}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl border-2 border-surface-container-highest bg-surface-container text-on-surface font-bold text-base hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<T.UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TAB_OUTFIT);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdateAvatar = async (key: string, value: string) => {
    if (!profile) return;
    const newConfig = {
      outfit: profile.user.avatar_config?.outfit ?? 'Classic',
      accessory: profile.user.avatar_config?.accessory ?? null,
      color: profile.user.avatar_config?.color ?? 'Green',
      [key]: value,
    };
    setProfile({
      ...profile,
      user: {
        ...profile.user,
        avatar_config: newConfig
      }
    });

    try {
      await api.updateAvatar({ avatar_config: newConfig });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !profile) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="bg-surface-container-lowest text-on-background font-sans min-h-screen">
      {/* Desktop Top Nav bar (stats strip) */}
      <div className="hidden md:flex fixed top-0 right-0 left-64 h-16 bg-surface border-b-2 border-surface-container-highest justify-end items-center px-16 gap-6 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-error font-bold hover:bg-surface-container-low p-2 rounded-lg cursor-pointer transition-all">
            <span className="material-symbols-outlined">local_fire_department</span>
            <span>{profile.stats.streak_count}</span>
          </div>
          <div className="flex items-center gap-2 text-tertiary-container font-bold hover:bg-surface-container-low p-2 rounded-lg cursor-pointer transition-all">
            <span className="material-symbols-outlined text-[#ddad00]">monetization_on</span>
            <span className="text-[#ddad00]">{profile.stats.gems}</span>
          </div>
        </div>
      </div>

      <SideNav active="profile" />

      {/* Main Content Area */}
      <main className="md:ml-64 md:pt-16 min-h-screen pb-24 md:pb-0 relative">
        <div className="max-w-[1200px] mx-auto p-5 md:p-16 flex flex-col xl:flex-row gap-8">
          
          {/* Left/Center Column: Customization & Avatar */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="bg-surface rounded-xl border-2 border-surface-container-highest p-8 flex flex-col items-center justify-center relative overflow-hidden h-[400px]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary-fixed/40 via-transparent to-transparent opacity-50"></div>
              <h2 className="font-black text-2xl text-on-surface absolute top-6 left-6 z-10">Your Mascot</h2>
              <div className="relative z-10 w-64 h-64 flex items-center justify-center">
                <MascotAvatar
                  outfit={profile.user.avatar_config?.outfit ?? 'Classic'}
                  accessory={profile.user.avatar_config?.accessory || null}
                  color={profile.user.avatar_config?.color ?? 'Green'}
                  size={256}
                  className="w-full h-full drop-shadow-xl"
                />
              </div>
              <div className="absolute bottom-12 w-48 h-8 bg-black/10 rounded-full blur-md z-0"></div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Tabs */}
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {[
                  { id: TAB_OUTFIT, label: 'Outfits' },
                  { id: TAB_ACCESSORY, label: 'Accessories' },
                  { id: TAB_COLOR, label: 'Colors' },
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { playClick(); setActiveTab(t.id); }}
                    className={`btn-3d-neutral px-6 py-3 rounded-xl font-bold flex-shrink-0 ${
                      activeTab === t.id ? 'bg-secondary-container text-on-secondary-container border-[#004666]' : 'bg-surface text-on-surface-variant border-surface-dim'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Picker Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeTab === TAB_OUTFIT &&
                  MASCOT_OUTFITS.map((opt) => {
                    const isActive = (profile.user.avatar_config?.outfit ?? 'Classic') === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { playClick(); handleUpdateAvatar('outfit', opt); }}
                        className={`tile-3d rounded-xl p-4 flex flex-col items-center gap-2 ${isActive ? 'selected' : ''}`}
                      >
                        <div className="w-20 h-20 bg-surface-container-low rounded-xl flex items-center justify-center border-2 border-surface-dim overflow-hidden">
                          <OutfitPreview
                            outfit={opt}
                            color={profile.user.avatar_config?.color ?? 'Green'}
                          />
                        </div>
                        <span className="font-bold">{opt}</span>
                        <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">
                          {opt === 'Classic' && 'Bow tie look'}
                          {opt === 'Explorer' && 'Scarf & compass'}
                          {opt === 'Astro' && 'Space suit'}
                        </span>
                      </button>
                    );
                  })}

                {activeTab === TAB_ACCESSORY &&
                  (['None', 'Glasses', 'Hat'] as const).map((opt) => {
                    const isActive = (profile.user.avatar_config?.accessory || 'None') === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { playClick(); handleUpdateAvatar('accessory', opt === 'None' ? '' : opt); }}
                        className={`tile-3d rounded-xl p-4 flex flex-col items-center gap-2 ${isActive ? 'selected' : ''}`}
                      >
                        <div className="w-20 h-20 bg-surface-container-low rounded-xl flex items-center justify-center border-2 border-surface-dim overflow-hidden">
                          <AccessoryPreview
                            accessory={opt}
                            color={profile.user.avatar_config?.color ?? 'Green'}
                          />
                        </div>
                        <span className="font-bold">{opt}</span>
                        <span className="text-[11px] font-semibold text-on-surface-variant text-center leading-tight">
                          {opt === 'None' && 'No accessory'}
                          {opt === 'Glasses' && 'Round frames'}
                          {opt === 'Hat' && 'Cool cap'}
                        </span>
                      </button>
                    );
                  })}

                {activeTab === TAB_COLOR &&
                  MASCOT_COLOR_KEYS.map((opt) => {
                    const isActive = (profile.user.avatar_config?.color ?? 'Green') === opt;
                    const swatch = MASCOT_COLORS[opt];
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { playClick(); handleUpdateAvatar('color', opt); }}
                        className={`tile-3d rounded-xl p-4 flex flex-col items-center gap-2 ${isActive ? 'selected' : ''}`}
                      >
                        <div
                          className="w-20 h-20 rounded-xl flex items-center justify-center border-4 border-white shadow-inner relative overflow-hidden"
                          style={{ backgroundColor: swatch.fill }}
                        >
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{ background: `linear-gradient(135deg, transparent 40%, ${swatch.dark})` }}
                          />
                          <MascotAvatar
                            outfit={profile.user.avatar_config?.outfit ?? 'Classic'}
                            accessory={profile.user.avatar_config?.accessory || null}
                            color={opt}
                            size={72}
                            className="relative z-10 drop-shadow"
                          />
                        </div>
                        <span className="font-black text-base" style={{ color: swatch.dark }}>
                          {swatch.label}
                        </span>
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">
                          Color: {swatch.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Stats + Manage Courses */}
          <div className="w-full xl:w-80 flex flex-col gap-6">
            {/* User Card */}
            <div className="tile-3d bg-surface rounded-xl p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-surface-container-low rounded-full border-4 border-surface flex items-center justify-center mb-4 shadow-sm overflow-hidden">
                <MascotAvatar
                  outfit={profile.user.avatar_config?.outfit ?? 'Classic'}
                  accessory={profile.user.avatar_config?.accessory || null}
                  color={profile.user.avatar_config?.color ?? 'Green'}
                  size={88}
                />
              </div>
              <h3 className="font-black text-2xl">{profile.user.username}</h3>
              <p className="font-bold text-on-surface-variant mb-4">Joined {new Date(profile.user.created_at).toLocaleDateString()}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="tile-3d bg-surface p-4 rounded-xl flex flex-col items-start gap-2">
                <span className="material-symbols-outlined text-[#ddad00] text-3xl">local_fire_department</span>
                <div>
                  <p className="font-black text-xl">{profile.stats.streak_count}</p>
                  <p className="font-bold text-sm text-on-surface-variant">Day Streak</p>
                </div>
              </div>
              <div className="tile-3d bg-surface p-4 rounded-xl flex flex-col items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-3xl">monetization_on</span>
                <div>
                  <p className="font-black text-xl">{profile.stats.xp_total}</p>
                  <p className="font-bold text-sm text-on-surface-variant">Total XP</p>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="tile-3d bg-surface p-5 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-xl">Achievements</h4>
              </div>
              <div className="flex flex-col gap-3">
                {profile.achievements.length > 0 ? profile.achievements.map((ach) => {
                  const progress = Math.min(100, (ach.progress_current / ach.progress_target) * 100);
                  return (
                    <div key={ach.code} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container">
                        <span className="material-symbols-outlined text-xl">{ach.icon_key}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold leading-tight">{ach.title}</p>
                        <div className="w-full h-3 bg-surface-container-highest rounded-full mt-1 overflow-hidden relative">
                          <div className="h-full bg-primary-container rounded-full" style={{ width: `${progress}%` }}>
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-on-surface-variant font-bold text-sm">Keep learning to earn achievements!</p>
                )}
              </div>
            </div>

            {/* ── Manage Courses ── */}
            <ManageCoursesSection />
          </div>
        </div>
      </main>
    </div>
  );
}
