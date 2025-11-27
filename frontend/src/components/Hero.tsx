import Link from 'next/link';
import { ArrowRight, Bot, Smartphone, Globe, Cpu } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          <span className="block">โปรแกรมเมอร์ มืออาชีพ</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            สร้างสรรค์นวัตกรรมเพื่อคุณ
          </span>
        </h1>
        
        <p className="mt-4 text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          รับเขียนโปรแกรม เว็บไซต์ แอปพลิเคชัน บอท และ AI Automation ครบวงจร โดยทีมงานโปรแกรมเมอร์ที่มีประสบการณ์
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <Link href="#contact" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-primary hover:bg-accent transition-all shadow-lg hover:shadow-primary/25">
            Start Your Project
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="#services" className="inline-flex items-center justify-center px-8 py-3 border border-white/10 text-base font-medium rounded-full text-foreground hover:bg-white/5 transition-all backdrop-blur-sm">
            Explore Services
          </Link>
        </div>

        {/* Floating Icons / Features Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-80">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Globe className="h-8 w-8 text-blue-400 mb-2" />
            <span className="font-semibold">Web Development</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Smartphone className="h-8 w-8 text-green-400 mb-2" />
            <span className="font-semibold">Mobile Apps</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Bot className="h-8 w-8 text-orange-400 mb-2" />
            <span className="font-semibold">Custom Bots</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Cpu className="h-8 w-8 text-purple-400 mb-2" />
            <span className="font-semibold">AI Automation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
