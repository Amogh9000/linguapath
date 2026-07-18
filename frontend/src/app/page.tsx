'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { GlobalLoader } from '@/components/GlobalLoader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import MascotAvatar from '@/components/MascotAvatar';
import {
  SITE_LANGUAGES,
  SiteLang,
  landingTranslations,
} from '@/lib/landingTranslations';
import { playClick } from '@/lib/sounds';

gsap.registerPlugin(ScrollTrigger);

const ParticleBurst = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            x: (Math.random() - 0.5) * 250,
            y: (Math.random() - 0.5) * 250,
            rotate: Math.random() * 360,
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute w-5 h-5 bg-[#ffc800]"
          style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }}
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const [selectedLang, setSelectedLang] = useState<SiteLang>('English');
  const [showLoader, setShowLoader] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const t = landingTranslations[selectedLang];
  
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
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
  }, { scope: containerRef });

  const handleGetStarted = () => {
    playClick();
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 1000);
  };

  const handleAlreadyHaveAccount = () => {
    playClick();
  };

  return (
    <div ref={containerRef} className="bg-white text-on-background min-h-screen flex flex-col font-sans overflow-x-hidden">
      {showLoader && <GlobalLoader onComplete={() => setShowLoader(false)} />}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .btn-3d-pressable {
          transition: all 0.1s;
        }
        .btn-3d-pressable:active {
          border-bottom-width: 0px !important;
          transform: translateY(4px);
        }
      `}} />

      <header className="w-full flex justify-between items-center px-5 md:px-12 lg:px-16 py-3 bg-white border-b-2 border-gray-100 fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="flex items-center gap-2 group" onClick={playClick}>
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MascotAvatar color="Green" size={48} className="w-full h-full" />
          </div>
          <span className="text-2xl md:text-3xl text-[#58cc02] font-black tracking-tight">
            Wayspeak
          </span>
        </Link>
        <Link
          href="/signup"
          onClick={handleGetStarted}
          className="bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-sm md:text-base px-5 md:px-8 py-2.5 md:py-3 rounded-xl border-b-4 border-[#58a700] active:border-b-0 active:translate-y-[4px] transition-all uppercase tracking-wide"
        >
          {t.getStarted}
        </Link>
      </header>

      <main className="flex-grow pt-24 flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="w-full max-w-[1200px] px-5 md:px-16 flex flex-col md:flex-row items-center justify-center gap-12 py-24 min-h-[85vh]">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left gap-8 order-2 md:order-1"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold text-[#3c3c3c] leading-[1.1] tracking-tight">
              {t.headline}
            </h1>
            <div className="flex flex-col gap-4 w-full max-w-sm mt-4 relative">
              <Link href="/signup" onClick={handleGetStarted} className="relative w-full block text-center bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-lg py-4 px-6 rounded-2xl border-b-8 border-[#58a700] active:border-b-0 active:translate-y-[8px] transition-all uppercase tracking-widest shadow-sm">
                {t.getStarted}
                {showParticles && <ParticleBurst />}
              </Link>
              <Link href="/login" onClick={handleAlreadyHaveAccount} className="w-full block text-center bg-white hover:bg-gray-50 text-[#1cb0f6] font-extrabold text-lg py-4 px-6 rounded-2xl border-2 border-b-4 border-gray-200 hover:border-gray-300 btn-3d-pressable uppercase tracking-widest shadow-sm">
                {t.alreadyHaveAccount}
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full md:w-1/2 flex justify-center order-1 md:order-2 relative"
          >
            <div className="absolute inset-0 bg-primary-container blur-3xl opacity-20 rounded-full w-3/4 h-3/4 m-auto"></div>
            <div className="relative z-10 animate-float">
              <MascotAvatar color="Green" size={420} className="w-72 h-72 md:w-[450px] md:h-[450px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.25)]" />
            </div>
          </motion.div>
        </section>

        {/* QUEST MAP SVG PATH — draws itself as you scroll (Level Map) */}
        <div className="w-full flex justify-center -mt-10 z-0 relative pointer-events-none overflow-visible" aria-hidden="true">
          <svg width="200" height="300" viewBox="0 0 200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M100 0 C 100 100, 200 150, 100 200 C 0 250, 100 300, 100 300" 
              stroke="#e5e7eb" 
              strokeWidth="12" 
              strokeDasharray="20 20" 
              strokeLinecap="round"
            />
            <path 
              ref={pathRef}
              d="M100 0 C 100 100, 200 150, 100 200 C 0 250, 100 300, 100 300" 
              stroke="#58cc02" 
              strokeWidth="12" 
              strokeDasharray="20 20" 
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* SECTION A: Gamified Core */}
        <section className="w-full bg-white border-t-2 border-gray-100">
          <div className="max-w-[1200px] mx-auto px-5 md:px-16 py-32 flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="w-full md:w-1/2"
            >
              <div className="group relative w-full max-w-md mx-auto aspect-square bg-[#ffc800]/10 rounded-[3rem] border-4 border-[#ffc800]/20 flex items-center justify-center p-8 overflow-hidden shadow-inner cursor-pointer">
                 <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ffc800] rounded-2xl rotate-12 drop-shadow-xl flex items-center justify-center border-b-4 border-[#cc9d00] z-20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[18deg] group-hover:-translate-y-1">
                   <span className="text-white font-black text-2xl">+10 XP</span>
                 </div>
                 <div className="w-full h-full bg-white rounded-3xl border-2 border-gray-200 drop-shadow-2xl flex flex-col items-center justify-center gap-6 p-6 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                    <div className="w-32 h-32 rounded-full border-8 border-[#58cc02] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:border-[#46a302]">
                       <span className="material-symbols-outlined text-6xl text-[#58cc02] transition-transform duration-300 group-hover:scale-125">check</span>
                    </div>
                    <div className="h-6 w-3/4 bg-gray-100 rounded-full transition-colors duration-300 group-hover:bg-gray-200"></div>
                    <div className="h-6 w-1/2 bg-gray-100 rounded-full transition-colors duration-300 group-hover:bg-gray-200"></div>
                 </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full md:w-1/2 flex flex-col gap-6 text-center md:text-left"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#3c3c3c]">
                {t.backedByScience}
              </h2>
              <p className="text-xl text-gray-500 font-semibold leading-relaxed">
                {t.backedByScienceBody}
              </p>
            </motion.div>
          </div>
        </section>

        {/* SECTION B: Psychology of Fun */}
        <section className="w-full bg-gray-50 border-t-2 border-gray-200">
          <div className="max-w-[1200px] mx-auto px-5 md:px-16 py-32 flex flex-col md:flex-row-reverse items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="w-full md:w-1/2"
            >
              <div className="group relative w-full max-w-md mx-auto aspect-square bg-[#ff9600]/10 rounded-[3rem] border-4 border-[#ff9600]/20 flex items-center justify-center p-8 overflow-hidden cursor-pointer">
                <div className="w-full bg-white rounded-3xl border-2 border-gray-200 drop-shadow-2xl flex flex-col p-6 gap-4 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1 group-hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-extrabold text-gray-400 transition-colors duration-300 group-hover:text-[#ff9600]">DAILY QUESTS</span>
                    <span className="material-symbols-outlined text-[#ff9600] text-3xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">local_fire_department</span>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 transition-all duration-300 group-hover:bg-[#ff9600]/25 group-hover:scale-110"></div>
                      <div className="flex-1">
                        <div className="h-4 w-3/4 bg-gray-200 rounded-full mb-2"></div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#ff9600] rounded-full origin-left scale-x-[0.55] transition-transform duration-500 ease-out group-hover:scale-x-100"
                            style={{ width: `${80 - (i * 15)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full md:w-1/2 flex flex-col gap-6 text-center md:text-left"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#3c3c3c]">
                {t.stayMotivated}
              </h2>
              <p className="text-xl text-gray-500 font-semibold leading-relaxed">
                {t.stayMotivatedBody}
              </p>
            </motion.div>
          </div>
        </section>

        {/* SECTION C: Learn Anywhere */}
        <section className="w-full bg-white border-t-2 border-gray-100">
          <div className="max-w-[1200px] mx-auto px-5 md:px-16 py-32 flex flex-col md:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="w-full md:w-1/2"
            >
              <div className="group relative w-full max-w-md mx-auto aspect-[4/3] bg-[#1cb0f6]/10 rounded-[3rem] border-4 border-[#1cb0f6]/20 flex items-center justify-center p-8 overflow-hidden cursor-pointer">
                <div className="flex gap-4 items-end transition-transform duration-300 group-hover:scale-[1.02]">
                  <div className="w-32 h-64 bg-white rounded-3xl border-4 border-gray-800 drop-shadow-2xl flex flex-col overflow-hidden relative z-20 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-2">
                    <div className="h-8 bg-gray-800 w-full flex justify-center items-center"><div className="w-12 h-2 bg-gray-600 rounded-full"></div></div>
                    <div className="flex-1 p-2 flex flex-col gap-2 bg-gray-50">
                      <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                      <div className="h-24 bg-[#1cb0f6]/20 rounded-xl w-full border-2 border-[#1cb0f6]/40 transition-colors duration-300 group-hover:bg-[#1cb0f6]/35"></div>
                    </div>
                  </div>
                  <div className="w-48 h-40 bg-white rounded-2xl border-4 border-gray-800 drop-shadow-xl flex flex-col overflow-hidden mb-8 relative z-10 transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-1">
                    <div className="flex-1 p-3 bg-gray-50 flex gap-2">
                       <div className="w-1/3 h-full bg-gray-200 rounded-md"></div>
                       <div className="w-2/3 h-full flex flex-col gap-2">
                         <div className="h-4 bg-gray-300 rounded w-full"></div>
                         <div className="h-12 bg-[#58cc02]/20 border-2 border-[#58cc02]/40 rounded-lg w-full transition-colors duration-300 group-hover:bg-[#58cc02]/35"></div>
                       </div>
                    </div>
                    <div className="h-4 bg-gray-800 w-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full md:w-1/2 flex flex-col gap-6 text-center md:text-left"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#3c3c3c]">
                {t.learnAnywhere}
              </h2>
              <p className="text-xl text-gray-500 font-semibold leading-relaxed">
                {t.learnAnywhereBody}
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Language strip + Duolingo-style green footer */}
      <div className="w-full bg-white border-t-2 border-gray-100 py-10">
        <div className="w-full max-w-[1100px] mx-auto px-5 flex flex-wrap justify-center gap-x-8 gap-y-3 text-on-surface-variant font-bold text-sm uppercase tracking-wider">
          {t.footerCourses.map((l) => (
            <span key={l} className="hover:text-[#58cc02] cursor-pointer transition-colors">{l}</span>
          ))}
        </div>
      </div>

      <footer className="w-full bg-[#58cc02] text-white">
        <div className="w-full max-w-[1100px] mx-auto px-5 md:px-8 py-14 md:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-6">
            {t.footerColumns.map((col) => (
              <div key={col.title} className="flex flex-col gap-3">
                <h3 className="font-extrabold text-base mb-1">{col.title}</h3>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-sm font-bold text-white/90 hover:text-white hover:underline transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 font-bold text-sm">
              <span>{t.siteLanguage}</span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as SiteLang)}
                className="bg-white/15 hover:bg-white/25 border-2 border-white/40 rounded-xl px-3 py-2 font-bold outline-none cursor-pointer text-white"
                aria-label={t.siteLanguage}
              >
                {SITE_LANGUAGES.map((l) => (
                  <option key={l} value={l} className="text-[#3c3c3c]">
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm font-bold text-white/80">{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
