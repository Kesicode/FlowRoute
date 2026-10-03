"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Route, Menu, X, Sun, Moon, LayoutDashboard, Map, Home, Globe, ShieldAlert, Wifi, WifiOff, Compass, Folder, User } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/lib/settings-context";
import { t, Language } from "@/services/translations";
import { useUserProfile } from "@/hooks/useTripStore";


export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  
  const pathname = usePathname();
  const { language, setLanguage, setEmergencyMode } = useSettings();
  const userProfile = useUserProfile();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const stored = localStorage.getItem("theme");
      if (stored === "light") {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
      } else {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const navLinks = [
    { name: language === "en" ? "Home" : language === "hi" ? "होम" : "ഹോം", href: "/", icon: Home },
    { name: language === "en" ? "Planner" : language === "hi" ? "योजनाकार" : "പ്ലാനർ", href: "/planner", icon: Map },
    { name: language === "en" ? "Explore" : language === "hi" ? "अन्वेषण" : "പര്യവേക്ഷണം", href: "/explore", icon: Compass },
    { name: language === "en" ? "Dashboard" : language === "hi" ? "डैशबोर्ड" : "ഡാഷ്‌ബോർഡ്", href: "/dashboard", icon: LayoutDashboard },
    { name: language === "en" ? "Trips" : language === "hi" ? "यात्राएं" : "യാത്രകൾ", href: "/trips", icon: Folder },
    { name: language === "en" ? "Profile" : language === "hi" ? "प्रोफ़ाइल" : "പ്രൊഫൈൽ", href: "/profile", icon: User, emoji: userProfile.avatarEmoji },
  ];



  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-5"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-cyan/20 to-brand-blue/20 border border-brand-cyan/30 group-hover:border-brand-cyan/60 transition-all duration-300">
              <Route className="w-5 h-5 text-brand-cyan group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Flow<span className="text-brand-cyan">Route</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative text-sm font-medium transition-colors hover:text-brand-cyan py-1 flex items-center gap-1.5"
                >
                  {'emoji' in link && link.emoji ? (
                    <span className="text-sm leading-none">{link.emoji}</span>
                  ) : (
                    <link.icon className="w-3.5 h-3.5" />
                  )}
                  <span className={isActive ? "text-brand-cyan" : "text-slate-400"}>
                    {link.name}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavBorder"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>


          {/* Right Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Online/Offline Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
              isOnline 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{t("online", language)}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  <span>{t("offline", language)}</span>
                </>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="relative group/lang">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-brand-cyan/30 text-slate-400 hover:text-brand-cyan transition-all duration-300">
                <Globe className="w-4 h-4" />
                <span className="text-xs uppercase font-semibold">{language}</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-32 rounded-xl bg-slate-950/95 border border-white/10 p-1 shadow-2xl opacity-0 scale-95 pointer-events-none group-hover/lang:opacity-100 group-hover/lang:scale-100 group-hover/lang:pointer-events-auto transition-all duration-200 z-50">
                {[
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिन्दी" },
                  { code: "ml", label: "മലയാളം" },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLanguage(item.code as Language)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors ${
                      language === item.code ? "text-brand-cyan font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Button */}
            <button
              onClick={() => setEmergencyMode(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 border border-red-500/20 hover:border-red-500/40 shadow-md hover:shadow-md transition-all duration-300 flex items-center gap-1.5 shrink-0"
            >
              <ShieldAlert className={`w-4 h-4 text-white ${!isOnline ? 'animate-pulse' : ''}`} />
              <span>{t("emergencyBtn", language)}</span>
            </button>

            {/* Dark/Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-brand-cyan/30 text-slate-400 hover:text-brand-cyan transition-all duration-300"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setEmergencyMode(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-red-600 border border-red-500/20 shadow-md animate-pulse"
            >
              SOS
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/5 bg-background/95 backdrop-blur-lg"
          >
            <div className="px-4 pt-2 pb-6 space-y-2 overflow-y-auto">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? "text-brand-cyan bg-brand-cyan/10"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {'emoji' in link && link.emoji ? (
                      <span className="text-base leading-none">{link.emoji}</span>
                    ) : (
                      <link.icon className="w-4 h-4" />
                    )}
                    {link.name}
                  </Link>
                );
              })}

              
              {/* Language selection in mobile menu */}
              <div className="pt-2 border-t border-white/5 flex gap-2">
                {[
                  { code: "en", label: "EN" },
                  { code: "hi", label: "हिन्दी" },
                  { code: "ml", label: "മലയാളം" },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code as Language);
                      setIsOpen(false);
                    }}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold border ${
                      language === item.code 
                        ? "bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan" 
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

