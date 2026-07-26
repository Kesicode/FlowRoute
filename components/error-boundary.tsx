"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` - ${this.props.label}` : ""}]:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              {this.props.label ? `${this.props.label} failed to load` : "Something went wrong"}
            </p>
            <p className="text-xs text-slate-500 mt-1">This section encountered an error. Other sections are unaffected.</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
