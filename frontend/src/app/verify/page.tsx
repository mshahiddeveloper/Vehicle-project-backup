'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { MobileNavBar } from '@/components/MobileNavBar';
import { getActiveUser, setActiveUser } from '@/data/userAuth';
import { ShieldCheck, Check, Upload, Lock, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

export default function VerifyPage() {
  const [activeUser, setActiveUserState] = useState(getActiveUser());
  const [isBusiness, setIsBusiness] = useState(true);

  // Business Licence state
  const [blUploaded, setBlUploaded] = useState(false);
  const [blFile, setBlFile] = useState('');
  const [ntnNumber, setNtnNumber] = useState('7829104-1');
  const [businessName, setBusinessName] = useState('Kashif Motors (SMC-Pvt) Ltd');

  // CNIC state
  const [cnicUploaded, setCnicUploaded] = useState(false);
  const [cnicFile, setCnicFile] = useState('');
  const [cnicNumber, setCnicNumber] = useState('35202-8472910-3');
  const [personName, setPersonName] = useState('Muhammad Kashif');

  // Driving Licence (if driver)
  const [dlUploaded, setDlUploaded] = useState(false);
  const [dlNumber, setDlNumber] = useState('LHR-DL-492019-B');

  // Map Location
  const [address, setAddress] = useState('Gulberg III, Main Boulevard, Lahore');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSimulateBizUpload = () => {
    setBlUploaded(true);
    setBlFile('Business_Registration_Certificate.pdf');
    setErrorMessage('');
  };

  const handleSimulateCnicUpload = () => {
    setCnicUploaded(true);
    setCnicFile('CNIC_Scanned_Front_Back.jpg');
    setErrorMessage('');
  };

  const handleSubmitVerification = () => {
    if (isBusiness && !blUploaded) {
      setErrorMessage('Please upload your business registration licence');
      return;
    }
    if (!cnicUploaded) {
      setErrorMessage('Please upload your National ID (CNIC) front and back');
      return;
    }

    setErrorMessage('');
    setIsSubmitted(true);

    const u = getActiveUser();
    if (u) {
      u.nationalId = cnicNumber;
      if (isBusiness) u.businessName = businessName;
      setActiveUser(u);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] font-sans text-[#101828] flex flex-col">
      <AppHeader />

      <main className="flex-1 max-w-[1080px] w-full mx-auto px-4 sm:px-8 py-8 md:py-12 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-[#0B6B4F] uppercase tracking-wider">
            Step 2 of 2 · Partner Onboarding & Document Submission
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#101828]">
            Complete your host profile & credentials
          </h1>
          <p className="text-sm text-[#475467]">
            Upload your credentials for profile records. Marketplace hosts transact directly with renters at physical vehicle handover.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 rounded-3xl bg-[#FFFAEB] border border-[#FEDF89] flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#F5B547] text-white flex items-center justify-center font-bold">
                ✓
              </span>
              <h2 className="font-heading font-extrabold text-xl text-[#101828]">
                Sent for checking
              </h2>
            </div>
            <p className="text-sm text-[#475467] leading-relaxed">
              Our partner support team records your profile within 24 hours. You will receive the outcome in your SafarPK inbox and on WhatsApp. Registered hosts receive a &ldquo;Direct Host&rdquo; profile badge on their listings.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white border border-[#FEDF89] text-[#8A4B00] text-xs font-bold">
                CNIC {cnicNumber} · in review
              </span>
              {isBusiness && (
                <span className="px-3 py-1 rounded-full bg-white border border-[#FEDF89] text-[#8A4B00] text-xs font-bold">
                  NTN {ntnNumber} · in review
                </span>
              )}
            </div>
            <Link
              href={activeUser?.role === 'DRIVER' ? '/driver' : '/lister'}
              className="self-start mt-2 h-11 px-6 rounded-xl bg-[#101828] text-white font-bold text-sm flex items-center justify-center hover:bg-slate-800 transition"
            >
              Go to my dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Box: Account Type & Documents */}
            <section className="bg-white border border-[#EEF0F2] rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
              <span className="font-bold text-sm text-[#101828]">You are registering as</span>
              <div
                role="radiogroup"
                aria-label="Account type"
                className="grid grid-cols-2 gap-1.5 p-1 bg-[#F2F4F7] rounded-xl text-xs font-bold"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isBusiness}
                  onClick={() => setIsBusiness(true)}
                  className={`p-3 rounded-lg text-left transition cursor-pointer ${
                    isBusiness ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085]'
                  }`}
                >
                  <span className="block font-bold">Registered Business</span>
                  <span className="text-[10px] text-slate-500 font-normal">Company or showroom</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!isBusiness}
                  onClick={() => setIsBusiness(false)}
                  className={`p-3 rounded-lg text-left transition cursor-pointer ${
                    !isBusiness ? 'bg-white text-[#101828] shadow-xs' : 'text-[#667085]'
                  }`}
                >
                  <span className="block font-bold">Individual</span>
                  <span className="text-[10px] text-slate-500 font-normal">Private host / driver</span>
                </button>
              </div>

              {/* Business Licence if business */}
              {isBusiness && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#101828]">
                    Business Registration / Trade Licence
                  </span>
                  {!blUploaded ? (
                    <button
                      type="button"
                      onClick={handleSimulateBizUpload}
                      className="p-4 border-2 border-dashed border-[#D0D5DD] rounded-2xl bg-white hover:bg-slate-50 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold text-[#344054]"
                    >
                      <Upload className="w-5 h-5 text-[#0B6B4F]" />
                      <span>Upload business licence (PDF or Photo)</span>
                      <span className="text-[10px] text-[#667085]">SECP, NTN, or Chamber Certificate</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#F6FEF9] border border-[#ABEFC6] flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#067647]">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          {blFile} (Read automatically)
                        </span>
                        <button
                          type="button"
                          onClick={() => setBlUploaded(false)}
                          className="underline text-[11px] text-[#101828]"
                        >
                          Upload again
                        </button>
                      </div>
                      <div className="p-2 rounded-lg bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-between font-mono text-xs text-[#344054]">
                        <span>NTN: {ntnNumber}</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="p-2 rounded-lg bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-between text-xs font-semibold text-[#344054]">
                        <span>Name: {businessName}</span>
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CNIC Upload */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#101828]">
                  National ID (CNIC) Front & Back
                </span>
                {!cnicUploaded ? (
                  <button
                    type="button"
                    onClick={handleSimulateCnicUpload}
                    className="p-4 border-2 border-dashed border-[#D0D5DD] rounded-2xl bg-white hover:bg-slate-50 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold text-[#344054]"
                  >
                    <Upload className="w-5 h-5 text-[#0B6B4F]" />
                    <span>Upload CNIC (Photo or PDF)</span>
                    <span className="text-[10px] text-[#667085]">Name & CNIC are read automatically</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-[#F6FEF9] border border-[#ABEFC6] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#067647]">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        {cnicFile} (Read automatically)
                      </span>
                      <button
                        type="button"
                        onClick={() => setCnicUploaded(false)}
                        className="underline text-[11px] text-[#101828]"
                      >
                        Upload again
                      </button>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-between font-mono text-xs text-[#344054]">
                      <span>CNIC: {cnicNumber}</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="p-2 rounded-lg bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-between text-xs font-semibold text-[#344054]">
                      <span>Name: {personName}</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Right Box: Location Pin & Final Submit */}
            <section className="bg-white border border-[#EEF0F2] rounded-3xl p-6 flex flex-col gap-5 shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-[#101828]">
                  Office / Fleet Location
                </h3>
                <p className="text-xs text-[#667085]">
                  Drop your pin accurately. Verified locations appear with a GPS badge.
                </p>
              </div>

              <div className="relative h-44 rounded-2xl bg-[#E8EEF0] border border-[#E4E7EC] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#0B6B4F_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex flex-col items-center">
                  <MapPin className="w-8 h-8 text-[#0B6B4F] fill-[#0B6B4F]" />
                  <span className="text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded shadow-xs mt-1">
                    Selected Pin
                  </span>
                </div>
              </div>

              <label className="flex flex-col gap-1 text-xs font-semibold text-[#344054]">
                Physical Street Address
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-11 px-3 border border-[#E4E7EC] rounded-xl font-medium text-xs text-[#101828] outline-none"
                />
              </label>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitVerification}
                className="h-12 rounded-xl bg-[#0B6B4F] text-white font-heading font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#08513C] transition cursor-pointer shadow-md"
              >
                <span>Submit for Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </div>
        )}
      </main>

      <AppFooter />
      <MobileNavBar />
    </div>
  );
}

