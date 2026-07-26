import { useState, useEffect, useCallback, useRef } from "react";
import { Language } from "@/services/translations";

interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

export interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  startListening: (langCode?: Language) => void;
  stopListening: () => void;
  speak: (text: string, langCode?: Language) => void;
  stopSpeaking: () => void;
  isSupported: boolean;
}

export function useVoice(): UseVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
      const win = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

      
      if (SpeechRecognitionAPI) {
        setIsSupported(true);
        const rec = new SpeechRecognitionAPI();
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const startListening = useCallback((langCode: Language = "en") => {
    if (!recognitionRef.current) return;
    
    // Map languages to standard locales
    const locales: Record<Language, string> = {
      en: "en-US",
      hi: "hi-IN",
      ml: "ml-IN"
    };

    try {
      recognitionRef.current.lang = locales[langCode] || "en-US";
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
      };

      recognitionRef.current.start();
    } catch (e) {
      console.error("Speech Recognition start error:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error("Speech Recognition stop error:", e);
    }
  }, []);

  // Text-To-Speech
  const speak = useCallback((text: string, langCode: Language = "en") => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    try {
      // Cancel ongoing synthesis
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      const locales: Record<Language, string> = {
        en: "en-US",
        hi: "hi-IN",
        ml: "ml-IN"
      };

      utterance.lang = locales[langCode] || "en-US";
      
      // Try to find matching voice on system
      const voices = window.speechSynthesis.getVoices();
      const targetLang = locales[langCode];
      const voice = voices.find(v => v.lang.startsWith(targetLang) || v.lang === targetLang);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS Speech Synthesis error:", e);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error("TTS Cancel error:", e);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported
  };
}
