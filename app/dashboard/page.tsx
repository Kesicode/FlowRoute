"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  mockRecentJourneys,
  mockFavouriteDestinations,
  mockTravelStats,
  mockBudgetChartData,
  mockCarbonChartData,
} from "@/lib/mockData";
import {
  Bus,
  Train,
  ArrowRight,
  Sparkles,
  Leaf,
  TrendingUp,
  Route,
  Calendar,
  Map,
  Shield,
  Accessibility
} from "lucide-react";
import type { TransportMode, RecentJourney } from "@/types/journey";
import { useSettings } from "@/lib/settings-context";
import { t } from "@/services/translations";

const modeIcon: Record<TransportMode, React.ElementType> = {
  walk: Route,
  bus: Bus,
  metro: Train,
  train: Train,
  tram: Train,
  taxi: Route,
  bike: Route,
};

const modeColors: Record<TransportMode, string> = {
  walk: "text-emerald-400 bg-emerald-400/10",
  bus: "text-orange-400 bg-orange-400/10",
  metro: "text-brand-cyan bg-brand-cyan/10",
  train: "text-brand-blue bg-brand-blue/10",
  tram: "text-purple-400 bg-purple-400/10",
  taxi: "text-yellow-400 bg-yellow-400/10",
  bike: "text-lime-400 bg-lime-400/10",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
} as const;

