'use client';

import { useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { useLanguage } from '@/components/layout/LanguageProvider';

const colors = [
  "from-blue-500 to-cyan-400",
  "from-purple-500 to-pink-400",
  "from-amber-500 to-orange-400"
];

const images = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop", // Abstract Digital/Web
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=2574&auto=format&fit=crop", // Mobile/Tech
  "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop"  // AI/Brain
];

export default function Services() {
  const { dict } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative py-20 bg-neutral-950">
      <div className="container-custom">
        <motion.h2 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-7xl font-bold mb-32 text-center"
        >
          {dict.services.headline}
        </motion.h2>

        <div className="space-y-40">
          {dict.services.items.map((service, index) => (
            <ServiceCard 
              key={index} 
              service={service} 
              index={index} 
              color={colors[index]} 
              image={images[index]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, index, color, image }: { service: { title: string, description: string }, index: number, color: string, image: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      viewport={{ once: false, margin: "-100px" }}
      className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-10 md:gap-20`}
    >
      {/* Visual Side */}
      <div className="w-full md:w-1/2 relative aspect-video rounded-3xl overflow-hidden group border border-white/10">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-10 transition-opacity duration-500 z-10`} />
        
        {/* Image */}
        <img 
          src={image} 
          alt={service.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-80" 
        />

        {/* Number Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <span className="text-9xl font-black text-white/10 group-hover:text-white/20 transition-colors duration-500 blur-sm">{index + 1}</span>
        </div>
      </div>
      
      {/* Content Side */}
      <div className="w-full md:w-1/2">
        <h3 className="text-3xl md:text-5xl font-bold mb-4">{service.title}</h3>
        <p className="text-xl text-gray-400">{service.description}</p>
      </div>
    </motion.div>
  );
}
