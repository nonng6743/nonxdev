'use client';

import Hero from '@/components/layout/Hero';
import Services from '@/components/layout/Services';
import Trust from '@/components/layout/Trust';
import SmoothScroll from '@/components/layout/SmoothScroll';
import { useLanguage } from '@/components/layout/LanguageProvider';

export default function Home() {
  const { dict } = useLanguage();

  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white">
        <Hero />
        <Services />
        <Trust />
        
        <section className="py-20 text-center border-t border-neutral-900">
          <div className="container-custom">
            <h2 className="text-4xl font-bold mb-8">{dict.cta.headline}</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              {dict.cta.subtext}
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-10 mt-8">
              {/* Email & Phone */}
              <div className="flex flex-col items-center gap-8">
              <a href="mailto:nonxdev@gmail.com" className="inline-block px-8 py-3 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {dict.cta.button}
              </a>
              
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <a href="tel:0830292314" className="text-xl text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-2xl">📞</span> 083-029-2314
                </a>
              </div>

              {/* Line QR Code */}
              <div className="mt-4 p-4 bg-white rounded-2xl max-w-[200px] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src="/images/line-qr.jpg" alt="Line QR Code" className="w-full h-auto rounded-lg" />
                <p className="text-black text-center text-xs font-bold mt-2">SCAN TO CHAT</p>
              </div>
            </div>

            </div>
          </div>
        </section>
        
        <footer className="py-10 text-center text-sm text-gray-600">
          {dict.footer}
        </footer>
      </main>
    </SmoothScroll>
  );
}
