'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/ThemeProvider';
import { api } from '@/lib/api';

interface SettingsModalProps {
  onClose: () => void;
}

type Step = 'main' | 'confirm-delete';

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState<Step>('main');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    api.clearToken();
    document.documentElement.removeAttribute('data-theme');
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount();
      api.clearToken();
      document.documentElement.removeAttribute('data-theme');
      router.push('/');
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    // Backdrop
    <AnimatePresence>
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          key="settings-panel"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          className="relative w-full max-w-md bg-surface rounded-2xl border-2 border-surface-container-highest shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b-2 border-surface-container-highest">
            <h2 className="font-black text-xl text-on-surface">
              {step === 'confirm-delete' ? '⚠️ Delete Account' : '⚙️ Settings'}
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              aria-label="Close settings"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="p-6 flex flex-col gap-3"
              >
                {/* Theme Toggle */}
                <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-5 py-4 border-2 border-surface-container-highest">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                      {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                    <div>
                      <p className="font-bold text-on-surface">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p className="text-xs text-on-surface-variant font-semibold">
                        Switch app appearance
                      </p>
                    </div>
                  </div>
                  {/* Toggle Switch */}
                  <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      theme === 'dark' ? 'bg-primary-container' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
                        theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs text-on-surface-variant" style={{ fontSize: '14px' }}>
                        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-surface-container-highest my-1" />

                {/* Log Out */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-surface-container-low border-2 border-surface-container-highest hover:bg-surface-container transition-colors text-left group"
                >
                  <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-on-surface transition-colors">
                    logout
                  </span>
                  <div>
                    <p className="font-bold text-on-surface">Log Out</p>
                    <p className="text-xs text-on-surface-variant font-semibold">Sign out of your account</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => setStep('confirm-delete')}
                  className="flex items-center gap-3 w-full px-5 py-4 rounded-xl bg-error-container/20 border-2 border-error/30 hover:bg-error-container/40 transition-colors text-left group"
                >
                  <span className="material-symbols-outlined text-2xl text-error">
                    delete_forever
                  </span>
                  <div>
                    <p className="font-bold text-error">Delete Account</p>
                    <p className="text-xs text-on-surface-variant font-semibold">Permanently remove all your data</p>
                  </div>
                  <span className="material-symbols-outlined text-error ml-auto">chevron_right</span>
                </button>
              </motion.div>
            )}

            {step === 'confirm-delete' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="p-6 flex flex-col gap-5"
              >
                {/* Warning card */}
                <div className="bg-error-container/20 border-2 border-error/40 rounded-xl p-5 flex flex-col gap-3 text-center">
                  <span className="material-symbols-outlined text-5xl text-error mx-auto" style={{ fontVariationSettings: "'FILL' 1" }}>
                    warning
                  </span>
                  <p className="font-black text-lg text-on-surface">Are you absolutely sure?</p>
                  <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
                    This will <span className="text-error font-bold">permanently delete</span> your account,
                    all your XP, streaks, achievements, and course progress.
                    <br /><br />
                    <span className="font-black text-on-surface">This cannot be undone.</span>
                  </p>
                </div>

                {error && (
                  <p className="text-sm font-bold text-error text-center bg-error-container/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="w-full py-4 rounded-xl bg-error text-on-error font-black text-base border-b-4 border-on-error-container disabled:opacity-60 disabled:cursor-not-allowed transition-all active:translate-y-[2px] active:border-b-0 hover:brightness-95"
                  >
                    {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
                  </button>
                  <button
                    onClick={() => { setStep('main'); setError(null); }}
                    disabled={deleting}
                    className="w-full py-4 rounded-xl bg-surface-container border-2 border-surface-container-highest text-on-surface font-bold text-base hover:bg-surface-container-high transition-colors"
                  >
                    Cancel, Keep My Account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
