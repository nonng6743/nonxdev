'use client';

import { useState } from 'react';

export default function Contact() {
  const [imageError, setImageError] = useState(false);

  return (
    <section id="contact" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">ร่วมงานกับเรา</h2>
            <p className="text-gray-400 mb-8 text-lg">
              พร้อมที่จะเปลี่ยนไอเดียของคุณให้เป็นจริงหรือยัง? ติดต่อทีมงานโปรแกรมเมอร์ของเราวันนี้เพื่อปรึกษาโปรเจกต์ของคุณ
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <span>nonxdev@gmail.com</span>
              </div>
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <span>0830292314</span>
              </div>
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="w-12 h-12 rounded-full bg-[#00C300]/10 flex items-center justify-center text-[#00C300]">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zM5.898 8.108c0-.345.283-.63.63-.63.346 0 .628.285.628.63v4.781c0 .344-.282.629-.63.629-.345 0-.627-.285-.627-.629V8.108zm-2.466.629H2.25c-.345 0-.63.285-.63.63 0 .344.285.628.63.628h.526v3.113c0 .345.282.63.63.63.345 0 .63-.285.63-.63V8.737zm16.703-1.006c0-.08-.028-.143-.082-.197-.055-.055-.117-.082-.199-.082H2.25c-.08 0-.142.027-.199.082-.054.054-.082.117-.082.197v7.777c0 .08.028.144.082.198.057.054.119.082.199.082h17.804c.08 0 .144-.028.199-.082.054-.054.082-.117.082-.198V7.731z"/>
                  </svg>
                </div>
                <span className="text-lg font-medium">LINE</span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">ติดต่อผ่าน LINE</h3>
              <p className="text-gray-400">สแกน QR Code เพื่อเพิ่มเพื่อน</p>
            </div>
            <div className="bg-white p-4 rounded-lg mb-4 shadow-lg">
              <div className="w-64 h-64 bg-white flex items-center justify-center relative overflow-hidden">
                {!imageError ? (
                  <img 
                    src="/IMG_F4EE19C829F2-1.jpeg" 
                    alt="LINE QR Code" 
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-[#00C300] rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-xs">LINE</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">ใส่รูป QR Code ที่นี่</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-sm text-center">หรือค้นหา LINE ID: <span className="text-primary font-medium">0823592799</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}
