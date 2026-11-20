'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SafarPK Root Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-[#101828]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
              Application Error
            </h1>
            <p className="text-sm text-slate-600">
              A temporary issue occurred. You can easily reload the view or return to the main dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:flex-1 h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload</span>
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
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
