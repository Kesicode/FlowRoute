"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, QrCode, CheckCircle, ArrowRight, ShieldCheck, Ticket } from "lucide-react";

interface TicketBookingProps {
  hasRoute: boolean;
  price?: number;
  from?: string;
  to?: string;
  date?: string;
  travellers?: number;
}

export function TicketBooking({
  hasRoute,
  price = 280,
  from = "Kochi Airport",
  to = "Marine Drive",
  date = "2025-08-15",
  travellers = 1
}: TicketBookingProps) {
  const [step, setStep] = useState<"details" | "processing" | "success">("details");
  const [ticketId] = useState(() => `FR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  if (!hasRoute) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 p-4 text-center">
        <p>Plan a route first to view ticketing options.</p>
      </div>
    );
  }

  const handleCheckout = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      <AnimatePresence mode="wait">
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-cyan" /> Secure Smart Checkout
              </h3>
              <p className="text-xs text-slate-400 mt-1">Direct digital transit ticket. Valid for water metro, metro lines, and bus links.</p>
            </div>

            {/* Travel Summary */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white truncate">
                {from} <ArrowRight className="w-3.5 h-3.5 text-slate-500" /> {to}
              </div>
              <div className="text-[10px] text-slate-500">
                Date: {new Date(date).toLocaleDateString()} · {travellers} traveller{travellers !== 1 ? "s" : ""}
              </div>
            </div>
            
            {/* Bill summary */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Base Transit Fare</span>
                <span className="text-white font-medium">₹{Math.round(price * 0.9).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Convenience GST (5%)</span>
                <span className="text-white font-medium">₹{Math.round(price * 0.1).toLocaleString("en-IN")}</span>
              </div>
              <div className="h-px w-full bg-white/5 my-1" />
              <div className="flex justify-between items-center font-bold">
                <span className="text-white text-sm">Total Price</span>
                <span className="text-brand-cyan text-lg">₹{price.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 px-4 bg-brand-cyan text-slate-950 font-bold rounded-2xl hover:bg-brand-cyan/90 transition-all flex items-center justify-center gap-2 shadow-md text-xs"
            >
              <CreditCard className="w-4 h-4" />
              Checkout with Smart Wallet
            </button>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-48 gap-3"
          >
            <Loader />
            <p className="text-slate-400 text-xs font-semibold animate-pulse">Routing security gateways...</p>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-3"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl border border-emerald-500/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            
            <div className="text-center">
              <h3 className="text-base font-bold text-white mb-0.5">NFC Ticket Generated!</h3>
              <p className="text-[11px] text-slate-500">Tap phone against transit gates. Added to recent history.</p>
            </div>
            
            {/* NFC Pass graphic ticket card */}
            <div className="w-full p-4 border border-emerald-500/30 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-slate-950 to-slate-950 shadow-md relative overflow-hidden text-left space-y-3.5">
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    FlowRoute Pass
                  </span>
                  <p className="text-sm font-bold text-white mt-2 truncate max-w-[180px]">
                    {from.split(",")[0]} → {to.split(",")[0]}
                  </p>
                </div>
                <QrCode className="w-10 h-10 text-white shrink-0 p-1.5 bg-white/10 rounded-lg border border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-white/5">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider">Pass Code</span>
                  <span className="font-mono text-slate-300 font-bold">{ticketId}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider">Amount Paid</span>
                  <span className="text-emerald-400 font-bold">₹{price}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NFC Transit Security Enabled</span>
              </div>
            </div>
            
            <button
              onClick={() => setStep("details")}
              className="text-xs text-brand-cyan hover:underline font-bold"
            >
              Generate another pass
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple internal loader spinner
function Loader() {
  return (
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan animate-spin" />
    </div>
  );
}
