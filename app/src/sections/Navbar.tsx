import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import gsap from 'gsap';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobileOpen && mobileMenuRef.current && mobileLinksRef.current) {
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      );
      gsap.fromTo(
        mobileLinksRef.current.children,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, delay: 0.05, duration: 0.45, ease: 'power3.out' }
      );
    }
  }, [mobileOpen]);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Overview', id: 'about' },
    { label: 'Themes', id: 'highlights' },
    { label: 'Program', id: 'schedule' },
    { label: 'Venue', id: 'venue' },
    { label: 'Register', id: 'register' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-black/[0.08] shadow-[0_2px_20px_rgba(0,0,0,0.07)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px] sm:h-[76px] gap-3">
            {/* Logo */}
            <button
              onClick={() => scrollToSection('hero')}
              className="transition-all hover:opacity-80 shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <img src="/Wes.png" alt="WES" className="h-14 sm:h-16 lg:h-[70px] w-auto object-contain" />
                <div className="hidden text-left xl:block">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400">Women Entrepreneurs Summit</p>
                  <p className="text-[13px] font-semibold text-gray-700">Kozhikode · 20 June 2026</p>
                </div>
              </div>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-7">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="relative text-sm font-medium uppercase tracking-[0.11em] text-gray-500 hover:text-gray-900 transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute bottom-[-4px] left-0 h-[2px] w-0 bg-primary transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </div>

            {/* Desktop Register CTA — hidden (registration closed) */}

            {/* Mobile: Hamburger only (registration closed) */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <button
                className="rounded-full border border-black/10 bg-black/[0.04] p-2 text-gray-700"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white px-6 py-24"
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-5 right-5 rounded-full border border-black/8 bg-black/[0.04] p-2 text-gray-500 hover:text-gray-900"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
          <div ref={mobileLinksRef} className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full rounded-[22px] border border-black/8 bg-black/[0.03] px-5 py-4 font-['Outfit'] text-lg font-medium uppercase tracking-[0.1em] text-gray-600 transition-colors hover:bg-black/5 hover:text-gray-900"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
