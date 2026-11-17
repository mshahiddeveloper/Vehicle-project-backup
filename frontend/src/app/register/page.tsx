'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  User,
  Briefcase,
  Car,
  Truck,
  Bus,
  Award,
  Check,
  CarTaxiFront,
  Boxes,
} from 'lucide-react';
import { RoleArt } from '@/components/RoleArt';
import { registerNewUser, UserRole, ProviderSubtype } from '@/data/userAuth';

type SupportedLang = 'en' | 'ur' | 'ar' | 'de';
type OperationalRole = 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PICK_DROP' | 'SHIFTING';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<SupportedLang>('en');
  const [accountType, setAccountType] = useState<'customer' | 'partner'>('customer');
  const [partnerRole, setPartnerRole] = useState<OperationalRole>('LISTER');
  const [selectedRole, setSelectedRole] = useState<OperationalRole>('CUSTOMER');

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'CUSTOMER') {
      setAccountType('customer');
      setSelectedRole('CUSTOMER');
    } else if (roleParam === 'LISTER') {
      setAccountType('partner');
      setPartnerRole('LISTER');
      setSelectedRole('LISTER');
    } else if (roleParam === 'DRIVER') {
      setAccountType('partner');
      setPartnerRole('DRIVER');
      setSelectedRole('DRIVER');
    } else if (roleParam === 'PICK_DROP' || roleParam === 'SHUTTLE') {
      setAccountType('partner');
      setPartnerRole('PICK_DROP');
      setSelectedRole('PICK_DROP');
    } else if (roleParam === 'SHIFTING' || roleParam === 'MOVER') {
      setAccountType('partner');
      setPartnerRole('SHIFTING');
      setSelectedRole('SHIFTING');
    } else {
      setAccountType('customer');
      setSelectedRole('CUSTOMER');
    }
  }, [searchParams]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ROLE_BADGES: Record<OperationalRole, Record<SupportedLang, string>> = {
    CUSTOMER: { en: 'Customer', ur: 'کسٹمر', ar: 'عميل', de: 'Kunde' },
    LISTER: { en: 'Rent Vehicle', ur: 'گاڑی کرایہ', ar: 'تأجير مركبة', de: 'Fahrzeugvermietung' },
    DRIVER: { en: 'Captain Driver', ur: 'کپتان / ڈرائیور', ar: 'كابتن / سائق', de: 'Kapitän / Fahrer' },
    PICK_DROP: { en: 'Pick & Drop', ur: 'پک اینڈ ڈراپ', ar: 'نقل وتوصيل', de: 'Pick & Drop' },
    SHIFTING: { en: 'Cargo Shifting', ur: 'سامان و شفٹنگ', ar: 'شحن ونقل', de: 'Logistik & Umzug' },
  };

  const T: Record<string, Record<SupportedLang, string>> = {
    create: { en: 'Create account', ur: 'اکاؤنٹ بنائیں', ar: 'إنشاء حساب', de: 'Konto erstellen' },
    chooseType: { en: 'Choose your role', ur: 'اپنا کردار منتخب کریں', ar: 'اختر دورك', de: 'Rolle wählen' },
    bookHead: { en: 'Book & ride', ur: 'سواری بک کریں', ar: 'احجز واركب', de: 'Buchen & Fahren' },
    bookSub: {
      en: 'Rent cars, hire drivers, book pick & drop and shifting',
      ur: 'گاڑی، ڈرائیور، شٹل اور شفٹنگ بک کریں',
      ar: 'استئجار سيارات وسائقين ونقل',
      de: 'Mietwagen, Chauffeure und Umzüge buchen',
    },
    earnHead: { en: 'Earn on SafarPK', ur: 'سفر پی کے پر کمائیں', ar: 'اكسب مع سفر', de: 'Verdienen auf SafarPK' },
    earnSub: {
      en: 'List vehicles, offer driver rides, commuter vans or cargo transport',
      ur: 'گاڑیاں لسٹ کریں، ڈرائیونگ، شٹل یا کارگو سروس دیں',
      ar: 'أدر أسطولك أو قدم خدمات التوصيل والنقل',
      de: 'Fahrzeuge listen oder Transport anbieten',
    },
    customerTitle: { en: 'Customer / Commuter', ur: 'کسٹمر / مسافر', ar: 'عميل / راكب', de: 'Kunde / Pendler' },
    customerSub: {
      en: 'Rent vehicles, hire drivers, book pick & drop and cargo',
      ur: 'گاڑیاں، ڈرائیور، پک اینڈ ڈراپ اور کارگو بک کریں',
      ar: 'استأجر مركبات وسائقين وتوصيل ونقل بضائع',
      de: 'Fahrzeuge mieten, Fahrer buchen & Fracht',
    },
    listerTitle: { en: 'Rent Vehicle / Lister', ur: 'گاڑی کرایہ / ہوسٹ', ar: 'تأجير مركبات / مضيف', de: 'Fahrzeugvermietung / Host' },
    listerSub: {
      en: 'Rent out personal or commercial fleet',
      ur: 'ذاتی یا کمرشل گاڑیاں کرائے پر دیں',
      ar: 'تأجير سيارات شخصية أو تجارية',
      de: 'Privat- oder Gewerbefahrzeuge vermieten',
    },
    driverTitle: { en: 'Captain / Driver', ur: 'کپتان / ڈرائیور', ar: 'كابتن / سائق', de: 'Kapitän / Fahrer' },
    driverSub: {
      en: 'Drive by day, trip or monthly',
      ur: 'یومیہ، ایک طرفہ یا ماہانہ بنیاد پر ڈرائیونگ کریں',
      ar: 'سائق باليوم أو بالرحلة أو شهرياً',
      de: 'Fahrten pro Tag, Reise oder Monat',
    },
    shuttleTitle: { en: 'Pick & Drop', ur: 'پک اینڈ ڈراپ', ar: 'نقل وتوصيل', de: 'Pick & Drop' },
    shuttleSub: {
      en: 'School, office & student routes',
      ur: 'اسکول، کالج اور آفس کے روٹس چلائیں',
      ar: 'مسارات المدارس والمكاتب والطلاب',
      de: 'Schul-, Büro- und Studentenrouten',
    },
    moverTitle: { en: 'Logistics & Shifting', ur: 'سامان شفٹنگ و لاجسٹکس', ar: 'خدمات النقل والشحن', de: 'Logistik & Umzug' },
    moverSub: {
      en: 'Home shifting & goods logistics',
      ur: 'گھر، دفتر کی شفٹنگ اور سامان باربرداری',
      ar: 'نقل منازل ومكاتب وخدمات لوجستية',
      de: 'Wohnungsumzüge & Warenlogistik',
    },
    details: { en: 'Enter your details', ur: 'اپنی معلومات درج کریں', ar: 'أدخل بياناتك', de: 'Ihre Angaben' },
    fullName: { en: 'Full Name *', ur: 'مکمل نام *', ar: 'الاسم الكامل *', de: 'Vollständiger Name *' },
    yourCity: { en: 'Your City *', ur: 'آپ کا شہر *', ar: 'مدينتك *', de: 'Ihre Stadt *' },
    operatingCity: { en: 'Operating City *', ur: 'آپریٹنگ شہر *', ar: 'مدينة العمل *', de: 'Einsatzort / Stadt *' },
    businessLister: { en: 'Business / Showroom / Fleet Title *', ur: 'بزنس یا شوروم کا نام *', ar: 'اسم المعرض أو الأسطول *', de: 'Name des Fuhrparks / Showrooms *' },
    businessDriver: { en: 'Captain / Driver Service Title', ur: 'کپتان / ڈرائیور سروس ٹائٹل', ar: 'لقب خدمة السائق', de: 'Fahrer-Bezeichnung' },
    businessProvider: { en: 'Company / Logistics Fleet Title *', ur: 'کمپنی یا ٹرانسپورٹ بیڑے کا نام *', ar: 'اسم الشركة أو أسطول الشحن *', de: 'Name des Transportunternehmens *' },
    phone: { en: 'Phone (+92) *', ur: 'موبائل نمبر (+92) *', ar: 'رقم الهاتف (+92) *', de: 'Telefonnummer (+92) *' },
    email: { en: 'Email Address (Optional)', ur: 'ای میل ایڈریس (اختیاری)', ar: 'البريد الإلكتروني (اختياري)', de: 'E-Mail-Adresse (Optional)' },
    password: { en: 'Password * (Min 6 chars)', ur: 'پاس ورڈ * (کم از کم 6 ہندسے)', ar: 'كلمة المرور * (6 أحرف على الأقل)', de: 'Passwort * (Mind. 6 Zeichen)' },
    confirmPassword: { en: 'Confirm Password *', ur: 'پاس ورڈ کی تصدیق *', ar: 'تأكيد كلمة المرور *', de: 'Passwort bestätigen *' },
    termsNote: {
      en: 'I agree to the Terms of Service, Privacy Policy, and direct marketplace model (direct customer-host connection and payment at handover).',
      ur: 'میں سروس کی شرائط، پرائیویسی پالیسی اور ڈائریکٹ مارکیٹ پلیس ماڈل (براہِ راست رابطہ اور ادائیگی) سے متفق ہوں۔',
      ar: 'أوافق على شروط الخدمة وسياسة الخصوصية ونموذج التعامل المباشر والدفع عند التسليم.',
      de: 'Ich stimme den Nutzungsbedingungen, Datenschutzrichtlinien und dem Direktmarktmodell zu.',
    },
    complete: {
      en: 'Complete Registration & Enter Dashboard',
      ur: 'رجسٹریشن مکمل کریں اور داخل ہوں',
      ar: 'أكمل التسجيل وادخل لوحة التحكم',
      de: 'Registrierung abschließen & Dashboard betreten',
    },
    haveAcc: { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟', ar: 'لديك حساب بالفعل؟', de: 'Bereits ein Konto?' },
    signIn: { en: 'Sign in', ur: 'سائن اِن', ar: 'تسجيل الدخول', de: 'Anmelden' },
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const activeRole: OperationalRole = accountType === 'customer' ? 'CUSTOMER' : partnerRole;

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match! Please check both password fields.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the SafarPK Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);

    let mappedRole: UserRole = 'CUSTOMER';
    let providerSubtype: ProviderSubtype | undefined = undefined;
    let target = '/customer';

    if (activeRole === 'LISTER') {
      mappedRole = 'LISTER';
      target = '/lister';
    } else if (activeRole === 'DRIVER') {
      mappedRole = 'DRIVER';
      target = '/driver';
    } else if (activeRole === 'PICK_DROP') {
      mappedRole = 'PROVIDER';
      providerSubtype = 'PICK_AND_DROP';
      target = '/provider?mode=pick_and_drop';
    } else if (activeRole === 'SHIFTING') {
      mappedRole = 'PROVIDER';
      providerSubtype = 'COMMERCIAL_CARGO';
      target = '/provider?mode=commercial_cargo';
    }

    const res = registerNewUser({
      name: fullName.trim(),
      businessName:
        businessName.trim() ||
        (activeRole === 'LISTER'
          ? `${fullName.trim()} Fleet`
          : activeRole === 'PICK_DROP'
          ? `${fullName.trim()} Commuters`
          : activeRole === 'SHIFTING'
          ? `${fullName.trim()} Cargo Logistics`
          : undefined),
      phone: phone.trim(),
      email: email.trim() || undefined,
      password: password,
      city: city.trim() || 'Lahore',
      countryCode: 'PK',
      role: mappedRole,
      providerSubtype,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
      return;
    }

    if (res.alreadyExists) {
      setNotice('Matching existing account found! Opening your dashboard directly...');
    }

    // Direct routing to role portal
    let dest = target;
    if (res.alreadyExists && res.user) {
      if (res.user.role === 'LISTER') dest = '/lister';
      else if (res.user.role === 'DRIVER') dest = '/driver';
      else if (res.user.role === 'PROVIDER') {
        dest =
          res.user.providerSubtype === 'COMMERCIAL_CARGO'
            ? '/provider?mode=commercial_cargo'
            : '/provider?mode=pick_and_drop';
      } else dest = '/customer';
    }

    setTimeout(() => {
      router.push(dest);
    }, res.alreadyExists ? 800 : 200);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#101828] font-sans flex flex-col">
      {/* Brand Header with Mobile Back Button */}
      <header className="bg-white border-b border-[#EEF0F2] sticky top-0 z-20">
        <div className="max-w-[620px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="p-1.5 -ml-1 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Go Back"
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700 shrink-0" />
              <span className="text-xs font-bold text-slate-700 pr-1">Back</span>
            </button>

            <Link href="/" className="flex items-center gap-2 text-[#101828]">
              <span className="w-8 h-8 rounded-xl bg-[#0B6B4F] text-white flex items-center justify-center font-heading font-extrabold text-base shadow-xs">
                S
              </span>
              <span className="font-heading font-extrabold text-lg sm:text-xl tracking-tight">
                SafarPK
              </span>
            </Link>
          </div>

          {/* Language Selector */}
          <label className="flex items-center gap-1.5 h-8 px-2.5 border border-[#E4E7EC] rounded-xl bg-white text-xs font-semibold cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-[#344054]" />
            <select
              aria-label="Language"
              value={lang}
              onChange={(e) => setLang(e.target.value as SupportedLang)}
              className="border-0 outline-none bg-transparent font-semibold text-[#101828] cursor-pointer text-xs"
            >
              <option value="en">English</option>
              <option value="ur">English + اردو</option>
              <option value="ar">English + العربية</option>
              <option value="de">English + Deutsch</option>
            </select>
          </label>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-8 sm:py-12 flex justify-center items-start">
        <form
          onSubmit={handleRegister}
          className="w-full max-w-[820px] bg-white border border-[#EEF0F2] rounded-3xl p-4 sm:p-10 flex flex-col gap-6 sm:gap-7 shadow-[0_8px_28px_rgba(16,24,40,0.06)]"
        >
          <div className="flex justify-between items-baseline gap-3">
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl tracking-tight">
              {T.create.en}
            </h1>
            {lang !== 'en' && (
              <span
                dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}
                className="text-lg font-bold text-[#0B6B4F]"
              >
                {T.create[lang]}
              </span>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE ACCOUNT TYPE (Uber/Careem 2-Option Switcher) */}
          <section className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold text-[#101828]">
                <span className="w-6 h-6 rounded-full bg-[#101828] text-white text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Select Account Type</span>
                {lang !== 'en' && (
                  <span className="text-xs font-normal text-slate-500">· {T.chooseType[lang]}</span>
                )}
              </h2>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                {accountType === 'customer' ? 'For personal or business travel' : 'For hosts, drivers & transport operators'}
              </span>
            </div>

            {/* Uber-style 2-Button Switcher */}
            <div className="grid grid-cols-2 p-1 sm:p-1.5 rounded-2xl bg-slate-100 border border-slate-200 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAccountType('customer');
                  setSelectedRole('CUSTOMER');
                }}
                className={`py-2.5 sm:py-3 px-2 sm:px-5 rounded-xl font-heading font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                  accountType === 'customer'
                    ? 'bg-white text-[#101828] shadow-sm ring-1 ring-black/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${accountType === 'customer' ? 'text-[#0B6B4F]' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap font-extrabold">Customer</span>
                {accountType === 'customer' && (
                  <span className="w-2 h-2 rounded-full bg-[#0B6B4F] shrink-0 hidden sm:inline-block" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAccountType('partner');
                  setSelectedRole(partnerRole);
                }}
                className={`py-2.5 sm:py-3 px-2 sm:px-5 rounded-xl font-heading font-extrabold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition cursor-pointer ${
                  accountType === 'partner'
                    ? 'bg-[#0B6B4F] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                {/* On mobile show 'Partner' so it never truncates to 'Become a Part...', on sm+ show 'Become a Partner' */}
                <span className="sm:hidden whitespace-nowrap font-extrabold">Partner</span>
                <span className="hidden sm:inline whitespace-nowrap font-extrabold">Become a Partner</span>
                {accountType === 'partner' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0 hidden sm:inline-block" />
                )}
              </button>
            </div>

            {/* If Partner is active: show compact 2x2 grid for the 4 partner categories */}
            {accountType === 'partner' && (
              <div className="flex flex-col gap-2 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs px-0.5 text-slate-600">
                  <span className="font-bold text-[#101828] text-xs">Partner Category:</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Select what service you provide</span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* Category 1: Rent Vehicle */}
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerRole('LISTER');
                      setSelectedRole('LISTER');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 sm:gap-2.5 relative ${
                      partnerRole === 'LISTER'
                        ? 'bg-emerald-50/80 border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[11px] sm:text-xs text-[#101828] leading-tight">
                        Rent Vehicle
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                        Cars & Fleets
                      </div>
                    </div>
                    {partnerRole === 'LISTER' && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Category 2: Captain / Driver (Clean CarTaxiFront Icon, no crop) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerRole('DRIVER');
                      setSelectedRole('DRIVER');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 sm:gap-2.5 relative ${
                      partnerRole === 'DRIVER'
                        ? 'bg-emerald-50/80 border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                      <CarTaxiFront className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[11px] sm:text-xs text-[#101828] leading-tight">
                        Captain Driver
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                        Private Chauffeur
                      </div>
                    </div>
                    {partnerRole === 'DRIVER' && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Category 3: Pick & Drop */}
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerRole('PICK_DROP');
                      setSelectedRole('PICK_DROP');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 sm:gap-2.5 relative ${
                      partnerRole === 'PICK_DROP'
                        ? 'bg-emerald-50/80 border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[11px] sm:text-xs text-[#101828] leading-tight">
                        Pick & Drop
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                        School & Office
                      </div>
                    </div>
                    {partnerRole === 'PICK_DROP' && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Category 4: Cargo & Shifting (Clean Boxes / Goods Freight Icon, no crop) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPartnerRole('SHIFTING');
                      setSelectedRole('SHIFTING');
                    }}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 sm:gap-2.5 relative ${
                      partnerRole === 'SHIFTING'
                        ? 'bg-emerald-50/80 border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                      <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[11px] sm:text-xs text-[#101828] leading-tight">
                        Cargo Shifting
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                        Goods & Moving
                      </div>
                    </div>
                    {partnerRole === 'SHIFTING' && (
                      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[9px] font-black shrink-0 shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* STEP 2: DETAILS */}
          {selectedRole ? (
            <section className="flex flex-col gap-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold text-[#101828]">
                  <span className="w-6 h-6 rounded-full bg-[#101828] text-white text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>{T.details.en}</span>
                  {lang !== 'en' && (
                    <span className="text-xs font-normal text-slate-500 hidden sm:inline">
                      · {T.details[lang]}
                    </span>
                  )}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs">
                  <span>
                    {selectedRole === 'CUSTOMER'
                      ? 'Customer'
                      : selectedRole === 'LISTER'
                      ? 'Rent Vehicle'
                      : selectedRole === 'DRIVER'
                      ? 'Captain Driver'
                      : selectedRole === 'PICK_DROP'
                      ? 'Pick & Drop'
                      : 'Cargo Shifting'}
                  </span>
                  {lang !== 'en' && ROLE_BADGES[selectedRole] && (
                    <span className="text-[10px] font-semibold text-emerald-700">
                      · {ROLE_BADGES[selectedRole][lang]}
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span>{T.fullName.en}</span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.fullName[lang]}
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asad Mehmood"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm font-semibold outline-none focus:border-[#0B6B4F]"
                  />
                </label>

                {/* City */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span>
                      {selectedRole === 'CUSTOMER' ? T.yourCity.en : T.operatingCity.en}
                    </span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {selectedRole === 'CUSTOMER' ? T.yourCity[lang] : T.operatingCity[lang]}
                      </span>
                    )}
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedRole === 'CUSTOMER'
                        ? 'e.g. Karachi / Lahore / Islamabad'
                        : 'e.g. Lahore / Islamabad / Karachi'
                    }
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm font-semibold outline-none focus:border-[#0B6B4F]"
                  />
                </label>

                {/* Business Name (for partner roles) */}
                {selectedRole !== 'CUSTOMER' && (
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                      <span>
                        {selectedRole === 'LISTER'
                          ? T.businessLister.en
                          : selectedRole === 'DRIVER'
                          ? T.businessDriver.en
                          : T.businessProvider.en}
                      </span>
                      {lang !== 'en' && (
                        <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          {selectedRole === 'LISTER'
                            ? T.businessLister[lang]
                            : selectedRole === 'DRIVER'
                            ? T.businessDriver[lang]
                            : T.businessProvider[lang]}
                        </span>
                      )}
                    </span>
                    <input
                      type="text"
                      required={selectedRole !== 'DRIVER'}
                      placeholder={
                        selectedRole === 'LISTER'
                          ? 'e.g. Shahid Rent a Car & Luxury Tours'
                          : selectedRole === 'DRIVER'
                          ? 'e.g. Executive Captain / City Driver'
                          : 'e.g. Shahid Express Logistics'
                      }
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm font-semibold outline-none focus:border-[#0B6B4F]"
                    />
                  </label>
                )}

                {/* Phone */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span>{T.phone.en}</span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.phone[lang]}
                      </span>
                    )}
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm font-mono font-semibold outline-none focus:border-[#0B6B4F]"
                  />
                </label>

                {/* Email (Optional) */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span>Email Address <span className="font-normal text-slate-400">(Optional)</span></span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-medium text-slate-500" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.email[lang]}
                      </span>
                    )}
                  </span>
                  <input
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm outline-none focus:border-[#0B6B4F]"
                  />
                </label>

                {/* Password */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span>{T.password.en}</span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.password[lang]}
                      </span>
                    )}
                  </span>
                  <div className="flex h-11 border border-[#D0D5DD] rounded-xl overflow-hidden focus-within:border-[#0B6B4F]">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 min-w-0 border-0 px-3 text-sm font-medium outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="bg-slate-50 px-2.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </label>

                {/* Confirm Password */}
                <label className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#344054]">{T.confirmPassword.en}</span>
                      {lang !== 'en' && (
                        <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          · {T.confirmPassword[lang]}
                        </span>
                      )}
                    </div>
                    {confirmPassword && (
                      <span
                        className={`text-[10px] font-black ${
                          password === confirmPassword ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {password === confirmPassword ? '✓ Passwords Match' : '✕ Passwords Differ'}
                      </span>
                    )}
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-11 border rounded-xl px-3 text-sm font-medium outline-none ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-300 bg-rose-50/20'
                        : 'border-[#D0D5DD] focus:border-[#0B6B4F]'
                    }`}
                  />
                </label>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 accent-[#0B6B4F] w-4 h-4 cursor-pointer"
                />
                <span className="leading-snug">
                  I agree to the{' '}
                  <Link href="/legal" target="_blank" className="font-bold text-[#0B6B4F] underline">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link href="/legal" target="_blank" className="font-bold text-[#0B6B4F] underline">
                    Privacy Policy
                  </Link>
                  , and direct marketplace model (direct customer-host connection and payment at handover).
                  {lang !== 'en' && (
                    <span className="block mt-1 text-[11px] text-slate-500 font-medium" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                      {T.termsNote[lang]}
                    </span>
                  )}
                </span>
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-14 px-6 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99] mt-3"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : accountType === 'customer'
                    ? 'Create Customer Account'
                    : partnerRole === 'LISTER'
                    ? 'Register as Rent Vehicle Partner'
                    : partnerRole === 'DRIVER'
                    ? 'Register as Captain / Driver'
                    : partnerRole === 'PICK_DROP'
                    ? 'Register as Pick & Drop Partner'
                    : 'Register as Logistics & Shifting Partner'}
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </button>
            </section>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 font-semibold">
              👆 Select your operational role above to proceed to registration details.
            </div>
          )}

          {/* Switch to Sign In */}
          <div className="pt-3 border-t border-[#F0F2F4] text-center text-xs text-[#475467] flex items-center justify-center gap-1.5 flex-wrap">
            <span>{T.haveAcc.en}</span>
            {lang !== 'en' && <span className="text-slate-400">({T.haveAcc[lang]})</span>}
            <Link href="/login" className="font-extrabold text-[#0B6B4F] hover:underline ml-1">
              {T.signIn.en}
              {lang !== 'en' && ` (${T.signIn[lang]})`}
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center text-slate-400 font-bold text-sm">
          Loading registration...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
