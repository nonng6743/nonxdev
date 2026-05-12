'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

type PortfolioItem = {
  title: string;
  category: string;
  description: string;
  link: string;
};

export default function Portfolio() {
  const { dict } = useLanguage();

  return (
    <section id="portfolio" className="relative py-32">
      <div className="absolute top-0 left-0 right-0 h-px gold-divider" />

      <div className="container-custom">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="h-px w-10 bg-gold-400/40" />
          <span className="text-[11px] uppercase tracking-[0.35em] text-gold-300">Selected Work</span>
          <span className="h-px w-10 bg-gold-400/40" />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-7xl font-bold mb-20 text-center gold-gradient-text"
        >
          {dict.portfolio.headline}
        </motion.h2>

        <div className="grid grid-cols-1 gap-10">
          {(dict.portfolio.items as PortfolioItem[]).map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group relative block rounded-3xl overflow-hidden
                         border border-gold-400/15 bg-ink-900/60
                         hover:border-gold-300/50 transition-all duration-500"
            >
              {/* Gold corner accents */}
              <span className="pointer-events-none absolute top-0 left-0 w-12 h-px bg-gradient-to-r from-gold-400/70 to-transparent" />
              <span className="pointer-events-none absolute top-0 left-0 w-px h-12 bg-gradient-to-b from-gold-400/70 to-transparent" />
              <span className="pointer-events-none absolute bottom-0 right-0 w-12 h-px bg-gradient-to-l from-gold-400/70 to-transparent" />
              <span className="pointer-events-none absolute bottom-0 right-0 w-px h-12 bg-gradient-to-t from-gold-400/70 to-transparent" />

              <div className="flex flex-col md:flex-row">
                {/* Visual */}
                <div className="relative w-full md:w-3/5 h-72 md:h-[28rem] overflow-hidden bg-ink-800">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-ink-900 via-transparent to-gold-700/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl md:text-7xl font-black gold-gradient-text opacity-20 group-hover:opacity-40 transition-opacity duration-500 tracking-tight">
                      3D MAP
                    </span>
                  </div>
                  <div className="absolute top-6 left-6 text-[11px] uppercase tracking-[0.3em] text-gold-300/90">
                    Case 01
                  </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-[0.25em] text-gold-300 mb-5">
                    {item.category}
                  </span>
                  <h3 className="text-2xl md:text-4xl font-bold mb-5 text-neutral-50 leading-tight group-hover:text-gold-100 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 mb-8 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-gold-300 group-hover:text-gold-200">
                    <span>{dict.portfolio.view_project}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
