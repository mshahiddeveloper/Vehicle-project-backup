'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Globe, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { authenticateUser } from '@/data/userAuth';

type SupportedLang = 'en' | 'ur' | 'ar' | 'de';

export default function LoginPage() {
  const router = useRouter();

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

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Please enter your phone number or email.');
      return;
    }

    setLoading(true);

    const res = authenticateUser(identifier.trim(), password);
    setLoading(false);

    if (!res.success || !res.user) {
      setError(res.error || 'Authentication failed. Please check credentials.');
      return;
    }

    // Role-based target portal routing
    const role = res.user.role;
    if (role === 'LISTER') {
      router.push('/lister');
    } else if (role === 'DRIVER') {
      router.push('/driver');
    } else if (role === 'PROVIDER') {
      if (res.user.providerSubtype === 'COMMERCIAL_CARGO') {
        router.push('/provider?mode=commercial_cargo');
      } else {
        router.push('/provider?mode=pick_and_drop');
      }
    } else {
      router.push('/customer');
    }
  };

  const quickSwitch = (demoId: string) => {
    const res = authenticateUser(demoId, 'password123');
    if (res.success && res.user) {
      if (res.user.role === 'LISTER') router.push('/lister');
      else if (res.user.role === 'DRIVER') router.push('/driver');
      else if (res.user.role === 'PROVIDER') {
        router.push(
          res.user.providerSubtype === 'COMMERCIAL_CARGO'
            ? '/provider?mode=commercial_cargo'
            : '/provider?mode=pick_and_drop'
        );
      } else router.push('/customer');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828] font-sans flex flex-col">
      {/* Brand Header */}
      <header className="bg-white border-b border-[#EEF0F2]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#101828]">
            <span className="w-8 h-8 rounded-lg bg-[#0B6B4F] text-white flex items-center justify-center font-heading font-extrabold text-base">
              S
            </span>
            <span className="font-heading font-extrabold text-xl tracking-tight">SafarPK</span>
          </Link>

          {/* Language Selector */}
          <label className="flex items-center gap-2 h-9 px-3 border border-[#E4E7EC] rounded-lg bg-white text-xs font-semibold cursor-pointer">
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
      </header>

      {/* Main Content Card */}
      <main className="flex-1 px-4 py-8 sm:py-14 flex flex-col items-center justify-start">
        <form
          onSubmit={handleSignIn}
          className="w-full max-w-[440px] bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-9 flex flex-col gap-5 shadow-[0_8px_28px_rgba(16,24,40,0.06)]"
        >
          <div className="flex justify-between items-baseline gap-3">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
              {T.signIn.en}
            </h1>
            {lang !== 'en' && (
              <span
                dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
                className="text-lg font-bold text-[#0B6B4F]"
              >
                {T.signIn[lang]}
              </span>
            )}
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
              placeholder="+92 300 1234567 or email@domain.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 border border-[#D0D5DD] rounded-xl px-3.5 text-sm font-medium outline-none focus:border-[#0B6B4F] focus:ring-2 focus:ring-[#0B6B4F]/20"
            />
          </label>

          {/* Password Field */}
          <label className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline text-xs font-bold text-[#344054]">
              <span>{T.password.en}</span>
              {lang !== 'en' && <span className="font-normal text-slate-500">{T.password[lang]}</span>}
            </div>
            <div className="flex h-12 border border-[#D0D5DD] rounded-xl overflow-hidden focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/20">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 min-w-0 border-0 px-3.5 text-sm font-medium outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="border-0 bg-[#F9FAFB] px-3.5 text-xs font-bold text-[#344054] hover:bg-slate-100 cursor-pointer flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
          </label>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-2">
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
            className="w-full h-12 sm:h-14 px-6 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
          >
            <span>{T.signIn.en}</span>
            {lang !== 'en' && <span className="font-normal opacity-90">· {T.signIn[lang]}</span>}
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Quick Demo Role Switcher */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              ⚡ Quick Testing Accounts
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => quickSwitch('salman@salmanrentals.pk')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left cursor-pointer transition truncate"
              >
                🚗 Salman Fleet (Lister)
              </button>
              <button
                type="button"
                onClick={() => quickSwitch('tariq.driver@safarpk.com')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-left cursor-pointer transition truncate"
              >
                👨‍✈️ Tariq (Chauffeur)
              </button>
              <button
                type="button"
                onClick={() => quickSwitch('subhan.shuttles@safarpk.com')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left cursor-pointer transition truncate"
              >
                🚌 Subhan (Shuttles)
              </button>
              <button
                type="button"
                onClick={() => quickSwitch('almakkah.cargo@safarpk.com')}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-left cursor-pointer transition truncate"
              >
                📦 Al-Makkah (Movers)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold pt-1">
              <Link
                href="/admin/console"
                className="p-1.5 rounded-lg border border-slate-900 bg-slate-900 text-white hover:bg-slate-800 text-center transition"
              >
                ⚡ Super Admin
              </Link>
              <Link
                href="/admin/agents"
                className="p-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-900 hover:bg-blue-100 text-center transition"
              >
                👮 Staff Agents
              </Link>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="pt-3 border-t border-[#F0F2F4] text-center text-xs text-[#475467] flex items-center justify-center gap-1.5">
            <span>{T.noAcc.en}</span>
            <Link href="/register" className="font-extrabold text-[#0B6B4F] hover:underline">
              {T.create.en}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

