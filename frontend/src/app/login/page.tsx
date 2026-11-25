'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Globe,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Car,
  Users,
  Bus,
  Package,
  Navigation,
  User,
  Zap,
} from 'lucide-react';
import { authenticateUser, getUserDashboardPath, setActiveUser, RegisteredUser } from '@/data/userAuth';
import { executePendingWishlistIfAny, syncWishlistFromServer } from '@/data/wishlist';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';

type SupportedLang = 'en' | 'ur' | 'ar' | 'de';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || searchParams.get('from');

  const [lang, setLang] = useState<SupportedLang>('en');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const T: Record<string, Record<SupportedLang, string>> = {
    signIn: { en: 'Sign in', ur: 'سائن اِن', ar: 'تسجيل الدخول', de: 'Anmelden' },
    idField: {
      en: 'Phone number or email',
      ur: 'فون نمبر یا ای میل',
      ar: 'رقم الهاتف أو البريد الإلكتروني',
      de: 'Telefonnummer oder E-Mail',
    },
    password: { en: 'Password', ur: 'پاس ورڈ', ar: 'كلمة المرور', de: 'Passwort' },
    forgot: { en: 'Forgot password?', ur: 'پاس ورڈ بھول گئے؟', ar: 'نسيت كلمة المرور؟', de: 'Passwort vergessen?' },
    noAcc: { en: 'Don’t have an account?', ur: 'اکاؤنٹ نہیں ہے؟', ar: 'ليس لديك حساب؟', de: 'Noch kein Konto?' },
    create: { en: 'Create account', ur: 'اکاؤنٹ بنائیں', ar: 'إنشاء حساب', de: 'Konto erstellen' },
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your phone number or email.');
      return;
    }

    setLoading(true);

    try {
      // 1. Attempt server-side login against Neon PostgreSQL 16
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password }),
      });

      const data = await apiRes.json().catch(() => null);

      if (data && data.success && data.user) {
        // Hydrate the user into Browser local storage for client-side components & state
        const loggedUser: RegisteredUser = data.user;
        setActiveUser(loggedUser);

        // Also ensure this user exists in safarpk_registered_users array in this browser
        try {
          const raw = localStorage.getItem('safarpk_registered_users');
          let users: RegisteredUser[] = raw ? JSON.parse(raw) : [];
          const idx = users.findIndex((u) => u.id === loggedUser.id || u.phone === loggedUser.phone);
          if (idx >= 0) {
            users[idx] = loggedUser;
          } else {
            users.push(loggedUser);
          }
          localStorage.setItem('safarpk_registered_users', JSON.stringify(users));
        } catch (e) {}

        // Dispatch auth state change & hydrate wishlist from Neon DB
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('safarpk_auth_state_changed', { detail: loggedUser }));
        }
        await syncWishlistFromServer().catch(() => {});

        setLoading(false);

        // Execute pending guest wishlist or navigate
        const pending = executePendingWishlistIfAny();
        let dest: string;
        if (pending.executed) {
          dest = pending.returnUrl || '/saved';
        } else if (returnUrl) {
          dest = returnUrl;
        } else {
          dest = getUserDashboardPath(loggedUser);
        }
        router.push(dest);
        return;
      }

      // If server returned specific password error or 404 for non-demo users, report error
      if (data && data.error && (apiRes.status === 401 || (apiRes.status === 404 && !cleanId.startsWith('usr-demo-')))) {
        // Check if demo user fallback applies before showing error
        const localRes = authenticateUser(cleanId, password);
        if (localRes.success && localRes.user) {
          setLoading(false);
          const pending = executePendingWishlistIfAny();
          let dest: string;
          if (pending.executed) {
            dest = pending.returnUrl || '/saved';
          } else if (returnUrl) {
            dest = returnUrl;
          } else {
            dest = getUserDashboardPath(localRes.user);
          }
          router.push(dest);
          return;
        }

        setError(data.error);
        setLoading(false);
        return;
      }
    } catch (apiErr) {
      console.warn('Neon DB login API call error, falling back to local auth:', apiErr);
    }

    // 2. Offline / Local fallback (e.g. for demo users or offline mode)
    const localRes = authenticateUser(cleanId, password);
    setLoading(false);

    if (!localRes.success || !localRes.user) {
      setError(localRes.error || 'Authentication failed. Please check credentials.');
      return;
    }

    const pending = executePendingWishlistIfAny();
    let dest: string;
    if (pending.executed) {
      dest = pending.returnUrl || '/saved';
    } else if (returnUrl) {
      dest = returnUrl;
    } else {
      dest = getUserDashboardPath(localRes.user);
    }

    router.push(dest);
  };

  const quickSwitch = (demoId: string) => {
    const res = authenticateUser(demoId, 'password123');
    if (res.success && res.user) {
      const pending = executePendingWishlistIfAny();
      let dest: string;
      if (pending.executed) {
        dest = pending.returnUrl || '/saved';
      } else if (returnUrl) {
        dest = returnUrl;
      } else {
        dest = getUserDashboardPath(res.user);
      }
      router.push(dest);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#101828] font-sans flex flex-col">
      {/* Top Bar */}
      <header className="w-full">
        <div className="max-w-[460px] mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#101828]">
            <span className="w-9 h-9 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center font-heading font-extrabold text-base shadow-xs">
              S
            </span>
            <span className="font-heading font-extrabold text-xl tracking-tight">SafarPK</span>
          </Link>

          {/* Pill Language Selector */}
          <label className="flex items-center gap-1.5 h-9 px-3.5 border border-[#E4E7EC] rounded-full bg-white text-xs font-semibold cursor-pointer shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-[#344054]" />
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as SupportedLang)}
              className="border-0 outline-none bg-transparent font-semibold text-[#101828] cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ur">English + اردو</option>
              <option value="ar">English + العربية</option>
              <option value="de">English + Deutsch</option>
            </select>
          </label>
        </div>
        <MobilePullToRefresh />
        <OfflineStatusBanner />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 px-4 pt-4 pb-10 flex flex-col items-center justify-start gap-5">
        {/* Welcome Heading */}
        <div className="w-full max-w-[440px] space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-[#101828]">
              Welcome back
            </h1>
            {lang !== 'en' && (
              <span
                dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
                className="text-base font-bold text-[#0B6B4F]"
              >
                {T.signIn[lang]}
              </span>
            )}
          </div>
          <p className="text-sm text-[#475467]">
            Sign in to book, chat and manage your trips.
          </p>
        </div>

        {/* Sign-In Card */}
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-[440px] bg-white border border-[#E6ECE8] rounded-[28px] p-5 sm:p-7 flex flex-col gap-4 shadow-[0_12px_32px_rgba(16,24,40,0.06)]"
        >
          {/* Segmented Tab Switcher: Sign in | Register */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F2F4F7] text-sm font-bold">
            <span className="py-2.5 rounded-xl bg-white text-[#101828] text-center shadow-2xs">
              Sign in
            </span>
            <Link
              href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : '/register'}
              className="py-2.5 rounded-xl text-[#475467] hover:text-[#101828] text-center transition"
            >
              Register
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identifier Field */}
          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline text-xs font-bold text-[#344054]">
              <span>{T.idField.en}</span>
              {lang !== 'en' && <span className="font-normal text-slate-500">{T.idField[lang]}</span>}
            </div>
            <input
              type="text"
              autoComplete="username"
              required
              placeholder="0300 1234567 or email@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 border border-[#E4E7EC] rounded-2xl px-4 text-sm font-medium outline-none focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/15 transition"
            />
          </label>

          {/* Password Field */}
          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline text-xs font-bold text-[#344054]">
              <span>{T.password.en}</span>
              {lang !== 'en' && <span className="font-normal text-slate-500">{T.password[lang]}</span>}
            </div>
            <div className="flex h-12 border border-[#E4E7EC] rounded-2xl overflow-hidden focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/15 transition">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-0 border-0 px-4 text-sm font-medium outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="border-l border-[#E4E7EC] bg-[#F9FAFB] px-4 text-xs font-bold text-[#344054] hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
          </label>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-1">
            <Link
              href="/report?issue=password_recovery"
              className="text-xs font-bold text-[#0B6B4F] hover:underline"
            >
              {T.forgot.en}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 sm:h-13 px-6 rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] disabled:opacity-70 text-white font-heading font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
          >
            <span>{loading ? 'Signing in...' : T.signIn.en}</span>
            {lang !== 'en' && !loading && <span className="font-normal opacity-90">· {T.signIn[lang]}</span>}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        {/* Separate Quick Testing Accounts Card (All 5 Portals + Super Admin + Staff Agents preserved) */}
        <section className="w-full max-w-[440px] rounded-[24px] border border-dashed border-[#D0D5DD] bg-white/80 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wider text-[#667085] uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Quick Testing Accounts · 5 Portals</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#101828]">
            <button
              type="button"
              onClick={() => quickSwitch('salman@salmanrentals.pk')}
              className="flex items-center gap-2 p-2.5 rounded-2xl border border-[#E4E7EC] bg-white hover:border-[#0B6B4F] hover:bg-[#F6FBF8] text-left cursor-pointer transition min-w-0"
            >
              <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                <Car className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Salman Fleet (Lister)</span>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('tariq.driver@safarpk.com')}
              className="flex items-center gap-2 p-2.5 rounded-2xl border border-[#E4E7EC] bg-white hover:border-[#0B6B4F] hover:bg-[#F6FBF8] text-left cursor-pointer transition min-w-0"
            >
              <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Tariq (Chauffeur)</span>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('subhan.shuttles@safarpk.com')}
              className="flex items-center gap-2 p-2.5 rounded-2xl border border-[#E4E7EC] bg-white hover:border-[#0B6B4F] hover:bg-[#F6FBF8] text-left cursor-pointer transition min-w-0"
            >
              <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                <Bus className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Subhan (Shuttles)</span>
            </button>

            <button
              type="button"
              onClick={() => quickSwitch('almakkah.cargo@safarpk.com')}
              className="flex items-center gap-2 p-2.5 rounded-2xl border border-[#E4E7EC] bg-white hover:border-[#0B6B4F] hover:bg-[#F6FBF8] text-left cursor-pointer transition min-w-0"
            >
              <span className="w-7 h-7 rounded-lg bg-[#E9F3EE] text-[#0B6B4F] flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5" />
              </span>
              <span className="truncate">Al-Makkah (Movers)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => quickSwitch('farhan.intercity@safarpk.com')}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl border border-[#CFE4D8] bg-[#E9F3EE] hover:bg-[#DCECE3] text-[#08513C] text-xs font-bold text-left cursor-pointer transition"
          >
            <span className="w-7 h-7 rounded-lg bg-white text-[#0B6B4F] flex items-center justify-center shrink-0 shadow-2xs">
              <Navigation className="w-3.5 h-3.5" />
            </span>
            <span>Farhan (City to City)</span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-0.5">
            <button
              type="button"
              onClick={() => quickSwitch('admin@safarpk.com')}
              className="h-11 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Super Admin</span>
            </button>

            <Link
              href="/admin/agents"
              className="h-11 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] hover:bg-blue-100 text-[#1E3A8A] flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Staff Agents</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}


