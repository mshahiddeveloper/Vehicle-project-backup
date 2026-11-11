'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostAdRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/lister?tab=add_vehicle&step=1');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-700">Opening 3-Step Car Listing Wizard...</p>
      </div>
    </div>
  );
}

