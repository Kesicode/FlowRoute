'use client';

/**
 * app/trips/page.tsx
 * Saved trips list — browse, open, delete, and save the current trip.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';

import {
  useSavedTrips,
  useTripsListActions,
  useTripData,
} from '@/hooks/useTripStore';
import TripCard from '@/components/trips/TripCard';
import type { SavedTripSummary } from '@/types/trip';

export default function TripsPage() {
  const router = useRouter();
  const savedTrips = useSavedTrips();
  const { saveCurrentTrip, deleteSavedTrip } = useTripsListActions();
  const currentTrip = useTripData();

  useEffect(() => {
    document.title = 'Saved Trips | FlowRoute';
  }, []);

  const handleSaveCurrent = () => {
    if (!currentTrip) return;
    const summary: SavedTripSummary = {
      id: currentTrip.id,
      from: currentTrip.intent.from,
      to: currentTrip.intent.to,
      departureDate: currentTrip.intent.departureDate,
      returnDate: currentTrip.intent.returnDate,
      status: currentTrip.status,
      createdAt: currentTrip.createdAt,
      travellers: currentTrip.intent.travellers,
      budget: currentTrip.intent.budget,
      currency: currentTrip.intent.currency,
    };
    saveCurrentTrip(summary);
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">Your Trips</h1>

          <div className="flex items-center gap-2 flex-wrap">
            {currentTrip && (
              <button
                onClick={handleSaveCurrent}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                Save Current Trip
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Trip
            </button>
          </div>
        </div>

        {/* Empty state */}
        {savedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-6xl" aria-hidden>✈️</span>
            <p className="text-slate-400 text-lg">No saved trips yet.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
            >
              Plan your first trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={() => router.push('/journey')}
                onDelete={() => deleteSavedTrip(trip.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
