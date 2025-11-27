'use client';

import Link from 'next/link';
import { Code2, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold tracking-tight">nonxdev</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="#services" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">Services</Link>
              <Link href="#about" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">About</Link>
              <Link href="#contact" className="bg-primary hover:bg-accent text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">Contact Us</Link>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass-nav border-t border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="#services" className="block px-3 py-2 rounded-md text-base font-medium hover:text-primary">Services</Link>
            <Link href="#about" className="block px-3 py-2 rounded-md text-base font-medium hover:text-primary">About</Link>
            <Link href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-primary">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
