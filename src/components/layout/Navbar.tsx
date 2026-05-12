'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/layout/LanguageProvider';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Code2, Smartphone, Sparkles, Wallet, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const productIcons: LucideIcon[] = [Wallet];
const agencyIcons: LucideIcon[] = [Code2, Smartphone, Sparkles];

type DropdownItem = {
  title: string;
  description: string;
  href?: string;
  cta?: string;
};

export default function Navbar() {
  const { language, setLanguage, dict } = useLanguage();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) setHidden(true);
    else setHidden(false);
  });

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!servicesRef.current?.contains(e.target as Node)) setServicesOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <motion.nav
      variants={{ visible: { y: 0 }, hidden: { y: -120 } }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center py-5 pointer-events-none"
    >
      <div
        className="pointer-events-auto flex items-center gap-6 px-5 py-2.5 rounded-full
                   border border-gold-400/20 bg-ink-900/80 backdrop-blur-xl
                   shadow-[0_8px_40px_-12px_rgba(212,175,55,0.25)]"
      >
        <Link href="/" className="font-display font-bold text-lg tracking-tight flex items-baseline gap-0.5">
          <span className="text-neutral-100">nonx</span>
          <span className="gold-gradient-text">dev</span>
          <span className="w-1 h-1 rounded-full bg-gold-400 ml-0.5" />
        </Link>

        <div className="w-px h-4 bg-gold-400/20" />

        <div className="hidden sm:flex items-center gap-5 text-xs uppercase tracking-[0.18em] text-neutral-400">
          <div
            ref={servicesRef}
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setServicesOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={servicesOpen}
              className="flex items-center gap-1 hover:text-gold-200 transition-colors"
            >
              Services
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  role="menu"
                  className="absolute left-1/2 -translate-x-1/2 top-full pt-4"
                >
                  <div className="w-[24rem] rounded-2xl border border-gold-400/20 bg-ink-900/95 backdrop-blur-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden">
                    <DropdownGroup
                      label={dict.services.products.eyebrow}
                      sectionAnchor="/#products"
                      items={dict.services.products.items as DropdownItem[]}
                      icons={productIcons}
                      onClickItem={() => setServicesOpen(false)}
                    />
                    <div className="border-t border-gold-400/10" />
                    <DropdownGroup
                      label={dict.services.agency.eyebrow}
                      sectionAnchor="/#agency"
                      items={dict.services.agency.items as DropdownItem[]}
                      icons={agencyIcons}
                      onClickItem={() => setServicesOpen(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <a href="/#portfolio" className="hover:text-gold-200 transition-colors">Work</a>
          <a href="/#contact" className="hover:text-gold-200 transition-colors">Contact</a>
        </div>

        <div className="hidden sm:block w-px h-4 bg-gold-400/20" />

        <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wider">
          <button
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              language === 'en' ? 'text-gold-200' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            EN
          </button>
          <span className="text-neutral-700">·</span>
          <button
            onClick={() => setLanguage('th')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              language === 'th' ? 'text-gold-200' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            TH
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function DropdownGroup({
  label,
  sectionAnchor,
  items,
  icons,
  onClickItem,
}: {
  label: string;
  sectionAnchor: string;
  items: DropdownItem[];
  icons: LucideIcon[];
  onClickItem: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70">{label}</span>
        <Link
          href={sectionAnchor}
          onClick={onClickItem}
          className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 hover:text-gold-200 inline-flex items-center gap-1"
        >
          View
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <ul className="px-2 pb-2">
        {items.map((item, i) => {
          const Icon = icons[i % icons.length] ?? Sparkles;
          const href = item.href ?? sectionAnchor;
          const isExternalService = !!item.href;
          return (
            <li key={i}>
              <Link
                href={href}
                onClick={onClickItem}
                className="group flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-ink-800/80 transition-colors"
              >
                <span className="mt-0.5 inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-lg border border-gold-400/25 bg-ink-800 text-gold-300 group-hover:border-gold-300/60 transition-colors">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-100 normal-case tracking-normal group-hover:text-gold-100">
                    <span className="truncate">{item.title}</span>
                    {isExternalService && (
                      <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-gold-300/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </span>
                  <span className="block mt-0.5 text-[11.5px] leading-snug text-neutral-400 normal-case tracking-normal line-clamp-2">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
