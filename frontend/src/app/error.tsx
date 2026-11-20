'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for diagnostic traceability
    console.error('SafarPK Client Exception caught by Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-[#101828]">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600">
            A temporary client exception occurred during navigation. Don&apos;t worry, your data and selections are safe.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg break-words max-h-24 overflow-y-auto text-left">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="w-full sm:flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}