export default function DashboardPage() {
  const { language } = useSettings();
  const [history, setHistory] = useState<RecentJourney[]>([]);
  const [stats, setStats] = useState(mockTravelStats);

  useEffect(() => {
    if (typeof window !== "undefined") {
      interface HistoryItem {
        from: string;
        to: string;
        date: string;
        mode: string;
        cost: number;
        duration: number;
      }

      const stored = localStorage.getItem("flowroute_history");
      const list: HistoryItem[] = stored ? JSON.parse(stored) : [];
      
      // Combine mock list with local cached list
      const combinedList: RecentJourney[] = [
        ...list.map((item: HistoryItem, i: number) => ({
          id: `local-rj-${i}`,
          from: item.from,
          to: item.to,
          date: item.date,
          mode: item.mode as TransportMode,
          cost: item.cost,
          duration: item.duration,
          co2: parseFloat(((item.cost * 0.0006)).toFixed(2)) // simulated CO2 saving ratio
        })),
        ...mockRecentJourneys
      ];
      
      setHistory(combinedList.slice(0, 7));

      // Adjust aggregate dashboard stats based on search counts
      const updatedStats = [...mockTravelStats];
      const newTrips = list.length;
      if (newTrips > 0) {
        updatedStats[0].value = (127 + newTrips).toString();
        
        let newDist = 0;
        let newCostSaved = 0;
        list.forEach((item: HistoryItem) => {
          newDist += 28; // typical demo distance kms
          newCostSaved += Math.round(item.cost * 0.4); // typical public transport saving ratio
        });

        updatedStats[1].value = (4820 + newDist).toLocaleString("en-IN");
        updatedStats[2].value = (38.4 + (newDist * 0.15)).toFixed(1);
        updatedStats[3].value = "₹" + (22898 + newCostSaved).toLocaleString("en-IN");
      }
      setStats(updatedStats);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">{t("dashboardTitle", language)}</h1>
            <p className="text-slate-400 text-sm mt-1">{t("dashboardSubtitle", language)}</p>
          </div>
          <Link
            href="/planner"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-background font-semibold text-sm hover:bg-brand-cyan/90 hover:shadow-[0_0_20px_rgba(0,242,254,0.35)] transition-all duration-300 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            {language === "en" ? "Plan New Journey" : language === "hi" ? "नई यात्रा जोड़ें" : "യാത്ര പ്ലാൻ ചെയ്യൂ"}
          </Link>
        </motion.div>

        {/* Dynamic Aggregated Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((stat) => {
            // Localize labels dynamically
            const labelKeys: Record<string, string> = {
              "Total Journeys": language === "en" ? "Trips Completed" : language === "hi" ? "पूरी की गई यात्राएं" : "യാത്രകൾ",
              "Distance Travelled": language === "en" ? "Distance Travelled" : language === "hi" ? "तय की गई दूरी" : "ദൂരം",
              "CO₂ Saved vs Car": language === "en" ? "CO₂ Saved" : language === "hi" ? "बचाया गया CO₂" : "സംരക്ഷിച്ച CO₂",
              "Money Saved": language === "en" ? "Money Saved" : language === "hi" ? "बचाया गया पैसा" : "ലാഭിച്ച പണം",
              "Avg Journey Time": language === "en" ? "Avg Travel Time" : language === "hi" ? "औसत समय" : "ശരാശരി സമയം",
              "Eco Routes Chosen": language === "en" ? "Eco Choices" : language === "hi" ? "हरित मार्ग" : "പരിസ്ഥിതി അനുയോജ്യം"
            };

            const localizedLabel = labelKeys[stat.label] || stat.label;
            
            return (
              <div key={stat.label} className="glass-card rounded-2xl p-4 border border-white/5 text-center flex flex-col justify-between">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div>
                  <div className="text-xl font-bold text-white font-display">{stat.value}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{stat.unit}</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">{localizedLabel}</div>
              </div>
            );
          })}
        </motion.div>

        {/* Safety & Accessibility Score Card */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-5 border border-fuchsia-500/10 bg-gradient-to-br from-fuchsia-500/5 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t("safetyScore", language)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Average safety rating of journeys</p>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-fuchsia-400 font-display">94%</div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Accessibility className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t("accessibilityScore", language)}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Step-free and assistive suitability</p>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-display">92%</div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Budget chart */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-display font-semibold text-white">Monthly Budget Comparison</h2>
              <span className="ml-auto text-xs text-slate-500">INR (₹)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={mockBudgetChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} unit="₹" />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  formatter={(val, name) => [`₹${Number(val ?? 0).toLocaleString("en-IN")}`, name === "spent" ? "Spent" : "Saved"]}                  
                />
                <Bar dataKey="spent" fill="#4FACFE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saved" fill="#00F2FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Carbon chart */}
          <div className="glass-card rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <h2 className="font-display font-semibold text-white">Monthly carbon (CO₂) Footprint</h2>
              <span className="ml-auto text-xs text-slate-500">kg</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={mockCarbonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "11px" }}
                  formatter={(val) => [`${Number(val ?? 0)} kg CO₂`, "Emissions"]}
                />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  dot={{ fill: "#34d399", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#34d399" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Journeys History */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-blue" />
              {t("recentTripsTitle", language)}
            </h2>
            <Link href="/planner" className="text-xs text-brand-cyan hover:underline">{t("findRoute", language)}</Link>
          </div>
          <div className="space-y-3">
            {history.map((journey, i) => {
              const Icon = modeIcon[journey.mode] || Route;
              const colorClass = modeColors[journey.mode] || modeColors.metro;
              return (
                <motion.div
                  key={journey.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card rounded-2xl p-4 border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all group"
                >
                  <div className={`p-2.5 rounded-xl ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-white truncate">
                      {journey.from} <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" /> {journey.to}
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(journey.date).toLocaleDateString(language === "en" ? "en-GB" : language === "hi" ? "hi-IN" : "ml-IN", {
                        day: "numeric",
                        month: "short"
                      })} · {journey.duration} min
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-white">₹{journey.cost.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-emerald-400">{journey.co2} kg CO₂</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Favourite Destinations */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white flex items-center gap-2">
              <Map className="w-4 h-4 text-brand-cyan" />
              {t("favouriteDestinations", language)}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {mockFavouriteDestinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/planner`}
                  className="glass-card rounded-2xl p-4 border border-white/5 hover:border-brand-cyan/30 flex flex-col items-center text-center gap-2 block transition-all duration-300"
                >
                  <span className="text-3xl">{dest.emoji}</span>
                  <div>
                    <div className="text-xs font-semibold text-white leading-tight">{dest.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{dest.country}</div>
                  </div>
                  <div className="text-[10px] text-brand-cyan font-semibold">{dest.totalVisits}x visited</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Carbon Savings Summary Banner */}
        <motion.div
          variants={itemVariants}
          className="glass-card rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-display font-bold text-white text-lg">
              {language === "en" ? "You've saved 38.4 kg of carbon emissions this year!" : language === "hi" ? "आपने इस साल 38.4 किलोग्राम कार्बन उत्सर्जन बचाया है!" : "ഈ വർഷം നിങ്ങൾ 38.4 കിലോഗ്രാം കാർബൺ പുറന്തള്ളൽ ലാഭിച്ചു!"}
            </h3>
            <p className="text-sm text-slate-400 mt-1">That&apos;s equivalent to planting 3 trees. Keep choosing eco-friendly routes to grow your impact.</p>
          </div>
          <div className="text-4xl shrink-0">🌳</div>
        </motion.div>

      </motion.div>
    </div>
  );
}
