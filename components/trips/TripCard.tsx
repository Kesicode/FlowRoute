'use client';
// components/trips/TripCard.tsx

import { useState } from 'react';
import { MapPin, X, ExternalLink } from 'lucide-react';
import type { SavedTripSummary, TripStatus } from '@/types/trip';

interface TripCardProps {
  trip: SavedTripSummary;
  onOpen: () => void;
  onDelete: () => void;
}

const STATUS_BADGE: Record<TripStatus, { label: string; classes: string }> = {
  planning:  { label: 'Planning',  classes: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  booked:    { label: 'Booked',    classes: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  active:    { label: 'Active',    classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export default function TripCard({ trip, onOpen, onDelete }: TripCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const badge = STATUS_BADGE[trip.status];

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors">
      {/* Route */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <MapPin className="w-4 h-4 text-brand-cyan shrink-0" />
        <span className="truncate">{trip.from}</span>
        <span className="text-slate-500 shrink-0">→</span>
        <span className="truncate">{trip.to}</span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        {trip.departureDate && (
          <span>{trip.departureDate}{trip.returnDate ? ` – ${trip.returnDate}` : ''}</span>
        )}
        {trip.travellers != null && (
          <span>· {trip.travellers} traveller{trip.travellers !== 1 ? 's' : ''}</span>
        )}
        {trip.budget != null && (
          <span>· {trip.currency ?? ''} {trip.budget.toLocaleString()}</span>
        )}
      </div>

      {/* Status badge */}
      <div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}>
          {badge.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </button>

        {confirmDelete ? (
          <button
            onClick={handleDeleteClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            Confirm?
          </button>
        ) : (
          <button
            onClick={handleDeleteClick}
            aria-label="Delete trip"
            className="p-1.5 rounded-xl text-slate-400 border border-white/10 hover:bg-red-600/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
