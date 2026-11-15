'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { RoleArt } from '@/components/RoleArt';
import { registerNewUser, UserRole, ProviderSubtype } from '@/data/userAuth';

type SupportedLang = 'en' | 'ur' | 'ar' | 'de';
type OperationalRole = 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PICK_DROP' | 'SHIFTING';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<SupportedLang>('en');
  const [selectedRole, setSelectedRole] = useState<OperationalRole | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'CUSTOMER') setSelectedRole('CUSTOMER');
    else if (roleParam === 'LISTER') setSelectedRole('LISTER');
    else if (roleParam === 'DRIVER') setSelectedRole('DRIVER');
    else if (roleParam === 'PICK_DROP' || roleParam === 'SHUTTLE') setSelectedRole('PICK_DROP');
    else if (roleParam === 'SHIFTING' || roleParam === 'MOVER') setSelectedRole('SHIFTING');
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
    CUSTOMER: { en: 'Customer Account', ur: 'کسٹمر اکاؤنٹ', ar: 'حساب عميل', de: 'Kundenkonto' },
    LISTER: { en: 'Vehicle Owner Account', ur: 'گاڑی کا مالک اکاؤنٹ', ar: 'حساب مالك مركبة', de: 'Fahrzeugbesitzer' },
    DRIVER: { en: 'Chauffeur Account', ur: 'ڈرائیور اکاؤنٹ', ar: 'حساب سائق', de: 'Chauffeurkonto' },
    PICK_DROP: { en: 'Shuttle Operator Account', ur: 'پک اینڈ ڈراپ اکاؤنٹ', ar: 'حساب مشغل نقل', de: 'Shuttle-Betreiber' },
    SHIFTING: { en: 'Cargo Mover Account', ur: 'کارگو موور اکاؤنٹ', ar: 'حساب ناقل شحن', de: 'Transporteurkonto' },
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
      en: 'List vehicles, offer chauffeur rides, commuter vans or cargo transport',
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
    listerTitle: { en: 'Fleet Lister / Host', ur: 'گاڑیوں کا مالک / ہوسٹ', ar: 'مالك أسطول / مضيف', de: 'Flottenbetreiber / Host' },
    listerSub: {
      en: 'Rent out personal or commercial fleet',
      ur: 'ذاتی یا کمرشل گاڑیاں کرائے پر دیں',
      ar: 'تأجير سيارات شخصية أو تجارية',
      de: 'Privat- oder Gewerbefahrzeuge vermieten',
    },
    driverTitle: { en: 'Independent Driver', ur: 'ذاتی ڈرائیور / شوفیر', ar: 'سائق مستقل', de: 'Chauffeur / Fahrer' },
    driverSub: {
      en: 'Chauffeur by day, trip or monthly',
      ur: 'یومیہ، ایک طرفہ یا ماہانہ بنیاد پر ڈرائیونگ کریں',
      ar: 'سائق باليوم أو بالرحلة أو شهرياً',
      de: 'Fahrten pro Tag, Reise oder Monat',
    },
    shuttleTitle: { en: 'Pick & Drop Operator', ur: 'پک اینڈ ڈراپ آپریٹر', ar: 'مشغل نقل وتوصيل', de: 'Shuttle-Betreiber' },
    shuttleSub: {
      en: 'School, office & student routes',
      ur: 'اسکول، کالج اور آفس کے روٹس چلائیں',
      ar: 'مسارات المدارس والمكاتب والطلاب',
      de: 'Schul-, Büro- und Studentenrouten',
    },
    moverTitle: { en: 'Cargo & Shifting Mover', ur: 'سامان شفٹنگ و کارگو موور', ar: 'نقل أثاث وشحن بضائع', de: 'Umzug & Gütertransport' },
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
    businessDriver: { en: 'Chauffeur Service Badge / Title', ur: 'ڈرائیور سروس ٹائٹل', ar: 'لقب خدمة السائق', de: 'Chauffeur-Bezeichnung' },
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

    if (!selectedRole) {
      setError('Please select an operational role first.');
      return;
    }

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

    if (selectedRole === 'LISTER') {
      mappedRole = 'LISTER';
      target = '/lister';
    } else if (selectedRole === 'DRIVER') {
      mappedRole = 'DRIVER';
      target = '/driver';
    } else if (selectedRole === 'PICK_DROP') {
      mappedRole = 'PROVIDER';
      providerSubtype = 'PICK_AND_DROP';
      target = '/provider?mode=pick_and_drop';
    } else if (selectedRole === 'SHIFTING') {
      mappedRole = 'PROVIDER';
      providerSubtype = 'COMMERCIAL_CARGO';
      target = '/provider?mode=commercial_cargo';
    }

    const res = registerNewUser({
      name: fullName.trim(),
      businessName:
        businessName.trim() ||
        (selectedRole === 'LISTER'
          ? `${fullName.trim()} Fleet`
          : selectedRole === 'PICK_DROP'
          ? `${fullName.trim()} Commuters`
          : selectedRole === 'SHIFTING'
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

      {/* Main Container */}
      <main className="flex-1 px-4 py-8 sm:py-12 flex justify-center items-start">
        <form
          onSubmit={handleRegister}
          className="w-full max-w-[820px] bg-white border border-[#EEF0F2] rounded-3xl p-6 sm:p-10 flex flex-col gap-7 shadow-[0_8px_28px_rgba(16,24,40,0.06)]"
        >
          <div className="flex justify-between items-baseline gap-3">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
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

          {/* STEP 1: CHOOSE ROLE */}
          <section className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold text-[#101828]">
              <span className="w-6 h-6 rounded-full bg-[#101828] text-white text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span>{T.chooseType.en}</span>
              {lang !== 'en' && (
                <span className="text-xs font-normal text-slate-500">· {T.chooseType[lang]}</span>
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Left Column: Customer */}
              <div className="md:col-span-4 bg-[#EEF4FF] border border-[#D1DFFB] rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#1D3A8A] flex items-center justify-between">
                    <span>{T.bookHead.en}</span>
                    {lang !== 'en' && (
                      <span className="text-xs font-bold text-[#1D3A8A]/80" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.bookHead[lang]}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#344054] mt-0.5 leading-snug">
                    {T.bookSub.en}
                    {lang !== 'en' && (
                      <span className="block text-[11px] text-slate-500 font-medium mt-0.5" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        ({T.bookSub[lang]})
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedRole('CUSTOMER')}
                  className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-2.5 ${
                    selectedRole === 'CUSTOMER'
                      ? 'bg-white border-[#1D3A8A] ring-2 ring-[#1D3A8A]/20 shadow-sm'
                      : 'bg-white/80 border-[#D1DFFB] hover:bg-white'
                  }`}
                >
                  <div className="w-full h-24 rounded-lg bg-[#E0EAFF] flex items-center justify-center relative overflow-hidden">
                    <RoleArt role="customer" className="w-20 h-20 object-contain" />
                    {selectedRole === 'CUSTOMER' && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1D3A8A] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#101828] flex items-center justify-between gap-1">
                      <span>{T.customerTitle.en}</span>
                      {lang !== 'en' && (
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded shrink-0">
                          {T.customerTitle[lang]}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-[#475467] leading-tight mt-0.5">
                      {T.customerSub.en}
                    </p>
                    {lang !== 'en' && (
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.customerSub[lang]}
                      </p>
                    )}
                  </div>
                </button>
              </div>

              {/* Right Column: Earn on SafarPK */}
              <div className="md:col-span-8 bg-[#F7F8FA] border border-[#E4E7EC] rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-[#101828] flex items-center justify-between">
                    <span>{T.earnHead.en}</span>
                    {lang !== 'en' && (
                      <span className="text-xs font-bold text-emerald-800" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.earnHead[lang]}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#344054] mt-0.5 leading-snug">
                    {T.earnSub.en}
                    {lang !== 'en' && (
                      <span className="block text-[11px] text-slate-500 font-medium mt-0.5" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        ({T.earnSub[lang]})
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option 1: Lister */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('LISTER')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'LISTER'
                        ? 'bg-white border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-sm'
                        : 'bg-white border-[#E4E7EC] hover:border-slate-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0 relative">
                      <RoleArt role="owner" className="w-11 h-11 object-contain" />
                      {selectedRole === 'LISTER' && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-[#101828] truncate">{T.listerTitle.en}</h4>
                        {lang !== 'en' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                            {T.listerTitle[lang]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] leading-tight mt-0.5 truncate">{T.listerSub.en}</p>
                      {lang !== 'en' && (
                        <p className="text-[10px] text-slate-500 leading-tight truncate" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          {T.listerSub[lang]}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Option 2: Driver */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('DRIVER')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'DRIVER'
                        ? 'bg-white border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-sm'
                        : 'bg-white border-[#E4E7EC] hover:border-slate-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#E0F2FE] flex items-center justify-center shrink-0 relative">
                      <RoleArt role="driver" className="w-11 h-11 object-contain" />
                      {selectedRole === 'DRIVER' && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-[#101828] truncate">{T.driverTitle.en}</h4>
                        {lang !== 'en' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                            {T.driverTitle[lang]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] leading-tight mt-0.5 truncate">{T.driverSub.en}</p>
                      {lang !== 'en' && (
                        <p className="text-[10px] text-slate-500 leading-tight truncate" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          {T.driverSub[lang]}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Option 3: Pick & Drop */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('PICK_DROP')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'PICK_DROP'
                        ? 'bg-white border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-sm'
                        : 'bg-white border-[#E4E7EC] hover:border-slate-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#FEF3C7] flex items-center justify-center shrink-0 relative">
                      <RoleArt role="shuttle" className="w-11 h-11 object-contain" />
                      {selectedRole === 'PICK_DROP' && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-[#101828] truncate">{T.shuttleTitle.en}</h4>
                        {lang !== 'en' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                            {T.shuttleTitle[lang]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] leading-tight mt-0.5 truncate">{T.shuttleSub.en}</p>
                      {lang !== 'en' && (
                        <p className="text-[10px] text-slate-500 leading-tight truncate" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          {T.shuttleSub[lang]}
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Option 4: Movers */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('SHIFTING')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                      selectedRole === 'SHIFTING'
                        ? 'bg-white border-[#0B6B4F] ring-2 ring-[#0B6B4F]/20 shadow-sm'
                        : 'bg-white border-[#E4E7EC] hover:border-slate-300'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0 relative">
                      <RoleArt role="movers" className="w-11 h-11 object-contain" />
                      {selectedRole === 'SHIFTING' && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B6B4F] text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs text-[#101828] truncate">{T.moverTitle.en}</h4>
                        {lang !== 'en' && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded shrink-0">
                            {T.moverTitle[lang]}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] leading-tight mt-0.5 truncate">{T.moverSub.en}</p>
                      {lang !== 'en' && (
                        <p className="text-[10px] text-slate-500 leading-tight truncate" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                          {T.moverSub[lang]}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 2: DETAILS */}
          {selectedRole ? (
            <section className="flex flex-col gap-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-extrabold text-[#101828]">
                  <span className="w-6 h-6 rounded-full bg-[#101828] text-white text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>{T.details.en}</span>
                  {lang !== 'en' && (
                    <span className="text-xs font-normal text-slate-500">· {T.details[lang]}</span>
                  )}
                </h2>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span>
                    {selectedRole === 'CUSTOMER'
                      ? 'Customer Account'
                      : selectedRole === 'LISTER'
                      ? 'Vehicle Owner Account'
                      : selectedRole === 'DRIVER'
                      ? 'Chauffeur Account'
                      : selectedRole === 'PICK_DROP'
                      ? 'Shuttle Operator Account'
                      : 'Cargo Mover Account'}
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
                          ? 'e.g. VIP Executive Chauffeur'
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
                <span>{T.complete.en}</span>
                {lang !== 'en' && (
                  <span className="text-xs sm:text-sm font-semibold opacity-90 border-l border-white/30 pl-2">
                    {T.complete[lang]}
                  </span>
                )}
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
