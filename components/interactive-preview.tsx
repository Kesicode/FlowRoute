"use client";

import { useState } from "react";
import {
  Navigation,
  CloudRain,
  Clock,
  MapPin,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Umbrella,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface RouteOption {
  id: string;
  name: string;
  type: string;
  time: number;
  walking: number;
  sheltered: boolean;
  cost: string;
  scores: {
    speed: number;
    comfort: number;
    weather: number;
    overall: number;
  };
  explanation: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: string[];
}

export default function InteractivePreview() {
  const [preference, setPreference] = useState<"balanced" | "speed" | "comfort">("balanced");
  const [selectedRoute, setSelectedRoute] = useState<string>("route-b");

  // Simulated live conditions
  const weatherCondition = {
    temp: "18°C",
    type: "Heavy Rain",
    wind: "28 km/h",
    humidity: "94%",
    icon: CloudRain
  };

  const routes: RouteOption[] = [
    {
      id: "route-a",
      name: "Highway Express Bus",
      type: "Fastest Path",
      time: 24,
      walking: 12,
      sheltered: false,
      cost: "$2.50",
      scores: {
        speed: 95,
        comfort: 40,
        weather: 15,
        overall: preference === "speed" ? 78 : preference === "comfort" ? 35 : 50
      },
      explanation: "This route is quick but requires a 12-minute walk with zero rain coverage. You will experience heavy rainfall and high exposure to wind at the bus shelter.",
      icon: AlertTriangle,
      steps: [
        "Walk 5 mins to Open Bus Stop",
        "Take Bus Line 402 (15 mins)",
        "Walk 7 mins to Destination"
      ]
    },
    {
      id: "route-b",
      name: "Subway Link & Sheltered Walk",
      type: "Optimal AI Recommendation",
      time: 31,
      walking: 3,
      sheltered: true,
      cost: "$2.75",
      scores: {
        speed: 75,
        comfort: 90,
        weather: 95,
        overall: preference === "speed" ? 80 : preference === "comfort" ? 92 : 88
      },
      explanation: "FlowRoute recommends this option. Although it takes 7 minutes longer, walking distance in open rain is reduced by 90%. Access tunnels and sheltered station linkways protect you from the storm.",
      icon: CheckCircle2,
      steps: [
        "Enter station basement (1 min walk)",
        "Take Metro Line Green (25 mins)",
        "Exit through glass tunnel (2 mins walk)"
      ]
    }
  ];

  const activeRoute = routes.find((r) => r.id === selectedRoute) || routes[1];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-brand-cyan uppercase bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">
                Live Simulator
              </span>
              <div className="flex items-center text-xs text-slate-400 gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to OSRM & Open-Meteo
              </div>
            </div>

            {/* Simulated Search Fields */}
            <div className="space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-cyan" />
                <input
                  type="text"
                  readOnly
                  value="Tech Hub Plaza"
                  className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none"
                />
              </div>
              <div className="relative">
                <Navigation className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-blue" />
                <input
                  type="text"
                  readOnly
                  value="Arts & Culture District"
                  className="w-full bg-black/40 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none"
                />
              </div>
            </div>

            {/* Current Weather Info */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/40 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <weatherCondition.icon className="w-5 h-5 text-brand-blue animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Storm Conditions</h4>
                  <p className="text-xs text-slate-400">Outdoor rain warning active</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-white block leading-none">
                  {weatherCondition.temp}
                </span>
                <span className="text-xs text-brand-blue font-medium">
                  {weatherCondition.type}
                </span>
              </div>
            </div>

            {/* Preferences sliders */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase">
                <Sliders className="w-3.5 h-3.5" /> Optimize Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["balanced", "speed", "comfort"] as const).map((pref) => (
                  <button
                    key={pref}
                    onClick={() => setPreference(pref)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl capitalize border transition-all duration-300 ${
                      preference === pref
                        ? "bg-brand-cyan text-background border-brand-cyan shadow-md"
                        : "bg-white/5 border-white/5 hover:border-white/10 text-slate-300 hover:text-white"
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Journey Options
            </h4>
            <div className="space-y-2">
              {routes.map((route) => {
                const isSelected = selectedRoute === route.id;
                const isAI = route.id === "route-b";
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(route.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                      isSelected
                        ? "bg-white/5 border-brand-cyan/50 shadow-md"
                        : "bg-black/20 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {route.name}
                        </span>
                        {isAI && (
                          <span className="text-[10px] bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-brand-cyan" /> AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> {route.time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Umbrella className="w-3 h-3 text-slate-500" /> {route.walking} min walk
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-base font-bold ${
                          route.scores.overall >= 80
                            ? "text-emerald-400"
                            : route.scores.overall >= 60
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}>
                          {route.scores.overall}
                        </span>
                        <span className="text-[9px] text-slate-500 block leading-none">Score</span>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ${isSelected ? "text-brand-cyan translate-x-1" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Dashboard & Scoring Engine */}
        <div className="lg:col-span-7 p-6 sm:p-8 bg-black/40 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Selected Route Detail
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {activeRoute.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-200">
                  {activeRoute.time} mins total
                </span>
              </div>
            </div>

            {/* Scoring breakdown cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">Time Score</span>
                <div className="text-xl font-bold text-white">
                  {activeRoute.scores.speed}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-brand-blue h-full transition-all duration-700"
                    style={{ width: `${activeRoute.scores.speed}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">Comfort</span>
                <div className="text-xl font-bold text-white">
                  {activeRoute.scores.comfort}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-brand-cyan h-full transition-all duration-700"
                    style={{ width: `${activeRoute.scores.comfort}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-xs text-slate-400 block mb-1">Rain Shield</span>
                <div className="text-xl font-bold text-white">
                  {activeRoute.scores.weather}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-700"
                    style={{ width: `${activeRoute.scores.weather}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* AI Explanation Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-cyan/5 via-brand-blue/5 to-slate-900/40 border border-brand-cyan/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Sparkles className="w-16 h-16 text-brand-cyan" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-cyan animate-pulse" />
                <h4 className="text-xs font-bold text-brand-cyan uppercase tracking-wider">
                  AI Journey Explanation
                </h4>
              </div>
              
              <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                {activeRoute.explanation}
              </p>
            </div>

            {/* Steps walkthrough */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Route Execution Path
              </h4>
              <div className="relative pl-6 space-y-4 border-l border-white/10 ml-2 py-1">
                {activeRoute.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[30px] top-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-black border border-brand-cyan text-[10px] text-brand-cyan font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-300 font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Overall Rating ring */}
          <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-14 h-14">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke={activeRoute.scores.overall >= 80 ? "#34d399" : activeRoute.scores.overall >= 60 ? "#fbbf24" : "#f87171"}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - activeRoute.scores.overall / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-white">
                  {activeRoute.scores.overall}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block leading-none">Scoring Index</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {activeRoute.scores.overall >= 80
                    ? "Highly Recommended"
                    : activeRoute.scores.overall >= 60
                    ? "Adequate Route"
                    : "Low Suitability"}
                </span>
              </div>
            </div>
            
            <span className="text-xs text-slate-500 font-medium">
              Simulation factors in walking coverage and rain indexes.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
