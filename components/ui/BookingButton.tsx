'use client';

/**
 * components/ui/BookingButton.tsx
 *
 * Phase 3 — Smart booking action button.
 *
 * Renders a single booking link as a styled pill button.
 * - Desktop: always opens in a new browser tab.
 * - Mobile deeplink mode: attempts native app handoff via location.href,
 *   falls back to web URL after 1500ms if app is not installed.
 * - Always shows the platform emoji + label for quick scanning.
 * - External link disclosed via aria-label for accessibility.
 */

import { ExternalLink } from 'lucide-react';
import type { BookingLink } from '@/services/booking-engine';

interface BookingButtonProps {
  link: BookingLink;
  size?: 'sm' | 'md';
  className?: string;
}

export function BookingButton({ link, size = 'sm', className = '' }: BookingButtonProps) {
  const handleClick = () => {
    if (link.openMode === 'deeplink') {
      // Attempt native app handoff
      window.location.href = link.url;
      // Fallback to web URL after 1.5s if app didn't open
      setTimeout(() => {
        const webFallback = link.url
          .replace('uber://', 'https://m.uber.com/looking')
          .replace('ola://', 'https://book.olacabs.com/');
        if (webFallback !== link.url) {
          window.open(webFallback, '_blank', 'noopener,noreferrer');
        }
      }, 1500);
    } else {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1.5 text-xs gap-1.5'
    : 'px-3.5 py-2 text-sm gap-2';

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center rounded-lg border border-white/10
        bg-white/5 hover:bg-white/10 hover:border-brand-cyan/30
        text-slate-300 hover:text-white font-medium transition-all duration-150
        active:scale-95 ${sizeClasses} ${className}`}
      aria-label={`${link.label} — opens in new tab`}
      title={link.label}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {link.emoji}
      </span>
      <span>{link.label}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" aria-hidden="true" />
    </button>
  );
}
