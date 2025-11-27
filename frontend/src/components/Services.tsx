import { Globe, Smartphone, Bot, Cpu, ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'รับทำเว็บไซต์ (Web Development)',
    description: 'สร้างเว็บไซต์ที่ทันสมัย รองรับทุกอุปกรณ์ และรองรับ SEO ด้วย Next.js และ React',
    icon: Globe,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    title: 'รับทำแอปพลิเคชัน (Mobile Apps)',
    description: 'พัฒนาแอปพลิเคชัน iOS และ Android ด้วย React Native หรือ Flutter',
    icon: Smartphone,
    color: 'text-green-400',
    bg: 'bg-green-400/10',
  },
  {
    title: 'รับทำบอท (Custom Bots)',
    description: 'สร้างบอทอัจฉริยะสำหรับ Discord, Telegram และ Slack เพื่อช่วยจัดการชุมชนของคุณ',
    icon: Bot,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
  },
  {
    title: 'AI Automation',
    description: 'ใช้ประโยชน์จาก LLMs และ AI Agents เพื่อปรับปรุงกระบวนการทำงานของคุณให้เป็นอัตโนมัติ',
    icon: Cpu,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Our Services</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprehensive technical solutions tailored to your needs. From web to AI, we cover it all.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-lg ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <service.icon className={`h-6 w-6 ${service.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{service.description}</p>
              <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
