'use client';

import React, { useState } from 'react';
import {
  CountryInfo,
  CurrencyInfo,
  saveInternationalInquiry,
  getAdminContactEmail,
} from '@/data/countries';
import {
  Sparkles,
  Car,
  Plane,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Send,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';

interface InternationalComingSoonProps {
  country: CountryInfo;
  currency: CurrencyInfo;
  onBrowsePakistanInbound: () => void;
}

export function InternationalComingSoon({
  country,
  currency,
  onBrowsePakistanInbound,
}: InternationalComingSoonProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(country.dialCode ? `${country.dialCode} ` : '');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(country.cities[1] || country.defaultCity);
  const [serviceType, setServiceType] = useState('Car Rental (Self-Drive or with Driver)');
  const [fleetDetails, setFleetDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !email.trim()) return;

    setSubmitting(true);

    // 1. Save to persistent storage & dispatch event
    const record = saveInternationalInquiry({
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      countryCode: country.code,
      countryName: country.name,
      city: city.trim(),
      serviceType,
      fleetDetails: fleetDetails.trim() || '1 Vehicle',
      notes: notes.trim(),
    });

    // 2. Fetch Super Admin's configured receiving email
    const targetAdminEmail = getAdminContactEmail();

    // 3. Format pre-filled mailto
    const subject = encodeURIComponent(`[Safar Partner] Pre-Registration for ${country.name} (${city}) - ${fullName}`);
    const body = encodeURIComponent(
      `Hello Safar Global Operations Team,\n\n` +
      `I would like to pre-register my vehicle / fleet on the Safar marketplace in ${country.name}.\n\n` +
      `--- PARTNER DETAILS ---\n` +
      `Full Name: ${fullName}\n` +
      `Country: ${country.name} (${country.code})\n` +
      `City: ${city}\n` +
      `Phone / WhatsApp: ${phone}\n` +
      `Email: ${email}\n` +
      `Service Type: ${serviceType}\n` +
      `Fleet Details: ${fleetDetails || 'Not specified'}\n` +
      `Additional Notes: ${notes || 'None'}\n\n` +
      `Please contact me regarding onboarding and vehicle listing verification.\n\n` +
      `Thank you,\n${fullName}`
    );

    const mailtoUrl = `mailto:${targetAdminEmail}?subject=${subject}&body=${body}`;

    // Open user's email client
    try {
      window.location.href = mailtoUrl;
    } catch (e) {}

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="w-full flex flex-col gap-8 py-8 animate-in fade-in duration-300">
      {/* 1. Inbound Pakistan Booking Option Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold tracking-wide w-fit backdrop-blur-xs">
              <Plane className="w-3.5 h-3.5" />
              <span>Visiting or Sending Family to Pakistan from {country.name}?</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-white">
              Book Rent-a-Car, Drivers & Shuttles in Pakistan (in {currency.code} {currency.symbol})
            </h3>
            <p className="text-emerald-100/90 text-sm leading-relaxed">
              Traveling to Lahore, Karachi, or Islamabad? Browse 150+ verified Pakistani vehicles and drivers right now. All rental rates and fuel calculations are automatically converted to your local <strong className="text-white">{currency.name} ({currency.code})</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onBrowsePakistanInbound}
            className="px-6 py-3.5 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm sm:text-base shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer group"
          >
            <span>Explore Pakistan Fleet in {currency.code}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 2. Main Coming Soon Showcase & Pre-Registration Box */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 sm:p-10 flex flex-col lg:flex-row gap-10">
        {/* Left Information Column */}
        <div className="lg:w-5/12 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl">{country.flag}</span>
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
                Coming Soon
              </span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Safar is Launching Soon in {country.name}
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              We are expanding our direct vehicle rental and chauffeur network to {country.name}. Soon you will be able to book verified cars, hire licensed private drivers, and arrange corporate transport across{' '}
              <strong className="text-slate-900 font-semibold">
                {country.cities.filter((c) => !c.toLowerCase().startsWith('all ')).slice(0, 4).join(', ')}
              </strong>.
            </p>

            {/* Pillar benefits for partners */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">0% Commission for 3 Months</h4>
                  <p className="text-[12px] text-slate-500">Founding partners keep 100% of customer earnings.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Direct Customer Connection</h4>
                  <p className="text-[12px] text-slate-500">Direct WhatsApp chats and direct in-person handovers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Priority Verification & Badges</h4>
                  <p className="text-[12px] text-slate-500">Pre-registered partners get top placement at launch.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
            Inquiries are sent directly to Safar Global Operations (<span className="font-mono text-slate-600">{getAdminContactEmail()}</span>).
          </div>
        </div>

        {/* Right Form Column: Partner Pre-Registration Box */}
        <div className="lg:w-7/12 bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="py-12 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-slate-900">
                Pre-Registration Received!
              </h3>
              <p className="text-slate-600 text-sm max-w-md">
                Thank you, <strong className="text-slate-900">{fullName}</strong>. Your partner pre-registration for{' '}
                <strong className="text-slate-900">{city}, {country.name}</strong> has been forwarded to our Super Admin operations desk.
              </p>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 max-w-md text-left">
                ✉️ An email draft addressed to <strong className="font-mono">{getAdminContactEmail()}</strong> was generated for you. Our team will also reach out to your WhatsApp (<strong className="font-mono">{phone}</strong>) within 24 hours.
              </div>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-3 px-5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Register another vehicle or city
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 border-b border-slate-200 pb-3">
                <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#0B6B4F]" />
                  <span>List Your Vehicle / Service in {country.name}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-register your car or fleet to receive priority customer bookings on launch day.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Klaus Schmidt / Tariq Ali"
                      className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={country.dialCode ? `${country.dialCode} 123456789` : '+1 234 567 8900'}
                      className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="host@example.com"
                      className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating City in {country.name} *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {country.cities
                      .filter((c) => !c.toLowerCase().startsWith('all '))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    <option value="Other Regional City">Other City in {country.name}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Category *
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Car Rental (Self-Drive)">Rent a Car (Self-Drive)</option>
                    <option value="Car Rental with Chauffeur">Rent a Car with Chauffeur</option>
                    <option value="Independent Chauffeur / Driver">Independent Chauffeur</option>
                    <option value="Corporate Van / Commuter Shuttle">Commuter Van / Shuttle</option>
                    <option value="Home Shifting & Commercial Cargo">Cargo Logistics & Moving</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fleet Details / Vehicles Owned
                  </label>
                  <input
                    type="text"
                    value={fleetDetails}
                    onChange={(e) => setFleetDetails(e.target.value)}
                    placeholder="e.g. 2 Mercedes C-Class, 1 Van"
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about your fleet availability, airport service, or special inquiries..."
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                <Send className="w-4 h-4" />
                <span>Submit Pre-Registration & Open Direct Email</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Submitting records your inquiry in our admin portal and opens your email client pre-addressed to <strong className="text-slate-600 font-mono">{getAdminContactEmail()}</strong>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

