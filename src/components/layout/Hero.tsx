'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowDown, Sparkles, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/components/layout/LanguageProvider';

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), { ssr: false });

export default function Hero() {
  const { dict } = useLanguage();

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      <HeroScene />

      {/* Vignette to anchor text against 3D scene */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,4,3,0.85)_85%)]" />

      <div className="container-custom relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold-400)]/30 bg-[color:var(--color-ink-900)]/60 backdrop-blur px-3.5 py-1.5 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[color:var(--color-gold-200)] mb-6 sm:mb-8 max-w-[calc(100vw-3rem)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Premium Software Studio
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <h1 className="text-5xl sm:text-7xl md:text-[9rem] leading-[0.95] font-black tracking-tighter mb-5 sm:mb-6 gold-gradient-text">
            {dict.hero.title_line1}
            <br />
            {dict.hero.title_line2}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-base sm:text-lg md:text-2xl text-neutral-300/90 max-w-3xl mx-auto mb-10 sm:mb-12 font-light"
        >
          {dict.hero.subtitle_prefix}{' '}
          <span className="text-[color:var(--color-gold-300)] font-medium">
            {dict.hero.subtitle_highlight1}
          </span>{' '}
          {dict.hero.subtitle_middle}{' '}
          <span className="text-[color:var(--color-gold-300)] font-medium">
            {dict.hero.subtitle_highlight2}
          </span>
          {dict.hero.subtitle_suffix}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#contact"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide
                       bg-gradient-to-b from-[#f6d97a] via-[#d4af37] to-[#8c6a1f]
                       text-[color:var(--color-ink-900)] gold-glow
                       transition-transform duration-300 hover:scale-[1.03]"
          >
            {dict.hero.cta}
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#portfolio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm tracking-wide
                       border border-[color:var(--color-gold-400)]/25 text-neutral-200
                       hover:border-[color:var(--color-gold-300)]/60 hover:text-white transition-colors"
          >
            View Work
          </a>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[color:var(--color-gold-300)]/60"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
}
