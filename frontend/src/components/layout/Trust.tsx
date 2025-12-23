'use client';

import { useLanguage } from '@/components/layout/LanguageProvider';

export default function Trust() {
  const { dict } = useLanguage();

  return (
    <section className="py-24 bg-neutral-900/50">
      <div className="container-custom">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">{dict.trust.headline}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl mb-6">🔒</div>
            <h3 className="text-xl font-bold mb-4">{dict.trust.security.title}</h3>
            <p className="text-gray-400">{dict.trust.security.desc}</p>
          </div>
          <div>
            <div className="text-5xl mb-6">⚡</div>
            <h3 className="text-xl font-bold mb-4">{dict.trust.speed.title}</h3>
            <p className="text-gray-400">{dict.trust.speed.desc}</p>
          </div>
          <div>
            <div className="text-5xl mb-6">🤖</div>
            <h3 className="text-xl font-bold mb-4">{dict.trust.ai.title}</h3>
            <p className="text-gray-400">{dict.trust.ai.desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
