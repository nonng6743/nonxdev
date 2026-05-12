'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const { language, setLanguage } = useLanguage();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: -100 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 pointer-events-none"
    >
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl pointer-events-auto">
        {/* Stylized Logo */}
        <div className="font-bold text-xl tracking-tighter flex items-center gap-1">
          <span className="text-white">nonx</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">dev</span>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-4 bg-white/20" />

        {/* Language Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`text-xs font-medium transition-colors ${
              language === 'en' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            EN
          </button>
          <span className="text-gray-700">/</span>
          <button
            onClick={() => setLanguage('th')}
            className={`text-xs font-medium transition-colors ${
              language === 'th' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            TH
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
