'use client';

import Image from 'next/image';
import { Mail, Phone, ArrowUpRight } from 'lucide-react';
import Hero from '@/components/layout/Hero';
import Services from '@/components/layout/Services';
import Portfolio from '@/components/layout/Portfolio';
import Trust from '@/components/layout/Trust';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { useLanguage } from '@/components/layout/LanguageProvider';

export default function Home() {
  const { dict } = useLanguage();

  return (
    <SmoothScroll>
      <main className="min-h-screen bg-background text-foreground">
        <Hero />
        <Services />
        <Portfolio />
        <Trust />

        {/* CTA Section */}
        <section id="contact" className="relative py-32">
          <div className="absolute top-0 left-0 right-0 h-px gold-divider" />
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_60%)]" />

          <div className="container-custom relative">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-gold-400/40" />
              <span className="text-[11px] uppercase tracking-[0.35em] text-gold-300">Let&apos;s talk</span>
              <span className="h-px w-10 bg-gold-400/40" />
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-center gold-gradient-text">
              {dict.cta.headline}
            </h2>
            <p className="text-neutral-400 mb-14 max-w-xl mx-auto text-center text-lg">
              {dict.cta.subtext}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Email CTA */}
              <a
                href="mailto:nonxdev@gmail.com"
                className="group relative rounded-2xl border border-gold-400/20 bg-ink-900/60 p-8
                           hover:border-gold-300/50 transition-colors duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-11 h-11 rounded-xl border border-gold-400/30 bg-ink-800/80 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gold-300" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gold-300/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-gold-300 mb-2">Email</div>
                <div className="text-lg font-semibold text-neutral-50 break-all">nonxdev@gmail.com</div>
              </a>

              {/* Phone CTA */}
              <a
                href="tel:0830292314"
                className="group relative rounded-2xl border border-gold-400/20 bg-ink-900/60 p-8
                           hover:border-gold-300/50 transition-colors duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-11 h-11 rounded-xl border border-gold-400/30 bg-ink-800/80 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-gold-300" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gold-300/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-gold-300 mb-2">Phone</div>
                <div className="text-lg font-semibold text-neutral-50">083-029-2314</div>
              </a>

              {/* Line QR Card */}
              <div className="relative rounded-2xl border border-gold-400/20 bg-ink-900/60 p-6 flex flex-col items-center">
                <div className="text-[11px] uppercase tracking-[0.25em] text-gold-300 mb-3">Scan to chat</div>
                <div className="relative p-2 rounded-xl bg-neutral-50 shadow-[0_10px_40px_-10px_rgba(212,175,55,0.4)]">
                  <Image
                    src="/images/line-qr.jpg"
                    alt="Line QR Code"
                    width={160}
                    height={160}
                    className="rounded-lg w-32 h-32 md:w-36 md:h-36 object-cover"
                    unoptimized
                  />
                </div>
                <div className="mt-3 text-xs text-neutral-400">LINE Official</div>
              </div>
            </div>

            {/* Primary CTA */}
            <div className="flex justify-center mt-14">
              <a
                href="mailto:nonxdev@gmail.com"
                className="group inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold text-sm tracking-wide
                           bg-linear-to-b from-[#f6d97a] via-[#d4af37] to-[#8c6a1f]
                           text-ink-900 gold-glow transition-transform duration-300 hover:scale-[1.03]"
              >
                {dict.cta.button}
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative border-t border-gold-400/10">
          <div className="container-custom py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
            <div className="flex items-baseline gap-0.5 font-display">
              <span className="text-neutral-300">nonx</span>
              <span className="gold-gradient-text font-bold">dev</span>
              <span className="ml-3 text-neutral-600">— {dict.footer}</span>
            </div>
            <div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-neutral-500">
              <a href="#services" className="hover:text-gold-200 transition-colors">Services</a>
              <a href="#portfolio" className="hover:text-gold-200 transition-colors">Work</a>
              <a href="#contact" className="hover:text-gold-200 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </SmoothScroll>
  );
}
