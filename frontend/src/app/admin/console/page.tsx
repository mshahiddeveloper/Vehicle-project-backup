'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminConsoleRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=featured');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      <span className="text-sm font-bold text-slate-300">
        Redirecting to SafarPK Super Admin Control Center...
      </span>
    </div>
  );
}
