import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Services />
      <Contact />
      
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-white/10">
        <p>&copy; {new Date().getFullYear()} nonxdev. All rights reserved.</p>
      </footer>
    </main>
  );
}
