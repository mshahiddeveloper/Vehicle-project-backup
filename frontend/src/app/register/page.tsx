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
import { WhatsAppIcon } from '@/components/WhatsAppIcon';
import { WhatsAppOtpModal } from '@/components/WhatsAppOtpModal';
import { MobilePullToRefresh } from '@/components/MobilePullToRefresh';
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner';
import {
  registerNewUser,
  setActiveUser,
  UserRole,
  ProviderSubtype,
  getUserDashboardPath,
  sanitizePakistaniPhone,
  RegisteredUser,
} from '@/data/userAuth';
import { executePendingWishlistIfAny, syncWishlistFromServer } from '@/data/wishlist';
import { fetchSystemSettings, getLocalSystemSettings } from '@/data/systemSettings';
import {
  DEFAULT_PARTNER_CITY_POLICY,
  PartnerCityPolicy,
  getCountryCitiesList,
  resolveAllowedPartnerCities,
} from '@/data/countries';

type SupportedLang = 'en' | 'ur' | 'ar' | 'de';
type OperationalRole = 'CUSTOMER' | 'LISTER' | 'DRIVER' | 'PICK_DROP' | 'SHIFTING';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || searchParams.get('from');

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
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [phoneRegisteredError, setPhoneRegisteredError] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [waOtpRequired, setWaOtpRequired] = useState(false);
  const [cityPolicy, setCityPolicy] = useState<PartnerCityPolicy>(DEFAULT_PARTNER_CITY_POLICY);
  const [customCustomerCity, setCustomCustomerCity] = useState('');

  // Synchronize dynamic WhatsApp verification & Partner City Policy from Neon DB
  useEffect(() => {
    try {
      const local = getLocalSystemSettings();
      setWaOtpRequired(Boolean(local.whatsappVerificationEnabled));
      fetch('/api/settings', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.settings) {
            setWaOtpRequired(Boolean(data.settings.whatsappVerificationEnabled));
            if (data.settings.partnerCityPolicy) {
              setCityPolicy(data.settings.partnerCityPolicy);
            }
          }
        })
        .catch(() => {
          fetchSystemSettings().then((s) => {
            setWaOtpRequired(Boolean(s.whatsappVerificationEnabled));
          });
        });
    } catch {}
  }, []);

  const customerCities = getCountryCitiesList(cityPolicy.activeCountry || 'PK');
  const partnerAllowedCities = resolveAllowedPartnerCities(cityPolicy);
  const availableCitiesForRole = accountType === 'customer' ? customerCities : partnerAllowedCities;

  // Keep selected city valid when switching between Customer and Partner or when policy loads
  useEffect(() => {
    if (accountType === 'partner') {
      if (!partnerAllowedCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
        setCity(partnerAllowedCities[0] || 'Karachi');
      }
    } else if (!city) {
      setCity(customerCities[0] || 'Karachi');
    }
  }, [accountType, cityPolicy]);

  // Debounced real-time database pre-check to prevent sending OTP to already registered phone numbers
  useEffect(() => {
    const sanitized = sanitizePakistaniPhone(phone);
    if (!sanitized.isValid) {
      setPhoneRegisteredError(null);
      setIsCheckingPhone(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingPhone(true);
        const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(sanitized.standard)}`);
        const data = await res.json().catch(() => null);
        if (data && data.exists) {
          setPhoneRegisteredError('⚠️ An account with this phone number is already registered. Please sign in instead.');
          setPhoneVerified(false);
          setPhoneLocked(false);
        } else {
          setPhoneRegisteredError(null);
        }
      } catch (err) {
        console.warn('Phone pre-check network note:', err);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phone]);

  const handlePhoneChange = (raw: string) => {
    if (phoneLocked) return;
    const sanitized = sanitizePakistaniPhone(raw);
    setPhone(sanitized.display);
    setPhoneRegisteredError(null);
    if (phoneVerified) {
      setPhoneVerified(false);
    }
  };

  const handlePhoneVerified = (verifiedPhone: string) => {
    const sanitized = sanitizePakistaniPhone(verifiedPhone);
    setPhone(sanitized.display);
    setPhoneVerified(true);
    setPhoneLocked(true);
    setPhoneRegisteredError(null);
    setNotice('✓ WhatsApp number successfully verified & permanently locked!');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleOpenOtpModal = async () => {
    const sanitized = sanitizePakistaniPhone(phone);
    if (!sanitized.isValid) return;

    // Direct pre-check before opening modal
    try {
      setIsCheckingPhone(true);
      const res = await fetch(`/api/auth/check-phone?phone=${encodeURIComponent(sanitized.standard)}`);
      const data = await res.json().catch(() => null);
      if (data && data.exists) {
        setPhoneRegisteredError('⚠️ An account with this phone number is already registered. Please sign in instead.');
        return;
      }
    } catch (e) {
      // Proceed if network check fails
    } finally {
      setIsCheckingPhone(false);
    }

    setIsOtpModalOpen(true);
  };

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

  const handleRegister = async (e: React.FormEvent) => {
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

    if (phoneRegisteredError) {
      setError(phoneRegisteredError);
      return;
    }

    if (waOtpRequired && !phoneVerified) {
      setError('WhatsApp verification is active. Please verify your phone number via WhatsApp OTP to complete registration.');
      setIsOtpModalOpen(true);
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

    // 1. Synchronously persist user to Neon PostgreSQL database first
    try {
      const apiRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password: password,
          role: mappedRole,
          providerSubtype,
          city: (city === '__OTHER__' ? customCustomerCity.trim() : city.trim()) || 'Karachi',
          businessName: businessName.trim() || undefined,
        }),
      });
      const apiData = await apiRes.json().catch(() => null);
      if (!apiRes.ok || !apiData?.success) {
        setError(apiData?.error || 'Registration failed. An account with this phone number is already registered.');
        return;
      }

      // 2. Sync authenticated session directly from DB response (never get stuck on stale localStorage)
      const createdUser: RegisteredUser = {
        id: apiData.userId || apiData.user?.id,
        name: apiData.user?.name || fullName.trim(),
        businessName:
          businessName.trim() ||
          (activeRole === 'LISTER'
            ? `${fullName.trim()} Fleet`
            : activeRole === 'PICK_DROP'
            ? `${fullName.trim()} Commuters`
            : activeRole === 'SHIFTING'
            ? `${fullName.trim()} Cargo Logistics`
            : undefined),
        phone: apiData.user?.phone || phone.trim(),
        phoneVerified: waOtpRequired ? phoneVerified : true,
        phoneLocked: waOtpRequired ? phoneLocked : false,
        cnicLocked: false,
        licenseLocked: false,
        kycStatus: 'UNVERIFIED',
        email: apiData.user?.email || email.trim() || undefined,
        city: apiData.user?.city || city.trim() || 'Karachi',
        countryCode: 'PK',
        role: mappedRole,
        providerSubtype,
        registeredAt: new Date().toISOString(),
        metrics: { viewCount: 0, leadsCount: 0, clickCount: 0, lastActive: new Date().toISOString() },
        activities: [],
        subscription: apiData.user?.subscription || {
          status: mappedRole === 'CUSTOMER' ? 'ACTIVE' : 'UNSUBSCRIBED',
          quota: mappedRole === 'CUSTOMER' ? 999 : 0,
          usedQuota: 0,
        },
      };

      try {
        registerNewUser({
          name: createdUser.name,
          businessName: createdUser.businessName,
          phone: createdUser.phone,
          phoneVerified: createdUser.phoneVerified,
          phoneLocked: createdUser.phoneLocked,
          email: createdUser.email,
          password,
          city: createdUser.city,
          countryCode: 'PK',
          role: mappedRole,
          providerSubtype,
        });
      } catch {}

      setActiveUser(createdUser);
      await syncWishlistFromServer().catch(() => {});

      const pending = executePendingWishlistIfAny();
      let dest: string;
      if (pending.executed) {
        dest = pending.returnUrl || (createdUser.role === 'CUSTOMER' ? '/' : getUserDashboardPath(createdUser));
      } else if (createdUser.role === 'CUSTOMER') {
        dest = returnUrl || '/';
      } else {
        dest = getUserDashboardPath(createdUser);
      }

      router.replace(dest);
    } catch (e: any) {
      console.warn('Neon DB registration call error:', e);
      setError(e?.message || 'Database connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] text-[#101828] font-sans flex flex-col">
      {/* V2 Green Curved Header */}
      <header className="bg-[#0B6B4F] text-white pt-4 pb-12 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-[640px] mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center cursor-pointer"
              title="Go Back"
              aria-label="Back"
            >
              <ChevronLeft className="w-4.5 h-4.5 shrink-0" />
            </button>

            <label className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-white" />
              <select
                aria-label="Language"
                value={lang}
                onChange={(e) => setLang(e.target.value as SupportedLang)}
                className="border-0 outline-none bg-transparent font-semibold text-white cursor-pointer text-xs [&>option]:text-slate-900"
              >
                <option value="en">English</option>
                <option value="ur">English + اردو</option>
                <option value="ar">English + العربية</option>
                <option value="de">English + Deutsch</option>
              </select>
            </label>
          </div>

          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-2 text-white">
              <span className="w-7 h-7 rounded-lg bg-white text-[#0B6B4F] flex items-center justify-center font-heading font-extrabold text-sm shadow-xs">
                S
              </span>
              <span className="font-heading font-extrabold text-base tracking-tight">SafarPK</span>
            </Link>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              {accountType === 'customer' ? 'Create your account' : 'Grow with SafarPK'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100">
              {accountType === 'customer'
                ? 'Book cars, drivers & rides in minutes.'
                : 'List your service. Get leads directly in App Chat & WhatsApp.'}
            </p>
          </div>
        </div>
        <MobilePullToRefresh />
        <OfflineStatusBanner />
      </header>

      {/* Main Overlapping Card */}
      <main className="flex-1 px-3 sm:px-4 -mt-7 pb-10 flex justify-center items-start relative z-10">
        <form
          onSubmit={handleRegister}
          className="w-full max-w-[640px] bg-white border border-[#E6ECE8] rounded-[28px] p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 shadow-[0_12px_32px_rgba(16,24,40,0.08)]"
        >

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

                {/* City (Full country list for Customers; Admin-enabled cities only for Partners) */}
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between gap-2">
                    <span>
                      {selectedRole === 'CUSTOMER' ? T.yourCity.en : T.operatingCity.en}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9F3EE] text-[#0B6B4F]">
                      {selectedRole === 'CUSTOMER'
                        ? 'All Cities Open'
                        : cityPolicy.partnerCityMode === 'ALL'
                        ? 'All Country Cities'
                        : `${partnerAllowedCities.length} Admin-Allowed`}
                    </span>
                  </span>
                  <select
                    required
                    value={city === '__OTHER__' ? '__OTHER__' : (availableCitiesForRole.includes(city) ? city : availableCitiesForRole[0] || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__OTHER__') {
                        setCity('__OTHER__');
                      } else {
                        setCity(val);
                        setCustomCustomerCity('');
                      }
                    }}
                    className="h-11 border border-[#D0D5DD] rounded-xl px-3 text-sm font-semibold outline-none focus:border-[#0B6B4F] bg-white"
                  >
                    {availableCitiesForRole.map((cName) => (
                      <option key={cName} value={cName}>
                        {cName}
                      </option>
                    ))}
                    {selectedRole === 'CUSTOMER' && (
                      <option value="__OTHER__">Other City (Enter Manually)</option>
                    )}
                  </select>
                  {selectedRole === 'CUSTOMER' && city === '__OTHER__' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter your city or town name"
                      value={customCustomerCity}
                      onChange={(e) => setCustomCustomerCity(e.target.value)}
                      className="h-11 mt-1 border border-[#D0D5DD] rounded-xl px-3 text-sm font-semibold outline-none focus:border-[#0B6B4F]"
                    />
                  )}
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

                {/* Phone (+92 Default, Auto Zero-Stripping & WhatsApp Verification) */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold text-[#344054] flex items-center justify-between">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>{T.phone.en}</span>
                      {phoneVerified ? (
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-700" /> Verified
                        </span>
                      ) : !waOtpRequired ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Direct Registration Active
                        </span>
                      ) : null}
                    </span>
                    {lang !== 'en' && (
                      <span className="text-[11px] font-semibold text-emerald-700" dir={lang === 'ur' || lang === 'ar' ? 'rtl' : 'ltr'}>
                        {T.phone[lang]}
                      </span>
                    )}
                  </span>

                  <div className="flex items-stretch gap-2">
                    <div className={`flex flex-1 items-center h-11 border rounded-xl overflow-hidden bg-white transition ${
                      phoneLocked ? 'bg-slate-100 border-slate-200' : 'border-[#D0D5DD] focus-within:border-[#0B6B4F] focus-within:ring-2 focus-within:ring-[#0B6B4F]/20'
                    }`}>
                      {/* Fixed +92 Pakistan prefix */}
                      <div className="h-full px-3 bg-slate-50 border-r border-slate-200 flex items-center gap-1.5 shrink-0 text-slate-700 font-bold text-xs select-none">
                        <span>🇵🇰</span>
                        <span>+92</span>
                      </div>

                      <input
                        type="tel"
                        required
                        disabled={phoneLocked}
                        readOnly={phoneLocked}
                        placeholder="300 1234567"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full h-full px-3 text-sm font-mono font-semibold outline-none ${
                          phoneLocked ? 'bg-slate-100 text-slate-700 cursor-not-allowed select-none' : 'text-[#101828]'
                        }`}
                      />
                    </div>

                    {/* WhatsApp OTP Verification Trigger - Conditional based on Super Admin toggle */}
                    {waOtpRequired ? (
                      !phoneLocked ? (
                        <button
                          type="button"
                          disabled={!sanitizePakistaniPhone(phone).isValid || isCheckingPhone || Boolean(phoneRegisteredError)}
                          onClick={handleOpenOtpModal}
                          className="px-3.5 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                          title={phoneRegisteredError ? 'Phone number already registered' : 'Verify via authentic WhatsApp OTP'}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>{isCheckingPhone ? 'Checking...' : 'Verify WA'}</span>
                        </button>
                      ) : (
                        <div className="px-3 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1 shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      )
                    ) : (
                      /* When WA OTP is disabled by Super Admin, show subtle ready status when valid */
                      sanitizePakistaniPhone(phone).isValid && !phoneRegisteredError && (
                        <div className="px-3.5 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">Ready</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Inline phone already-registered warning banner */}
                  {phoneRegisteredError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-rose-900 leading-snug">{phoneRegisteredError}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Link
                            href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
                            className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 underline text-xs"
                          >
                            <span>Sign in to your account instead</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                disabled={loading || Boolean(phoneRegisteredError)}
                className="w-full h-12 sm:h-14 px-6 rounded-xl sm:rounded-2xl bg-[#0B6B4F] hover:bg-[#08513C] text-white font-heading font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99] mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Link
              href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
              className="font-extrabold text-[#0B6B4F] hover:underline ml-1"
            >
              {T.signIn.en}
              {lang !== 'en' && ` (${T.signIn[lang]})`}
            </Link>
          </div>
        </form>
      </main>

      {/* WhatsApp OTP Verification Modal */}
      <WhatsAppOtpModal
        isOpen={isOtpModalOpen}
        phone={phone}
        onClose={() => setIsOtpModalOpen(false)}
        onVerified={handlePhoneVerified}
      />
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
