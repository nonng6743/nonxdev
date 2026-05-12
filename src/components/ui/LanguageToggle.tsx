'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';
import { motion } from 'framer-motion';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
      <button
        onClick={() => setLanguage('en')}
        className={`relative px-3 py-1 text-sm font-medium transition-colors ${
          language === 'en' ? 'text-black' : 'text-gray-400 hover:text-white'
        }`}
      >
        {language === 'en' && (
          <motion.div
            layoutId="active-lang"
            className="absolute inset-0 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">EN</span>
      </button>

      <button
        onClick={() => setLanguage('th')}
        className={`relative px-3 py-1 text-sm font-medium transition-colors ${
          language === 'th' ? 'text-black' : 'text-gray-400 hover:text-white'
        }`}
      >
        {language === 'th' && (
          <motion.div
            layoutId="active-lang"
            className="absolute inset-0 bg-white rounded-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10">TH</span>
      </button>
    </div>
  );
}
