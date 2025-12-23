export const dictionaries = {
  en: {
    hero: {
      title_line1: "NONXDEV",
      title_line2: "STUDIO",
      subtitle_prefix: "Premium",
      subtitle_highlight1: "Software Development",
      subtitle_middle: "and",
      subtitle_highlight2: "Digital Experiences",
      subtitle_suffix: ". We build high-performance systems.",
      cta: "Start Project"
    },
    services: {
      headline: "Our Services",
      items: [
        {
          title: "Custom Software Development",
          description: "Tailored web applications, dashboards, and internal tools built to specific business requirements."
        },
        {
          title: "Mobile & Web Apps",
          description: "Cross-platform solutions that work flawlessly on every device using modern frameworks."
        },
        {
          title: "Enterprise AI Integration",
          description: "Automate workflows and enhance decision making with custom AI agents and LLM integrations."
        }
      ]
    },
    portfolio: {
      headline: "Selected Work",
      view_project: "View Project",
      items: [
        {
          title: "Map3D Visualization",
          category: "WebGL / Geospatial",
          description: "High-performance interactive 3D mapping platform for enterprise data visualization.",
          link: "https://map3d.nonxdev.com/"
        }
      ]
    },
    trust: {
      headline: "Why Choose nonxdev?",
      security: {
        title: "Reliable Engineering",
        desc: "Clean code, scalable architecture, and bank-grade security practices."
      },
      speed: {
        title: "High Performance",
        desc: "Optimized for speed and SEO. We ensure your digital presence is fast and visible."
      },
      ai: {
        title: "Future-Proof Tech",
        desc: "We use the latest technologies (Next.js, AI) to ensure your system lasts for years."
      }
    },
    cta: {
      headline: "Need a Dev Team?",
      subtext: "Let's discuss your requirements and build something great.",
      button: "Contact Us"
    },
    footer: "© 2024 nonxdev. Premium Software Studio."
  },
  th: {
    hero: {
      title_line1: "NONXDEV",
      title_line2: "STUDIO",
      subtitle_prefix: "รับจ้างเขียน",
      subtitle_highlight1: "โปรแกรม",
      subtitle_middle: "และ",
      subtitle_highlight2: "เว็บไซต์ครบวงจร",
      subtitle_suffix: " โดยทีมงานมืออาชีพ",
      cta: "เริ่มงานกับเรา"
    },
    services: {
      headline: "บริการของเรา",
      items: [
        {
          title: "รับทำเว็บไซต์และระบบ",
          description: "พัฒนาเว็บแอปพลิเคชัน แดชบอร์ด และระบบหลังบ้าน ตามความต้องการของธุรกิจ (Custom Solutions)"
        },
        {
          title: "โมบายแอปพลิเคชัน",
          description: "รับทำแอปมือถือ (iOS/Android) ที่ใช้งานลื่นไหล รองรับทุกอุปกรณ์"
        },
        {
          title: "ระบบ AI และ Automation",
          description: "พัฒนาระบบ AI ช่วยตอบแชท หรือทำงานเอกสารอัตโนมัติ ลดต้นทุน เพิ่มประสิทธิภาพองค์กร"
        }
      ]
    },
    portfolio: {
      headline: "ผลงานของเรา",
      view_project: "ดูผลงาน",
      items: [
        {
          title: "Map3D Visualization",
          category: "WebGL / Geospatial",
          description: "แพลตฟอร์มแผนที่ 3 มิติเชิงโต้ตอบสำหรับแสดงข้อมูลระดับองค์กร ประสิทธิภาพสูง",
          link: "https://map3d.nonxdev.com/"
        }
      ]
    },
    trust: {
      headline: "ทำไมต้องจ้างเรา?",
      security: {
        title: "งานคุณภาพ เชื่อถือได้",
        desc: "เขียนโค้ดสะอาด รองรับการขยายตัว (Scalable) และมีความปลอดภัยสูง"
      },
      speed: {
        title: "ประสิทธิภาพสูง",
        desc: "เว็บไซต์โหลดไว ใช้งานง่าย (UX/UI) ถูกหลัก SEO ทำให้ค้นหาเจอง่าย"
      },
      ai: {
        title: "เทคโนโลยีทันสมัย",
        desc: "ใช้ Tech Stack ล่าสุด (Next.js, AI) มั่นใจได้ว่าระบบจะไม่ตกยุคและใช้งานได้ยาวนาน"
      }
    },
    cta: {
      headline: "กำลังมองหาโปรแกรมเมอร์?",
      subtext: "ปรึกษาความต้องการของคุณกับเราวันนี้ ฟรี!",
      button: "ติดต่อเรา"
    },
    footer: "© 2024 nonxdev. รับเขียนโปรแกรมและเว็บไซต์."
  }
};

export type Dictionary = typeof dictionaries.en;
export type Language = 'en' | 'th';
