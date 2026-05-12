'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export default function Portfolio() {
  const { dict } = useLanguage();

  return (
    <section className="py-24 bg-neutral-900">
      <div className="container-custom">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold mb-16 text-center"
        >
          {dict.portfolio.headline}
        </motion.h2>

        <div className="grid grid-cols-1 gap-12">
          {dict.portfolio.items.map((item: any, index: number) => (
            <motion.a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group block relative rounded-3xl overflow-hidden bg-neutral-800 border border-white/10 hover:border-indigo-500/50 transition-colors duration-500"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image Placeholder / Visual */}
                <div className="w-full md:w-3/5 aspect-video md:aspect-auto h-64 md:h-96 relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 group-hover:scale-[1.02] transition-transform duration-700">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl md:text-6xl font-black text-white/10 group-hover:text-white/20 transition-colors">3D MAP</span>
                   </div>
                </div>

                {/* Content */}
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center">
                  <span className="text-indigo-400 font-medium mb-4">{item.category}</span>
                  <h3 className="text-2xl md:text-4xl font-bold mb-4 group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform duration-300">
                    {dict.portfolio.view_project}
                    <ArrowUpRight className="w-5 h-5" />
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
