'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Cpu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function Trust() {
  const { dict } = useLanguage();

  const items: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: ShieldCheck, title: dict.trust.security.title, desc: dict.trust.security.desc },
    { icon: Zap, title: dict.trust.speed.title, desc: dict.trust.speed.desc },
    { icon: Cpu, title: dict.trust.ai.title, desc: dict.trust.ai.desc },
  ];

  return (
    <section className="relative py-20 sm:py-32">
      <div className="absolute top-0 left-0 right-0 h-px gold-divider" />

      <div className="container-custom">
        <div className="flex items-center justify-center gap-3 mb-5 sm:mb-6">
          <span className="h-px w-8 sm:w-10 bg-gold-400/40" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-gold-300">Why us</span>
          <span className="h-px w-8 sm:w-10 bg-gold-400/40" />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-6xl font-bold mb-12 sm:mb-20 text-center gold-gradient-text"
        >
          {dict.trust.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {items.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="group relative rounded-2xl border border-gold-400/15 bg-ink-900/50 p-6 sm:p-8
                         hover:border-gold-300/45 hover:bg-ink-800/60 transition-colors duration-500"
            >
              <div className="absolute -top-px left-6 right-6 h-px bg-linear-to-r from-transparent via-gold-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative mb-6 inline-flex">
                <div className="absolute inset-0 blur-2xl bg-gold-400/20 rounded-full" />
                <div className="relative w-12 h-12 rounded-xl border border-gold-400/30 bg-ink-800/80 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold-300" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-3 text-neutral-50">{title}</h3>
              <p className="text-neutral-400 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
