"use client";

import { useSettings } from "@/lib/settings-context";
import { t } from "@/services/translations";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X, AlertTriangle, Hospital, ShieldAlert, Share2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchNearbyPlaces } from "@/services/overpass";
import { Essential } from "@/types/journey";

export default function EmergencyOverlay() {
  const { emergencyMode, setEmergencyMode, language } = useSettings();
  const [nearestHospitals, setNearestHospitals] = useState<Essential[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([9.9312, 76.2673]); // Default Kochi lat/lng
  const [locationShared, setLocationShared] = useState(false);

  useEffect(() => {
    if (emergencyMode) {
      setLoading(true);
      // Fetch user's actual location if possible
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setCurrentCoords(coords);
            loadNearbyEmergency(coords[0], coords[1]);
          },
          () => {
            // Fallback to default Kochi coordinate
            loadNearbyEmergency(9.9312, 76.2673);
          }
        );
      } else {
        loadNearbyEmergency(9.9312, 76.2673);
      }
    }
  }, [emergencyMode]);

  const loadNearbyEmergency = async (lat: number, lng: number) => {
    try {
      const data = await fetchNearbyPlaces(lat, lng, 3000);
      const hospitals = data.essentials.filter((e) => e.type === "hospital");
      setNearestHospitals(hospitals.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shareLiveLocation = () => {
    setLocationShared(true);
    setTimeout(() => setLocationShared(false), 3000);
  };

  if (!emergencyMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto"
      >
        {/* Pulsing red background glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] animate-pulse" />
        </div>

        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative max-w-lg w-full glass-panel-heavy rounded-3xl p-6 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={() => setEmergencyMode(false)}
            className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Alarm Icon */}
          <div className="inline-flex p-4 rounded-2xl bg-red-500/20 border border-red-500/30 mb-4 animate-bounce text-red-500">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-1 uppercase tracking-wider">
            {t("emergencyMode", language)}
          </h2>
          <p className="text-sm text-red-400 font-semibold mb-6 flex items-center justify-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-4 h-4" /> Immediate Safety & Helpline Hub
          </p>

          {/* Location details */}
          <div className="glass-card rounded-2xl p-4 border border-white/5 mb-6 text-left flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">My Current Coordinates</span>
              <p className="text-sm text-white font-medium truncate flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                {currentCoords[0].toFixed(5)}° N, {currentCoords[1].toFixed(5)}° E
              </p>
            </div>
            <button
              onClick={shareLiveLocation}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                locationShared
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/5 border-white/10 hover:border-red-500/30 text-white"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              {locationShared ? "Location Shared!" : "Share SOS"}
            </button>
          </div>

          {/* Helpline Dialers */}
          <div className="space-y-3 mb-6">
            <h3 className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
              {t("emergencyContacts", language)}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("police", language), number: "112", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400" },
                { label: t("ambulance", language), number: "108", color: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400" },
                { label: t("womensHelpline", language), number: "181", color: "from-fuchsia-500/20 to-fuchsia-600/20 border-fuchsia-500/30 text-fuchsia-400" },
                { label: t("fireForce", language), number: "101", color: "from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400" },
              ].map((item) => (
                <a
                  key={item.number}
                  href={`tel:${item.number}`}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border bg-gradient-to-br hover:scale-[1.03] transition-transform duration-200 ${item.color}`}
                >
                  <Phone className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-base font-extrabold mt-0.5">{item.number}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Nearest medical units */}
          <div>
            <h3 className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-3">
              {t("nearestServices", language)} (🏥 Hospitals)
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 rounded-full border border-red-500 border-t-transparent animate-spin" />
                Scanning nearest emergency hubs...
              </div>
            ) : nearestHospitals.length === 0 ? (
              <p className="text-xs text-slate-500">No medical centers found in immediate radius.</p>
            ) : (
              <div className="space-y-2.5">
                {nearestHospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="flex items-center gap-3 p-3 glass-card rounded-xl border border-white/5 text-left hover:border-red-500/20 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                      <Hospital className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{hosp.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{hosp.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-white">{hosp.distance}m</span>
                      <span className="block text-[8px] font-bold text-emerald-400">24/7 Emergency</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
