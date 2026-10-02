"use client";

/**
 * components/journey/multi-day-itinerary-panel.tsx
 * Accordion view of a multi-day trip itinerary.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, Train, Camera, Utensils, Coffee, Shield, MapPin } from "lucide-react";

interface ItinerarySegment {
  time: string;
  activity: string;
  description: string;
  type: "travel" | "attraction" | "food" | "rest" | "safety" | string;
  location: string;
}

interface ItineraryDay {
  dayNumber: number;
  date?: string;
  segments: ItinerarySegment[];
  accommodation?: { name: string; type: string };
  notes?: string;
}

interface MultiDayItineraryPanelProps {
  days: ItineraryDay[];
}

function SegmentIcon({ type }: { type: string }) {
  const cls = "w-4 h-4 flex-shrink-0 text-primary";
  switch (type) {
    case "travel":     return <Train className={cls} />;
    case "attraction": return <Camera className={cls} />;
    case "food":       return <Utensils className={cls} />;
    case "rest":       return <Coffee className={cls} />;
    case "safety":     return <Shield className={cls} />;
    default:           return <MapPin className={cls} />;
  }
}

export function MultiDayItineraryPanel({ days }: MultiDayItineraryPanelProps) {
  const [openDay, setOpenDay] = useState<number>(1);

  if (!days || days.length === 0) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-foreground/50 text-center">
        No itinerary available yet. Plan your trip to see day-by-day details.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {days.map((day) => (
        <div key={day.dayNumber} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          {/* Day header */}
          <button
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
            onClick={() => setOpenDay(openDay === day.dayNumber ? -1 : day.dayNumber)}
            aria-expanded={openDay === day.dayNumber}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Day {day.dayNumber}
              </span>
              {day.date && (
                <span className="text-xs text-foreground/50">{day.date}</span>
              )}
              <span className="text-sm text-foreground/70">
                {day.segments.length} stop{day.segments.length !== 1 ? "s" : ""}
              </span>
            </div>
            {openDay === day.dayNumber
              ? <ChevronUp size={16} className="text-foreground/50" />
              : <ChevronDown size={16} className="text-foreground/50" />
            }
          </button>

          {/* Day content */}
          {openDay === day.dayNumber && (
            <div className="px-4 pb-4">
              {/* Timeline */}
              <div className="flex flex-col gap-0">
                {day.segments.map((seg, idx) => (
                  <div key={idx} className="flex gap-3 relative">
                    {/* Timeline line */}
                    {idx < day.segments.length - 1 && (
                      <div className="absolute left-[11px] top-7 bottom-0 w-px bg-white/10" />
                    )}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <SegmentIcon type={seg.type} />
                      </div>
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-primary font-mono">{seg.time}</span>
                        <span className="text-sm font-medium text-foreground">{seg.activity}</span>
                      </div>
                      <p className="text-xs text-foreground/60 mt-0.5">{seg.description}</p>
                      <span className="text-xs text-foreground/40 mt-1 inline-block">📍 {seg.location}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Accommodation note */}
              {day.accommodation && (
                <div className="mt-2 rounded-lg bg-white/5 border border-white/5 px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-foreground/50">🏨 Stay:</span>
                  <span className="text-xs text-foreground">{day.accommodation.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
