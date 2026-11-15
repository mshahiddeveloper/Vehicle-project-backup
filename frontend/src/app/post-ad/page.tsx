'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { getActiveUser, logoutActiveUser } from '@/data/userAuth';

export default function PostAdRedirectPage() {
  const router = useRouter();
  const [isCustomerBlocked, setIsCustomerBlocked] = useState(false);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const user = getActiveUser();
    if (user && (user.role === 'CUSTOMER' || String(user.role).toUpperCase() === 'CUSTOMER')) {
      setIsCustomerBlocked(true);
      setCustomerName(user.name);
      return;
    }
    if (!user) {
      // Guest clicking to list vehicle -> redirect to register as partner
      router.replace('/register');
      return;
    }

    const role = String(user.role).toUpperCase();
    if (role === 'DRIVER') {
      // Driver routes to driver profile & availability management
      router.replace('/driver?tab=availability');
      return;
    }
    if (role === 'PROVIDER') {
      // Service Provider routes to their specific route/cargo manager
      if (user.providerSubtype === 'COMMERCIAL_CARGO') {
        router.replace('/provider?mode=commercial_cargo&tab=pricing');
      } else {
        router.replace('/provider?mode=pick_and_drop&tab=routes');
      }
      return;
    }

    // Default for vehicle host/lister
    router.replace('/lister?tab=add_vehicle&step=1');
  }, [router]);

  if (isCustomerBlocked) {
    return (
      <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#EEF0F2] p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#101828]">Access Restricted</h2>
          <p className="text-sm text-[#475467] leading-relaxed">
            You are currently signed in with a <strong>Customer account</strong> ({customerName}). Customer accounts are designed for renting vehicles and cannot list vehicles or access host tools.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/customer"
              className="w-full py-3 rounded-xl bg-[#0B6B4F] text-white font-bold text-sm hover:bg-[#08513C] transition"
            >
              Back to Customer Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                logoutActiveUser();
                window.location.href = '/register';
              }}
              className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition cursor-pointer"
            >
              Sign Out & Register as Vehicle Lister
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-700">Opening Service Listing Desk...</p>
      </div>
    </div>
  );
}
