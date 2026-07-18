'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

type Language = 'Spanish' | 'French' | 'Japanese';
type Proficiency = 'New to it' | 'I know some words' | "I'm pretty good";
type Commitment = '5 min' | '10 min' | '15 min' | '20 min';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<Language>('Spanish');
  const [proficiency, setProficiency] = useState<Proficiency>('New to it');
  const [commitment, setCommitment] = useState<Commitment>('10 min');
  const [loading, setLoading] = useState(false);

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  // Guard: redirect to signup if not authenticated
  useEffect(() => {
    if (!api.getToken()) {
      router.replace('/signup');
    }
  }, [router]);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.setOnboarding({
        chosen_language: language.toLowerCase(),
        proficiency_level: proficiency === 'I know some words' ? 'some_words' : proficiency === "I'm pretty good" ? 'pretty_good' : 'new',
        daily_commitment_minutes: parseInt(commitment.split(' ')[0], 10)
      });
      // Force a full refresh to dash so App Layout loads correctly if needed, or just router.push
      window.location.href = '/learn';
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Framer Motion variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="bg-background text-on-background min-h-[100dvh] flex flex-col items-center justify-center overflow-x-hidden">
      <div className="fixed top-0 left-0 right-0 h-16 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm border-b-2 border-surface-container-highest">
        <h1 className="text-2xl text-primary font-black">Wayspeak</h1>
      </div>

      <main className="w-full max-w-[1200px] mx-auto flex-grow flex flex-col justify-center pt-16 pb-28 px-5 relative min-h-[100dvh]">
        <div className="flex-grow flex items-center justify-center w-full relative">
          
          <AnimatePresence initial={false} custom={1} mode="wait">
            {step === 1 && (
              <motion.section 
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center justify-center absolute"
              >
                <h2 className="text-3xl font-black text-center mb-8">Which language do you want to learn?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                  {/* Language Cards */}
                  {[
                    { lang: 'Spanish', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTirsoKmBtD_o9dCRoi6CLsSGpNwdXLOJPZIwLNAZVlUleJkS_x3WHX3-BkPR6fyTnIKSV8Ey4hYu-gKIMgvpk801X2AaOMPcQB8zHgSXs6zFJd2EGumlNQJF7EfSA7hdL9iqWbXRblYPL5riCAE4ROJ_FFE1UXnD6eejPFjDBAuDAc0DEw_gM7hEn_HLgiZN4NkQ7aE5Td9wOIx3lc1FnDKTKHikvrwhKyuYVc8r8bfrQJv1vSDnR' },
                    { lang: 'French', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkKd9fUJQM09yYHmoh8aQv1q0ezgo49ZrD7vLA4Huj1nAty3DnbjKEeQkv6a3uNsq_3s54uUM9ckS9Kz4AiZxl48qfB9X_c2GgGnEx7JX3dphL-_QaLZGYONbg7DARU5QkwcxPbBpkTmUETnnRMzO6TM7fsyrZYF5jxCYeAb1q6ufIl3oO7eWzZ_qC7RjHP4ZNnoLTePs1Ln_4Y3c-gpUTU0HUgC_2FP4lBHbUcUOmHIuOQXC0LQOQ' },
                    { lang: 'Japanese', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABbF9HafZxb8Ft_1QHdTTKVx3MeuyhVJv7Ezq4d-dTAKnMPSvShepTpnXKPKT6NquhnB5GYNsfleaEb-uRkF0Bv1cfxWbXYcbTpV3g_SNrjfwlYPaLm7maP6Neuvc66st0EPRTIm_Fkli6vPlnP3nBlnflKsBmj4heg0td2EGMqlODTGn-exyy4aSa5WSOq6IGdkQiqo7lQMUI0jYQqBq4daSYg5JGp8x5cCbfAK_QHDcrFIu2ovka' }
                  ].map(opt => (
                    <button 
                      key={opt.lang}
                      onClick={() => { setLanguage(opt.lang as Language); nextStep(); }}
                      className={`tile-3d p-6 flex flex-col items-center gap-4 rounded-2xl ${language === opt.lang ? 'selected' : ''}`}
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-surface-container-highest">
                        <img src={opt.img} className="w-full h-full object-cover" alt={opt.lang} />
                      </div>
                      <span className="text-xl font-black">{opt.lang}</span>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section 
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center justify-center absolute"
              >
                <h2 className="text-3xl font-black text-center mb-8">How well do you know it?</h2>
                <div className="flex flex-col gap-4 w-full max-w-2xl">
                  {[
                    { prof: 'New to it', desc: "I'm just starting from scratch.", img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApULByZ0pWFwaolU8kFJkKa0sb5tBg_vA-TAsCuOCvRXHLG1u6IoqiaxgHdVo_RnrqKcqpzSSTnSkl96AOfpTNQNnGhSifqyXy0k_Y_kcm4cagBWfgkbaAky5ML4ASIhyPLwqE37qlPAfOStXXA2R87eRqu4Ojc3spV81IEihEXr2Rb8V3EpICpjwAYqCRLy0BOQIVeZOuiC5wVDqzIo1ynKWL_lu7MpZnjxQfUMxbRhbvihxgfUn7' },
                    { prof: 'I know some words', desc: 'I can understand basic phrases.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFnIsjAZA4yvciitBxXsBly6u6-nsB2oFxqoYDvhHabyNl68Wi_yFXRcWrF4Ifq_t7rBtVV_npXFdvkUDLlsPrE2-YIASQmF46ggHun3oj-O9AappumS0je5yiPwTH83ksREQDPQg68Z9PbsMrvyNHwUyItMBA21rgDl38Bf_q4k9b0Kk5xdMTeqEtWBQOOsXFRjs3SzMrSnnoTVL6Sf7If04ACByY1k7qkM4LMstIOMduIxh6DBzv' },
                    { prof: "I'm pretty good", desc: 'I want to master it completely.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHQiymFV3K-EzkrxbVMZC8IlMkh9GirbnzLSfayHDCRywaPaU_9rJES_gv1y0iejg22z1C_7b9e6-dYC7uvHuJMHN__xtL38KxBBUjSNYlUHrRGUw8K0v0QTzyVQ67hMlUQ2orcrTNENKyk9fPgYQdCMgCkWd8md_S_jXirk_-9Hb_GtPY2uAwtlRVGgvIFE-N5Wj2YlkYwQxTdHSKReNuy4th8iczNSNcFLXCUwD14hqg1--S_4w_' }
                  ].map(opt => (
                    <button 
                      key={opt.prof}
                      onClick={() => { setProficiency(opt.prof as Proficiency); nextStep(); }}
                      className={`tile-3d p-4 flex items-center gap-6 rounded-2xl text-left ${proficiency === opt.prof ? 'selected' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                        <img src={opt.img} className="w-full h-full object-cover" alt={opt.prof} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black mb-1">{opt.prof}</h3>
                        <p className="text-base font-semibold text-on-surface-variant">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section 
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col items-center justify-center absolute"
              >
                <h2 className="text-3xl font-black text-center mb-8">How much time can you commit daily?</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                  {['5 min', '10 min', '15 min', '20 min'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setCommitment(opt as Commitment)}
                      className={`btn-3d-neutral bg-white rounded-full border-2 border-surface-container-highest py-4 px-6 text-xl font-black text-center hover:bg-surface-container-low focus:bg-primary-container focus:border-primary-fixed focus:text-on-primary-container ${commitment === opt ? 'bg-primary-container text-on-primary-container border-primary-fixed' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="mt-12">
                  <button 
                    disabled={loading}
                    onClick={handleComplete}
                    className="btn-3d-primary bg-primary rounded-xl py-4 px-12 text-xl font-black text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {loading ? 'Setting up...' : 'Continue'}
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

        </div>

        {/* Dots */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${step === i ? 'bg-primary' : 'bg-surface-container-highest'}`}
            ></div>
          ))}
        </div>
      </main>
    </div>
  );
}
