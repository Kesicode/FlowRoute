'use client';

/**
 * app/trips/[id]/page.tsx
 * Individual saved trip detail view.
 * params is a Promise in Next.js 16 — unwrap with React's use().
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, MapPin, Calendar, Users, Wallet, Activity } from 'lucide-react';

import { useSavedTrips, useTripsListActions } from '@/hooks/useTripStore';

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const savedTrips = useSavedTrips();
  const { deleteSavedTrip } = useTripsListActions();

  const trip = savedTrips.find((t) => t.id === id);

  if (!trip) {
    return (
      <main className="min-h-screen pt-24 pb-16 px-4 flex flex-col items-center justify-center gap-6 text-center">
        <p className="text-5xl" aria-hidden>🗺️</p>
        <h1 className="text-2xl font-bold text-foreground">Trip not found</h1>
        <p className="text-slate-400">This trip may have been deleted or doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/trips')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </button>
      </main>
    );
  }

  const handleDelete = () => {
    deleteSavedTrip(trip.id);
    router.push('/trips');
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push('/trips')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-brand-cyan text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trips
        </button>

        {/* Card */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
          {/* Route heading */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-cyan mt-0.5 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {trip.from} → {trip.to}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Saved {new Date(trip.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            {(trip.departureDate || trip.returnDate) && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>
                  {trip.departureDate ?? '—'}
                  {trip.returnDate ? ` → ${trip.returnDate}` : ''}
                </span>
              </div>
            )}

            {trip.travellers != null && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{trip.travellers} traveller{trip.travellers !== 1 ? 's' : ''}</span>
              </div>
            )}

            {trip.budget != null && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Wallet className="w-4 h-4 text-slate-500" />
                <span>{trip.currency ?? ''} {trip.budget.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Activity className="w-4 h-4 text-slate-500" />
              <span className="capitalize">{trip.status}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <button
              onClick={() => router.push('/journey')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
            >
              Resume Trip
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
