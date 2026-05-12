'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Code2, Smartphone, Sparkles, Wallet, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/components/layout/LanguageProvider';

const productAccents = [
  'from-[#f6d97a]/25 via-[#d4af37]/10 to-transparent',
];
const productIcons: LucideIcon[] = [Wallet];

const agencyAccents = [
  'from-[#fdf8e7]/20 via-[#d4af37]/10 to-transparent',
  'from-[#f0c14b]/25 via-[#8c6a1f]/10 to-transparent',
  'from-[#fbeec0]/20 via-[#b8902b]/10 to-transparent',
];
const agencyIcons: LucideIcon[] = [Code2, Smartphone, Sparkles];

type ServiceItem = { title: string; description: string; href?: string; cta?: string };

export default function Services() {
  const { dict } = useLanguage();
  const { products, agency } = dict.services;

  return (
    <section id="services" className="relative py-20 sm:py-32 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px gold-divider" />

      <div className="container-custom space-y-20 sm:space-y-32">
        <ServiceGroup
          id="products"
          eyebrow={products.eyebrow}
          title={products.title}
          subtitle={products.subtitle}
          items={products.items as ServiceItem[]}
          accents={productAccents}
          icons={productIcons}
        />

        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 h-px gold-divider" />
          <div className="relative flex justify-center">
            <span className="px-6 bg-background text-[10px] uppercase tracking-[0.4em] text-gold-300/60">
              · · ·
            </span>
          </div>
        </div>

        <ServiceGroup
          id="agency"
          eyebrow={agency.eyebrow}
          title={agency.title}
          subtitle={agency.subtitle}
          items={agency.items as ServiceItem[]}
          accents={agencyAccents}
          icons={agencyIcons}
        />
      </div>
    </section>
  );
}

type GroupProps = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: ServiceItem[];
  accents: string[];
  icons: LucideIcon[];
};

function ServiceGroup({ id, eyebrow, title, subtitle, items, accents, icons }: GroupProps) {
  return (
    <div id={id} className="scroll-mt-32">
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-20">
        <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5">
          <span className="h-px w-8 sm:w-10 bg-gold-400/40" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-gold-300">{eyebrow}</span>
          <span className="h-px w-8 sm:w-10 bg-gold-400/40" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold gold-gradient-text mb-3 sm:mb-4">{title}</h2>
        <p className="text-neutral-400 text-base sm:text-lg">{subtitle}</p>
      </div>

      <div className="space-y-20 sm:space-y-32">
        {items.map((service, index) => (
          <ServiceCard
            key={index}
            service={service}
            index={index}
            accent={accents[index % accents.length]}
            Icon={icons[index % icons.length] ?? Sparkles}
          />
        ))}
      </div>
    </div>
  );
}

type ServiceCardProps = {
  service: ServiceItem;
  index: number;
  accent: string;
  Icon: LucideIcon;
};

function ServiceCard({ service, index, accent, Icon }: ServiceCardProps) {
  const reversed = index % 2 === 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: '-100px' }}
      className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-20`}
    >
      <div className="w-full md:w-1/2 relative aspect-[4/3] rounded-2xl md:rounded-3xl overflow-hidden border border-gold-400/15 bg-ink-900">
        <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.18),transparent_60%)]" />

        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
          <span className="font-mono">{String(index + 1).padStart(2, '0')}</span>
          <span className="h-px w-6 bg-gold-400/40" />
        </div>

        <span className="absolute -bottom-6 -right-2 text-[8rem] sm:text-[10rem] md:text-[14rem] font-black leading-none gold-gradient-text opacity-[0.07] select-none">
          {index + 1}
        </span>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gold-400/25 rounded-full" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-gold-400/30 bg-ink-800/60 backdrop-blur-md flex items-center justify-center">
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gold-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2">
        <div className="flex items-center gap-3 mb-3 sm:mb-4 text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
          <span className="h-px w-8 bg-gold-400/50" />
          Service {String(index + 1).padStart(2, '0')}
        </div>
        <h3 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-5 text-neutral-50 leading-[1.15]">
          {service.title}
        </h3>
        <p className="text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed">
          {service.description}
        </p>

        {service.href && service.cta && (
          <Link
            href={service.href}
            className="group inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full font-semibold text-sm tracking-wide
                       bg-linear-to-b from-gold-200 via-gold-400 to-gold-600 text-ink-900 gold-glow
                       transition-transform duration-300 hover:scale-[1.03]"
          >
            {service.cta}
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
