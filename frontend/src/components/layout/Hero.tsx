'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowDown } from 'lucide-react';
import { useLanguage } from '@/components/layout/LanguageProvider';

// Dynamically import 3D scene to avoid SSR issues
const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), { ssr: false });

export default function Hero() {
  const { dict } = useLanguage();

  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* 3D Background */}
      <HeroScene />

      <div className="container-custom relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            {dict.hero.title_line1}
            <br />
            {dict.hero.title_line2}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 font-light"
        >
          {dict.hero.subtitle_prefix} <span className="text-indigo-400 font-medium">{dict.hero.subtitle_highlight1}</span> {dict.hero.subtitle_middle} <br className="hidden md:block"/> 
          <span className="text-purple-400 font-medium">{dict.hero.subtitle_highlight2}</span>{dict.hero.subtitle_suffix}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button className="px-8 py-3 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300">
            {dict.hero.cta}
          </button>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ArrowDown className="w-8 h-8 text-white/50" />
      </motion.div>
    </section>
  );
}
