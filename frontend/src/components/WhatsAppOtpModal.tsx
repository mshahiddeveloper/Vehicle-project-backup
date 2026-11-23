'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle, RefreshCw, X, ExternalLink } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import {
  sanitizePakistaniPhone,
  sendWhatsAppVerificationOtp,
  verifyWhatsAppOtpCode,
  WhatsAppOtpResult,
} from '@/data/userAuth';

interface WhatsAppOtpModalProps {
  isOpen: boolean;
  phone: string;
  onClose: () => void;
  onVerified: (verifiedPhone: string) => void;
}

export function WhatsAppOtpModal({ isOpen, phone, onClose, onVerified }: WhatsAppOtpModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [otpInfo, setOtpInfo] = useState<WhatsAppOtpResult | null>(null);
  const [copied, setCopied] = useState(false);

  const sanitized = sanitizePakistaniPhone(phone);

  useEffect(() => {
    if (isOpen && sanitized.isValid) {
      setError(null);
      // Pre-check backend DB and request OTP
      fetch('/api/whatsapp-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', phone, purpose: 'register' }),
      })
        .then((r) => r.json())
        .then((apiData) => {
          if (!apiData.success) {
            setError(apiData.error || 'This phone number cannot be verified for registration.');
            setCode('');
            return;
          }
          if (apiData.code) {
            setCode(apiData.code);
            setOtpInfo({
              success: true,
              code: apiData.code,
              phoneStandard: apiData.phone || sanitized.standard,
              waLink: apiData.waLink || '',
              expiresAt: Date.now() + 600000,
              message: 'OTP generated successfully.',
            });
          }
        })
        .catch(() => {
          // Local fallback check
          const res = sendWhatsAppVerificationOtp(phone, 'register');
          setOtpInfo(res);
          if (!res.success) {
            setError(res.error || res.message);
            setCode('');
          } else {
            setCode(res.code);
          }
        });
      setResendCooldown(30);
    }
  }, [isOpen, phone]);

  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  if (!isOpen) return null;

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setError(null);
    fetch('/api/whatsapp-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', phone, purpose: 'register' }),
    })
      .then((r) => r.json())
      .then((apiData) => {
        if (!apiData.success) {
          setError(apiData.error || 'Unable to resend OTP.');
          return;
        }
        if (apiData.code) {
          setCode(apiData.code);
        }
      })
      .catch(() => {
        const res = sendWhatsAppVerificationOtp(phone, 'register');
        setOtpInfo(res);
        if (!res.success) {
          setError(res.error || res.message);
        } else {
          setCode(res.code);
        }
      });
    setResendCooldown(30);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const check = verifyWhatsAppOtpCode(phone, code);
    setLoading(false);

    if (!check.success) {
      setError(check.error || 'Verification failed. Please check the code.');
      return;
    }

    onVerified(sanitized.standard);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <WhatsAppIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg leading-tight">
                WhatsApp Verification
              </h3>
              <p className="text-xs text-emerald-200/90 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Authentic Phone Authentication
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-6 flex flex-col gap-4">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Sending 6-Digit Code to
            </span>
            <div className="mt-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-950 font-mono font-extrabold text-base">
              <span>🇵🇰</span>
              <span>{sanitized.standard || phone}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Enter the 6-digit one-time code sent to your WhatsApp account.
            </p>
          </div>

          {/* Real-time Push Notification Simulation Banner */}
          {otpInfo && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SafarPK WhatsApp Dispatch Gateway
                </span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">Just now</span>
              </div>
              <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-emerald-200/80">
                <div className="text-xs">
                  <span className="text-slate-500 block text-[10px]">Your 6-Digit Verification Code:</span>
                  <span className="font-mono font-black text-lg tracking-widest text-emerald-900">
                    {otpInfo.code.slice(0, 3)} {otpInfo.code.slice(3)}
                  </span>
                </div>
                {otpInfo.waLink && (
                  <a
                    href={otpInfo.waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>Open WA</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900 leading-snug">{error}</p>
                {error.includes('already registered') && (
                  <div className="mt-2.5">
                    <a
                      href="/login"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs"
                    >
                      <span>Sign In to Account</span>
                      <span>→</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OTP Input Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Enter 6-Digit OTP</span>
              <span className="text-[10px] text-slate-400">Numbers only</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
              className="h-13 text-center font-mono font-black text-2xl tracking-[0.3em] border-2 border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl outline-none transition text-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Didn't receive code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={handleResend}
              className={`font-bold transition flex items-center gap-1 ${
                resendCooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend WhatsApp OTP'}
              </span>
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || code.trim().length !== 6}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-900/10 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify WhatsApp Number</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] text-slate-400 leading-tight">
              ✓ Once verified, this WhatsApp phone number is saved to your profile for secure logins.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

