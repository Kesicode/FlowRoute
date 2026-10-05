"use client";

/**
 * components/journey/ai-copilot-panel.tsx
 *
 * Phase 6 — Live Gemini AI Copilot Chat Panel
 *
 * Replaces static AiSuggestionsPanel on the "ai" tab.
 * Streams responses from /api/ai/chat using SSE (text/event-stream).
 *
 * Features:
 *  • Multi-turn conversation with history
 *  • Trip-context-aware (from/to/budget passed as system context)
 *  • Streaming token-by-token display with cursor blink
 *  • Quick prompt chips for common travel questions
 *  • Copy-to-clipboard on any message
 *  • Graceful offline / no-key fallback message
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useTripData, useLanguage } from "@/hooks/useTripStore";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  streaming?: boolean;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  en: [
    "What should I pack for this trip?",
    "Best local food to try?",
    "Any safety tips for my route?",
    "How can I save money on this trip?",
    "What's the weather usually like?",
  ],
  hi: [
    "इस यात्रा के लिए क्या पैक करें?",
    "स्थानीय खाना कौन सा अच्छा है?",
    "सुरक्षा के लिए कोई सुझाव?",
  ],
  ml: [
    "ഈ യാത്രക്ക് എന്ത് പായ്ക്ക് ചെയ്യണം?",
    "പ്രാദേശിക ഭക്ഷണം ഏതാണ് നല്ലത്?",
    "സുരക്ഷാ നുറുങ്ങുകൾ?",
  ],
};

function buildTripContext(trip: ReturnType<typeof useTripData>): string {
  if (!trip) return "";
  const parts: string[] = [];
  if (trip.from) parts.push(`From: ${trip.from}`);
  if (trip.to) parts.push(`To: ${trip.to}`);
  if (trip.budget) parts.push(`Budget: ${trip.currency ?? "INR"} ${trip.budget}`);
  if (trip.travellers) parts.push(`Travellers: ${trip.travellers}`);
  if (trip.departureDate) parts.push(`Date: ${trip.departureDate}`);
  return parts.join(", ");
}

export function AiCopilotPanel() {
  const tripData = useTripData();
  const language = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyMessage = useCallback(async (id: string, text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: userText.trim(),
      };
      const modelMsgId = `m-${Date.now()}`;
      const modelMsg: ChatMessage = {
        id: modelMsgId,
        role: "model",
        text: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, modelMsg]);
      setInput("");
      setIsLoading(true);

      // Build history for API (all prior messages)
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const tripContext = buildTripContext(tripData);

      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, tripContext }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            accumulated += data;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === modelMsgId
                  ? { ...m, text: accumulated, streaming: true }
                  : m
              )
            );
          }
        }

        // Mark streaming done
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId ? { ...m, streaming: false } : m
          )
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId
              ? {
                  ...m,
                  text: "Sorry, I couldn't reach the AI service. Check your connection and try again.",
                  streaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, tripData, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickPrompts = QUICK_PROMPTS[language] ?? QUICK_PROMPTS.en;

  return (
    <div className="flex flex-col h-full min-h-[400px] max-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-brand-cyan/15 border border-brand-cyan/25 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-brand-cyan" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">FlowRoute Copilot</p>
          <p className="text-[10px] text-slate-500">Powered by Gemini · Trip-aware</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {/* Empty state with quick prompts */}
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-brand-cyan/15 border border-brand-cyan/25 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-brand-cyan" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-none px-3.5 py-2.5 max-w-[85%]">
                <p className="text-sm text-slate-200 leading-relaxed">
                  {tripData
                    ? `Hi! I know you're travelling from ${tripData.from} to ${tripData.to}. How can I help you plan better?`
                    : "Hi! I'm your FlowRoute Copilot. Ask me anything about your journey — packing tips, local food, safety, budget tricks, or culture!"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-8">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-2.5 py-1.5 rounded-xl bg-brand-cyan/8 border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/15 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-white/10 border border-white/15"
                    : "bg-brand-cyan/15 border border-brand-cyan/25"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-slate-300" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-brand-cyan" />
                )}
              </div>

              {/* Bubble */}
              <div className={`group relative max-w-[85%] ${msg.role === "user" ? "items-end" : ""}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-cyan/15 border border-brand-cyan/25 text-white rounded-tr-none"
                      : "bg-white/5 border border-white/8 text-slate-200 rounded-tl-none"
                  }`}
                >
                  {msg.text || (msg.streaming && (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-cyan" />
                      <span className="text-slate-500 text-xs">Thinking…</span>
                    </span>
                  ))}
                  {msg.streaming && msg.text && (
                    <span className="inline-block w-0.5 h-3.5 bg-brand-cyan animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
                {/* Copy button */}
                {!msg.streaming && msg.text && msg.role === "model" && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.text)}
                    className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    {copiedId === msg.id ? (
                      <><Check className="w-2.5 h-2.5 text-emerald-400" />Copied</>
                    ) : (
                      <><Copy className="w-2.5 h-2.5" />Copy</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Clear button */}
      {messages.length > 0 && (
        <div className="flex justify-end mt-1 mb-2">
          <button
            onClick={() => { setMessages([]); abortRef.current?.abort(); setIsLoading(false); }}
            className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Clear chat
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your trip…"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-cyan/40 transition-colors disabled:opacity-50 min-h-[40px] max-h-[100px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan hover:bg-brand-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
      <p className="text-[9px] text-slate-600 text-center mt-1.5">
        AI responses may contain errors — verify important travel info independently
      </p>
    </div>
  );
}
