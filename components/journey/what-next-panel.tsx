"use client";

/**
 * components/journey/what-next-panel.tsx
 * Contextual next-action suggestions based on current trip status.
 */

import { Calendar, Building2, Wallet, PackageOpen, Clock, Phone, Navigation, MapPin, CheckCircle } from "lucide-react";
import { useTripStatus, useTripIntent } from "@/hooks/useTripStore";

interface Suggestion {
  icon: React.ReactNode;
  text: string;
}

function SuggestionCard({ icon, text }: Suggestion) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
      <span className="text-primary flex-shrink-0">{icon}</span>
      <span className="text-sm text-foreground/80">{text}</span>
    </div>
  );
}

export function WhatNextPanel() {
  const status = useTripStatus();
  const intent = useTripIntent();

  const destination = intent?.to ?? "your destination";

  let title = "What happens next?";
  let suggestions: Suggestion[] = [];

  switch (status) {
    case "planning":
      suggestions = [
        { icon: <Calendar size={16} />, text: "Confirm your travel dates" },
        { icon: <Building2 size={16} />, text: "Choose your accommodation" },
        { icon: <Wallet size={16} />, text: "Review and adjust your budget" },
      ];
      break;

    case "booked":
      suggestions = [
        { icon: <PackageOpen size={16} />, text: "Start packing for your trip" },
        { icon: <Clock size={16} />, text: "Check transport times before you leave" },
        { icon: <Phone size={16} />, text: "Save emergency contacts for your destination" },
      ];
      break;

    case "active":
      title = "You are on your way! 🎉";
      suggestions = [
        { icon: <Navigation size={16} />, text: "Stay on the planned route" },
        { icon: <MapPin size={16} />, text: `Next stop: ${destination}` },
        { icon: <CheckCircle size={16} />, text: "Mark segments complete as you go" },
      ];
      break;

    case "completed":
      title = "Journey complete! 🎊";
      suggestions = [
        { icon: <CheckCircle size={16} />, text: `You made it to ${destination}!` },
        { icon: <Calendar size={16} />, text: "Plan your next adventure" },
        { icon: <Wallet size={16} />, text: "Review your trip spending" },
      ];
      break;

    default:
      suggestions = [
        { icon: <Calendar size={16} />, text: "Start planning your journey" },
        { icon: <MapPin size={16} />, text: "Set your destination" },
        { icon: <Wallet size={16} />, text: "Set a budget" },
      ];
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <SuggestionCard key={i} {...s} />
        ))}
      </div>
    </div>
  );
}
