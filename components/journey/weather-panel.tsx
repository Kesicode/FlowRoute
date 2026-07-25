"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Shirt, Wind, Droplets, Sun } from "lucide-react";
import { WeatherData } from "@/types/journey";

interface WeatherPanelProps {
  weather: WeatherData;
}

export function WeatherPanel({ weather }: WeatherPanelProps) {
  if (!weather || !weather.current) {
    return <div className="text-xs text-slate-500">Weather data unavailable.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Current weather card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 border border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-transparent"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs text-slate-400 mb-1">{weather.location}</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold text-white font-display">{weather.current.temp}°</span>
              <span className="text-slate-400 pb-2">Feels like {weather.current.feelsLike || weather.current.temp - 2}°C</span>
            </div>
            <p className="text-slate-300 mt-1">{weather.current.condition}</p>
          </div>
          <span className="text-6xl">{weather.current.icon}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Wind, label: "Wind", value: `${weather.current.windSpeed} km/h` },
            { icon: Droplets, label: "Humidity", value: `${weather.current.humidity}%` },
            { icon: Sun, label: "UV Index", value: `${weather.current.uvIndex || 3}/11` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-brand-blue mx-auto mb-1" />
              <div className="text-xs font-bold text-white">{value}</div>
              <div className="text-[10px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Rain Alert */}
      {weather.current.rainAlert && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Weather Notice</p>
            <p className="text-xs text-amber-200/70 mt-0.5">{weather.current.rainAlertMessage || "Precipitation chances higher later today. Plan accordingly."}</p>
          </div>
        </motion.div>
      )}

      {/* 5-day forecast */}
      {weather.forecast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4 border border-white/5"
        >
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">5-Day Forecast</h3>
          <div className="grid grid-cols-5 gap-2">
            {weather.forecast.map((day, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-slate-500 mb-1">{day.day}</p>
                <span className="text-xl block mb-1">{day.icon}</span>
                <p className="text-xs font-bold text-white">{day.high}°</p>
                <p className="text-[10px] text-slate-500">{day.low}°</p>
                {day.rainChance > 30 && (
                  <p className="text-[9px] text-brand-blue mt-0.5">{day.rainChance}%</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Clothing suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-start gap-3 p-4 rounded-2xl glass-card border border-white/5"
      >
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Shirt className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-300 mb-1">Clothing Suggestion</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {weather.clothingSuggestion || "Light comfortable layers recommended. Bring a compact umbrella for sudden breezes or light drizzle."}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
