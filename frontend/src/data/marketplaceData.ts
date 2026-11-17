export interface VehicleCardItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  specs: string;
  owner: string;
  city: string;
  tint: string;
  image: string;
  category: 'Sedans' | 'SUVs & 4x4' | 'Luxury' | 'Vans & Hiace' | 'Economy';
  contacted?: string;
  phone: string;
  whatsapp: string;
}

export interface DriverCardItem {
  id: string;
  name: string;
  initials: string;
  tint: string;
  exp: string;
  city: string;
  avail: 'Available' | 'Busy' | 'Offline';
  langs: string;
  city12: string;
  city12Num: number;
  out: string;
  monthly: string;
  tags: string[];
  police: boolean;
  category: 'Daily City' | 'Outstation' | 'Monthly' | 'VIP Executive';
  phone: string;
  whatsapp: string;
  contacted?: string;
  cnic?: string; // Verified NADRA CNIC: e.g. '35201-2123456-1'
  licenseNumber?: string; // Verified Driving Licence: e.g. 'LHR-DL-98210'
}

export interface CityRideItem {
  id: string;
  op: string;
  car: string;
  fromCity: string;
  toCity: string;
  bag: string;
  time: string;
  duration: string;
  one: number;
  ret: number;
  ver: boolean;
  tags: string[];
  category: string;
  phone: string;
  whatsapp: string;
  contacted?: string;
  // Seat Sharing & Private Booking Options
  rideType?: 'SEAT_SHARING' | 'FULL_CAR' | 'BOTH';
  availableSeats?: number;
  totalSeats?: number;
  pricePerSeat?: number;
  departureDate?: string;
  departureTime?: string;
  pickupPoint?: string;
  dropPoint?: string;
}

export interface ShuttleItem {
  id: string;
  op: string;
  city: string;
  from: string;
  to: string;
  stops?: string[];
  pick: string;
  back: string;
  van: string;
  days: string;
  seats: number;
  total: number;
  fare: string;
  fareNum: number;
  tags: string[];
  category: 'School & College' | 'Corporate Office' | 'Girls Only' | 'Executive Vanpool';
  phone: string;
  whatsapp: string;
  contacted?: string;
}

export interface MoverItem {
  id: string;
  name: string;
  city: string;
  trucks: string;
  base: string;
  baseNum: number;
  km: string;
  helper: string;
  tags: string[];
  category: 'Suzuki Ravi (Mini)' | 'Shehzore (2.5 Ton)' | 'Mazda (14-17ft)' | 'Office Relocation';
  phone: string;
  whatsapp: string;
  contacted?: string;
}

export const SERVICE_CATEGORIES: Record<number, string[]> = {
  0: ['All cars', 'Sedans', 'SUVs & 4x4', 'Luxury', 'Vans & Hiace', 'Economy'],
  1: ['All drivers', 'Daily City', 'Outstation', 'Monthly', 'VIP Executive'],
  2: [
    'All routes',
    'Seat Sharing (Carpool)',
    'Private Car (Full Vehicle)',
    'Sedans (4 seats)',
    'Hiace (12-14 seats)',
    'SUVs & Fortuner',
  ],
  3: ['All shuttles', 'School & College', 'Corporate Office', 'Girls Only', 'Executive Vanpool'],
  4: ['All movers', 'Suzuki Ravi (Mini)', 'Shehzore (2.5 Ton)', 'Mazda (14-17ft)', 'Office Relocation'],
};

// 1. CAR RENTAL FLEET
export const CARS_DATA: VehicleCardItem[] = [
  {
    id: 'l-1',
    name: 'Honda Civic Oriel Turbo',
    price: 'PKR 12,000',
    priceNum: 12000,
    specs: '2024 · Automatic · Sunroof',
    owner: 'Kashif Motors',
    city: 'Islamabad',
    tint: '#EEF1F4',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    category: 'Sedans',
    contacted: '✓ You sent a request · today',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
  },
  {
    id: 'l-2',
    name: 'Toyota Corolla Altis Grande',
    price: 'PKR 7,500',
    priceNum: 7500,
    specs: '2024 · Automatic · 1.8 CVT',
    owner: 'Zubair Car Rentals',
    city: 'Lahore',
    tint: '#F1EFEA',
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80',
    category: 'Sedans',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
  },
  {
    id: 'l-3',
    name: 'Suzuki Alto VXL AGS',
    price: 'PKR 3,500',
    priceNum: 3500,
    specs: '2024 · Automatic · Fuel Saver',
    owner: 'Ahmed Executive Motors',
    city: 'Karachi',
    tint: '#E8F5E9',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    category: 'Economy',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
  },
  {
    id: 'l-4',
    name: 'Toyota Fortuner Legender',
    price: 'PKR 25,000',
    priceNum: 25000,
    specs: '2024 · 4x4 Automatic · 7 Seats',
    owner: 'Capital Fleet Hub',
    city: 'Islamabad',
    tint: '#F3EEEC',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    category: 'SUVs & 4x4',
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
  },
  {
    id: 'l-5',
    name: 'Mercedes-Benz GLE 450',
    price: 'PKR 45,000',
    priceNum: 45000,
    specs: '2023 · Automatic · VIP Prestige',
    owner: 'Prestige Chauffeur Service',
    city: 'Islamabad',
    tint: '#ECEEF3',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80',
    category: 'Luxury',
    phone: '+92 301 9821045',
    whatsapp: '923019821045',
  },
  {
    id: 'l-6',
    name: 'Toyota HiAce Grand Cabin',
    price: 'PKR 14,000',
    priceNum: 14000,
    specs: '2024 · 14-Seater Dual AC',
    owner: 'Lahore Highway Fleet',
    city: 'Lahore',
    tint: '#EFF1EE',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    category: 'Vans & Hiace',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
  },
  {
    id: 'l-7',
    name: 'Hyundai Tucson AWD',
    price: 'PKR 18,000',
    priceNum: 18000,
    specs: '2024 · Panoramic Sunroof · AWD',
    owner: 'Capital Fleet Hub',
    city: 'Rawalpindi',
    tint: '#FFF3E0',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    category: 'SUVs & 4x4',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
  },
  {
    id: 'l-8',
    name: 'Audi A6 S-Line Matrix',
    price: 'PKR 38,000',
    priceNum: 38000,
    specs: '2023 · Quattro · Executive Leather',
    owner: 'Royal Chauffeur Prestige',
    city: 'Lahore',
    tint: '#EDE7F6',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&auto=format&fit=crop&q=80',
    category: 'Luxury',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
  },
  {
    id: 'l-9',
    name: 'Toyota Yaris ATIV X 1.5',
    price: 'PKR 5,500',
    priceNum: 5500,
    specs: '2024 · Automatic · Push Start',
    owner: 'Indus Velocity Rentals',
    city: 'Karachi',
    tint: '#E0F2FE',
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=800&auto=format&fit=crop&q=80',
    category: 'Sedans',
    phone: '+92 345 8899201',
    whatsapp: '923458899201',
  },
  {
    id: 'l-10',
    name: 'KIA Sportage FWD',
    price: 'PKR 15,000',
    priceNum: 15000,
    specs: '2024 · Automatic · Leather Seats',
    owner: 'KPK Luxury Motors',
    city: 'Peshawar',
    tint: '#FEF3C7',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    category: 'SUVs & 4x4',
    phone: '+92 333 9988776',
    whatsapp: '923339988776',
  },
  {
    id: 'l-11',
    name: 'Suzuki Cultus VXL Auto',
    price: 'PKR 4,000',
    priceNum: 4000,
    specs: '2024 · AGS · Fuel Efficient',
    owner: 'Chenab Drive Hub',
    city: 'Faisalabad',
    tint: '#DCFCE7',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
    category: 'Economy',
    phone: '+92 300 7766554',
    whatsapp: '923007766554',
  },
  {
    id: 'l-12',
    name: 'Toyota Land Cruiser V8 ZX',
    price: 'PKR 60,000',
    priceNum: 60000,
    specs: '2023 · 4x4 · VIP Protocol',
    owner: 'South Punjab VIP Fleet',
    city: 'Multan',
    tint: '#F3E8FF',
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    category: 'Luxury',
    phone: '+92 312 3344556',
    whatsapp: '923123344556',
  },
];

// 2. CHAUFFEURS & DRIVERS
export const DRIVERS_DATA: DriverCardItem[] = [
  {
    id: 'drv-1',
    name: 'Imran Khan',
    initials: 'IK',
    tint: '#FEF3E2',
    exp: '12 years experience',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu, English, Punjabi',
    city12: 'Rs. 2,500',
    city12Num: 2500,
    out: 'Rs. 3,500',
    monthly: 'Rs. 45,000',
    tags: ['M-2 Motorway expert', 'Family & Tourist safe'],
    police: true,
    category: 'Daily City',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
    contacted: '✓ You sent a request · 10 Nov',
    cnic: '35201-2123456-1',
    licenseNumber: 'LHR-DL-98210',
  },
  {
    id: 'drv-2',
    name: 'Waqar Ahmed',
    initials: 'WA',
    tint: '#DDE6F3',
    exp: '8 years experience',
    city: 'Lahore',
    avail: 'Available',
    langs: 'Urdu, Punjabi',
    city12: 'Rs. 2,200',
    city12Num: 2200,
    out: 'Rs. 3,200',
    monthly: 'Rs. 42,000',
    tags: ['VIP Executive', 'Airport Transfers'],
    police: true,
    category: 'VIP Executive',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
    cnic: '35201-8912045-7',
    licenseNumber: 'LHR-LTV-44120',
  },
  {
    id: 'drv-3',
    name: 'Shahzad Ali',
    initials: 'SA',
    tint: '#E6F2EC',
    exp: '15 years experience',
    city: 'Lahore',
    avail: 'Busy',
    langs: 'Urdu, English',
    city12: 'Rs. 3,000',
    city12Num: 3000,
    out: 'Rs. 4,000',
    monthly: 'Rs. 50,000',
    tags: ['Northern Areas expert', 'Automatic & Manual'],
    police: true,
    category: 'Outstation',
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
    cnic: '35202-3312098-3',
    licenseNumber: 'LHR-HTV-81204',
  },
  {
    id: 'drv-4',
    name: 'Muhammad Tariq',
    initials: 'MT',
    tint: '#E0F2FE',
    exp: '10 years experience',
    city: 'Islamabad',
    avail: 'Available',
    langs: 'Urdu, Pashto, English',
    city12: 'Rs. 2,600',
    city12Num: 2600,
    out: 'Rs. 3,800',
    monthly: 'Rs. 48,000',
    tags: ['Murree & Swat certified', 'Diplomatic Enclave approved'],
    police: true,
    category: 'Outstation',
    phone: '+92 301 9821045',
    whatsapp: '923019821045',
    cnic: '35201-4412098-5',
    licenseNumber: 'ISB-DL-49201',
  },
  {
    id: 'drv-5',
    name: 'Kashif Mehmood',
    initials: 'KM',
    tint: '#FCE7F3',
    exp: '7 years experience',
    city: 'Karachi',
    avail: 'Available',
    langs: 'Urdu, Sindhi',
    city12: 'Rs. 2,400',
    city12Num: 2400,
    out: 'Rs. 3,400',
    monthly: 'Rs. 40,000',
    tags: ['Corporate monthly', 'Def & Clifton navigation'],
    police: true,
    category: 'Monthly',
    phone: '+92 345 1122334',
    whatsapp: '923451122334',
    cnic: '42101-5129841-3',
    licenseNumber: 'KHI-DL-12345',
  },
  {
    id: 'drv-6',
    name: 'Gulzar Khan',
    initials: 'GK',
    tint: '#FEF9C3',
    exp: '14 years experience',
    city: 'Peshawar',
    avail: 'Available',
    langs: 'Pashto, Urdu',
    city12: 'Rs. 2,300',
    city12Num: 2300,
    out: 'Rs. 3,500',
    monthly: 'Rs. 42,000',
    tags: ['M-1 Motorway', 'Khyber Pass navigation'],
    police: true,
    category: 'Daily City',
    phone: '+92 333 9988776',
    whatsapp: '923339988776',
    cnic: '17301-3819024-9',
    licenseNumber: 'PWR-DL-84729',
  },
  {
    id: 'drv-7',
    name: 'Abdul Rehman',
    initials: 'AR',
    tint: '#DCFCE7',
    exp: '9 years experience',
    city: 'Rawalpindi',
    avail: 'Available',
    langs: 'Urdu, Pothwari',
    city12: 'Rs. 2,500',
    city12Num: 2500,
    out: 'Rs. 3,600',
    monthly: 'Rs. 46,000',
    tags: ['Twin Cities expert', 'Hospital & School punctuality'],
    police: true,
    category: 'Monthly',
    phone: '+92 300 5544332',
    whatsapp: '923005544332',
  },
  {
    id: 'drv-8',
    name: 'Farhan Saeed',
    initials: 'FS',
    tint: '#F3E8FF',
    exp: '11 years experience',
    city: 'Faisalabad',
    avail: 'Available',
    langs: 'Urdu, Punjabi',
    city12: 'Rs. 2,200',
    city12Num: 2200,
    out: 'Rs. 3,200',
    monthly: 'Rs. 38,000',
    tags: ['Industrial city expert', 'Commercial tours'],
    police: true,
    category: 'Daily City',
    phone: '+92 302 7788990',
    whatsapp: '923027788990',
  },
  {
    id: 'drv-9',
    name: 'Rashid Minhas',
    initials: 'RM',
    tint: '#FFE4E6',
    exp: '16 years experience',
    city: 'Multan',
    avail: 'Available',
    langs: 'Urdu, Saraiki',
    city12: 'Rs. 2,400',
    city12Num: 2400,
    out: 'Rs. 3,400',
    monthly: 'Rs. 40,000',
    tags: ['M-4 Motorway specialist', 'Executive AC comfort'],
    police: true,
    category: 'VIP Executive',
    phone: '+92 300 4433221',
    whatsapp: '923004433221',
  },
];

// 3. INTERCITY CITY-TO-CITY RIDES
export const CITY_RIDES_DATA: CityRideItem[] = [
  {
    id: 'c2c-1',
    op: 'Capital Express Intercity',
    car: 'Toyota Corolla Altis · AC · 4 seats',
    fromCity: 'Lahore',
    toCity: 'Islamabad',
    bag: '2 large bags in trunk',
    time: 'Flexible departure time',
    duration: '4.5 hrs via M-2 Motorway',
    one: 13500,
    ret: 24000,
    ver: true,
    tags: ['Motorway M-2', 'Tolls included', 'Doorstep pickup'],
    category: 'Sedans (4 seats)',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
    contacted: '✓ You sent a request · 10 Nov',
    rideType: 'BOTH',
    pricePerSeat: 2800,
    availableSeats: 2,
    totalSeats: 4,
    departureTime: '08:00 AM & 03:00 PM',
    departureDate: 'Daily',
    pickupPoint: 'Thokar Niaz Baig / Babu Sabu M-2',
    dropPoint: 'Faizabad / Zero Point Islamabad',
  },
  {
    id: 'c2c-khi-hyd-share',
    op: 'Farhan Ahmed (Executive Carpool)',
    car: 'Honda City 1.2 · Chilled AC',
    fromCity: 'Karachi',
    toCity: 'Hyderabad',
    bag: '1 medium bag / backpack per seat',
    time: 'Morning 08:30 AM',
    duration: '2 hrs via M-9 Motorway',
    one: 6500,
    ret: 12000,
    ver: true,
    tags: ['1 Seat Available', 'M-9 Motorway', 'Non-Smoker', 'Chilled AC'],
    category: 'Seat Sharing (Carpool)',
    phone: '+92 312 9988776',
    whatsapp: '923129988776',
    rideType: 'SEAT_SHARING',
    pricePerSeat: 1500,
    availableSeats: 1,
    totalSeats: 3,
    departureTime: '08:30 AM Daily',
    departureDate: 'Today & Tomorrow',
    pickupPoint: 'Maskan Chowrangi, Gulshan / Sohrab Goth M-9',
    dropPoint: 'Latifabad Unit 7 / Hyderabad By-Pass',
  },
  {
    id: 'c2c-5',
    op: 'Sindh Highway Express',
    car: 'Toyota Yaris ATIV · AC · 4 seats',
    fromCity: 'Karachi',
    toCity: 'Hyderabad',
    bag: '3 bags in trunk',
    time: 'Round the clock departures',
    duration: '2.2 hrs via M-9',
    one: 8500,
    ret: 15000,
    ver: true,
    tags: ['Full Private Car', 'M-9 Motorway', 'Doorstep pickup', 'Verified driver'],
    category: 'Private Car (Full Vehicle)',
    phone: '+92 345 8899201',
    whatsapp: '923458899201',
    rideType: 'FULL_CAR',
    availableSeats: 0,
    totalSeats: 4,
    departureTime: 'On-Demand / Flexible',
    departureDate: 'Daily Available',
    pickupPoint: 'Anywhere in Karachi (Doorstep)',
    dropPoint: 'Anywhere in Hyderabad City / Qasim Chowk',
  },
  {
    id: 'c2c-2',
    op: 'Imran Khan Executive Ride',
    car: 'Honda Civic Oriel · AC · 4 seats',
    fromCity: 'Lahore',
    toCity: 'Islamabad',
    bag: '2 large bags',
    time: 'Mornings or afternoons',
    duration: '4.2 hrs via M-2',
    one: 15000,
    ret: 27000,
    ver: true,
    tags: ['Motorway M-2', 'Driver in uniform', 'Speaks English'],
    category: 'Private Car (Full Vehicle)',
    phone: '+92 300 8472910',
    whatsapp: '923008472910',
    rideType: 'FULL_CAR',
    availableSeats: 0,
    totalSeats: 4,
    departureTime: 'Flexible Departure',
    departureDate: 'Daily',
    pickupPoint: 'DHA Phase 5 / Gulberg Lahore',
    dropPoint: 'F-10 / Blue Area Islamabad',
  },
  {
    id: 'c2c-lhr-isb-share',
    op: 'Usman Tariq (Weekend Motorway Share)',
    car: 'Toyota Corolla GLi · AC',
    fromCity: 'Lahore',
    toCity: 'Islamabad',
    bag: '1 trolley bag per passenger',
    time: 'Evening 05:30 PM',
    duration: '4.3 hrs via M-2',
    one: 8000,
    ret: 15000,
    ver: true,
    tags: ['2 Seats Left', 'Family Carpool', 'M-2 Rest Area Stop'],
    category: 'Seat Sharing (Carpool)',
    phone: '+92 301 5566778',
    whatsapp: '923015566778',
    rideType: 'SEAT_SHARING',
    pricePerSeat: 2200,
    availableSeats: 2,
    totalSeats: 4,
    departureTime: '05:30 PM Friday & Sunday',
    departureDate: 'Weekends & Daily',
    pickupPoint: 'Kalma Chowk / Thokar M-2 Entry',
    dropPoint: 'Zero Point / I-8 Markaz Islamabad',
  },
  {
    id: 'c2c-3',
    op: 'Islamabad Travel Line',
    car: 'Toyota HiAce Grand Cabin · AC · 12 seats',
    fromCity: 'Islamabad',
    toCity: 'Lahore',
    bag: 'Roof carrier + 8 large bags',
    time: 'Anytime suitable for group',
    duration: '5 hrs via M-2',
    one: 26000,
    ret: 45000,
    ver: true,
    tags: ['Family / wedding groups', 'Spacious legroom'],
    category: 'Hiace (12-14 seats)',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
    rideType: 'BOTH',
    pricePerSeat: 2500,
    availableSeats: 5,
    totalSeats: 12,
    departureTime: '09:00 AM & 04:00 PM',
    departureDate: 'Daily',
    pickupPoint: 'Faizabad Terminal / Pirwadhai',
    dropPoint: 'Badami Bagh / Thokar Niaz Baig Lahore',
  },
  {
    id: 'c2c-4',
    op: 'Zaidi Executive Rentals',
    car: 'Toyota Fortuner Sigma 4 · AC · 6 seats',
    fromCity: 'Islamabad',
    toCity: 'Peshawar',
    bag: '4 large bags',
    time: 'Instant booking available',
    duration: '2.5 hrs via M-1',
    one: 16000,
    ret: 28000,
    ver: true,
    tags: ['VIP luxury', '4x4 comfort', 'M-1 Motorway'],
    category: 'SUVs & Fortuner',
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
    rideType: 'FULL_CAR',
    availableSeats: 0,
    totalSeats: 6,
    departureTime: 'On-Demand',
    departureDate: 'Daily Available',
    pickupPoint: 'Islamabad Club / Serena Hotel',
    dropPoint: 'Pearl Continental / University Town Peshawar',
  },
  {
    id: 'c2c-isb-pesh-share',
    op: 'Khyber Carpool Link',
    car: 'Honda Civic · AC · 4 seats',
    fromCity: 'Islamabad',
    toCity: 'Peshawar',
    bag: '1 bag per passenger',
    time: 'Morning 09:00 AM',
    duration: '2 hrs via M-1',
    one: 8000,
    ret: 15000,
    ver: true,
    tags: ['1 Seat Available', 'Fast M-1 Motorway', 'AC Music'],
    category: 'Seat Sharing (Carpool)',
    phone: '+92 334 1122334',
    whatsapp: '923341122334',
    rideType: 'SEAT_SHARING',
    pricePerSeat: 1600,
    availableSeats: 1,
    totalSeats: 3,
    departureTime: '09:00 AM Daily',
    departureDate: 'Daily',
    pickupPoint: 'G-9 Karachi Company / Toll Plaza',
    dropPoint: 'Hayatabad Phase 3 / Karkhano Market',
  },
  {
    id: 'c2c-6',
    op: 'Chenab Intercity Travel',
    car: 'Honda City 1.5 Aspire · AC · 4 seats',
    fromCity: 'Faisalabad',
    toCity: 'Lahore',
    bag: '2 bags',
    time: 'Flexible departure',
    duration: '2 hrs via M-3/M-4',
    one: 7000,
    ret: 12500,
    ver: true,
    tags: ['M-3 Motorway', 'Fast connection'],
    category: 'Budget / Economy',
    phone: '+92 300 7766554',
    whatsapp: '923007766554',
    rideType: 'BOTH',
    pricePerSeat: 1300,
    availableSeats: 2,
    totalSeats: 4,
    departureTime: '07:30 AM & 02:00 PM',
    departureDate: 'Daily',
    pickupPoint: 'Gatwala Toll Plaza M-3',
    dropPoint: 'Thokar Niaz Baig / Canal Road Lahore',
  },
  {
    id: 'c2c-7',
    op: 'Saraiki Express Transport',
    car: 'Toyota Corolla GLi · AC · 4 seats',
    fromCity: 'Multan',
    toCity: 'Lahore',
    bag: '3 bags',
    time: 'Morning & evening runs',
    duration: '4 hrs via M-4',
    one: 12000,
    ret: 21000,
    ver: true,
    tags: ['M-4 Motorway', 'Family safe'],
    category: 'Sedans (4 seats)',
    phone: '+92 312 3344556',
    whatsapp: '923123344556',
    rideType: 'BOTH',
    pricePerSeat: 2100,
    availableSeats: 2,
    totalSeats: 4,
    departureTime: '08:30 AM',
    departureDate: 'Daily',
    pickupPoint: 'Chungi No 9 / M-4 Interchange',
    dropPoint: 'Thokar Niaz Baig, Lahore',
  },
  {
    id: 'c2c-8',
    op: 'Khyber Luxury Chauffeur',
    car: 'Toyota Fortuner · AC · 6 seats',
    fromCity: 'Peshawar',
    toCity: 'Islamabad',
    bag: '4 large bags',
    time: 'Round the clock',
    duration: '2 hrs via M-1',
    one: 15000,
    ret: 26000,
    ver: true,
    tags: ['VIP ride', 'Armed escort on request'],
    category: 'SUVs & Fortuner',
    phone: '+92 333 9988776',
    whatsapp: '923339988776',
    rideType: 'FULL_CAR',
    availableSeats: 0,
    totalSeats: 6,
    departureTime: 'Round the clock',
    departureDate: 'Daily',
    pickupPoint: 'Peshawar Cantt / Saddar',
    dropPoint: 'Islamabad F-6 / Blue Area',
  },
];

// Helper functions for Lister-added custom intercity rides
export function getCustomCityRides(): CityRideItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('safarpk_custom_city_rides');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomCityRide(ride: CityRideItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomCityRides();
    const updated = [ride, ...existing.filter((r) => r.id !== ride.id)];
    localStorage.setItem('safarpk_custom_city_rides', JSON.stringify(updated));
    window.dispatchEvent(new Event('safarpk_city_rides_updated'));
  } catch (e) {}
}

export function deleteCustomCityRide(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomCityRides();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem('safarpk_custom_city_rides', JSON.stringify(updated));
    window.dispatchEvent(new Event('safarpk_city_rides_updated'));
  } catch (e) {}
}

// 4. PICK & DROP COMMUTER SHUTTLES
export const CITY_COMMUTE_AREAS: Record<string, string[]> = {
  Karachi: [
    'Gulshan-e-Iqbal',
    'Clifton',
    'DHA (Defence)',
    'Gulistan-e-Johar',
    'I.I. Chundrigar Road',
    'Saddar',
    'North Nazimabad',
    'Malir Cantt',
    'Shahrah-e-Faisal',
    'Federal B Area (FB Area)',
    'Korangi Industrial Area',
    'Bahria Town Karachi',
    'Karachi University / NED',
    'Airport / Star Gate',
    'NIPA',
    'Hassan Square',
    'Tower / Kemari',
    'Nazimabad',
    'PECHS',
    'Gulshan-e-Hadeed',
  ],
  Lahore: [
    'DHA Phase 5 & 6',
    'Gulberg III',
    'Johar Town',
    'Model Town',
    'Bahria Town Lahore',
    'Canal Road',
    'Wapda Town',
    'Faisal Town',
    'Mall Road',
    'Kalma Chowk / IT Park',
    'Cavalry Ground',
    'Thokar Niaz Baig',
    'Punjab University Campus',
    'Allama Iqbal Town',
    'Shadman',
  ],
  Islamabad: [
    'Blue Area',
    'F-10 / F-11 Markaz',
    'F-8 Markaz',
    'F-6 / F-7 Markaz',
    'G-10 / G-11 Markaz',
    'Pak Secretariat',
    'I-8 Markaz',
    'NUST H-12',
    'DHA Phase 2 Islamabad',
    'Bahria Town Phase 1-8',
    'Zero Point',
    'FAST / H-9',
  ],
  Rawalpindi: [
    'Saddar Rawalpindi',
    'Chandni Chowk / Murree Rd',
    'Faizabad Interchange',
    'Adyala Road',
    'Bahria Town Rawalpindi',
    'Chaklala Scheme 3',
    'Peshawar Road',
    'Westridge',
  ],
  Faisalabad: [
    'Kohinoor City',
    'D-Ground People’s Colony',
    'Khurrianwala Industrial Zone',
    'Clock Tower Bazaar',
    'Canal Road',
    'University of Agriculture',
  ],
  Peshawar: [
    'Hayatabad Phase 3',
    'University Town',
    'Saddar Peshawar',
    'Khyber Medical University',
    'Warsak Road',
    'Ring Road',
  ],
};

export function matchesShuttleRoute(
  shuttle: ShuttleItem,
  fromQuery?: string,
  toQuery?: string,
  cityQuery?: string
): boolean {
  if (cityQuery && cityQuery.trim()) {
    const qCity = cityQuery.trim().toLowerCase();
    if (!shuttle.city.toLowerCase().includes(qCity) && !qCity.includes(shuttle.city.toLowerCase())) {
      return false;
    }
  }

  const cleanFrom = (fromQuery || '').trim().toLowerCase();
  const cleanTo = (toQuery || '').trim().toLowerCase();

  // If no specific route search term, matches city
  if (!cleanFrom && !cleanTo) return true;

  // Ordered corridor sequence
  const stopsSequence: string[] = [
    shuttle.from,
    ...(shuttle.stops || []),
    shuttle.to,
  ].map((s) => s.toLowerCase());

  const findStopIndex = (query: string): number => {
    return stopsSequence.findIndex(
      (stop) => stop.includes(query) || query.includes(stop)
    );
  };

  if (cleanFrom && cleanTo) {
    const fromIdx = findStopIndex(cleanFrom);
    const toIdx = findStopIndex(cleanTo);
    // If both stops exist on the route corridor
    if (fromIdx !== -1 && toIdx !== -1) {
      return true;
    }
    return false;
  }

  if (cleanFrom) {
    return findStopIndex(cleanFrom) !== -1;
  }

  if (cleanTo) {
    return findStopIndex(cleanTo) !== -1;
  }

  return true;
}

export const SHUTTLES_DATA: ShuttleItem[] = [
  // --- KARACHI ROUTES ---
  {
    id: 'sht-khi-1',
    op: 'Karachi Coastal Express',
    city: 'Karachi',
    from: 'Malir Cantt',
    to: 'I.I. Chundrigar Road / Tower',
    stops: ['Model Colony', 'Airport / Star Gate', 'Gulshan-e-Iqbal', 'NIPA', 'Hassan Square', 'Shahrah-e-Faisal', 'FTC', 'Saddar', 'I.I. Chundrigar Road'],
    pick: '7:30 AM',
    back: '5:45 PM',
    van: 'Toyota HiAce Grand Cabin · Chilled AC',
    days: 'Mon–Fri',
    seats: 3,
    total: 14,
    fare: 'Rs. 12,500',
    fareNum: 12500,
    tags: ['Corporate Office', 'Bankers & IT Staff', 'Punctual GPS Tracked'],
    category: 'Corporate Office',
    phone: '+92 345 8899201',
    whatsapp: '923458899201',
  },
  {
    id: 'sht-khi-2',
    op: 'Al-Huda Girls Commute',
    city: 'Karachi',
    from: 'Gulshan-e-Iqbal (Block 13D)',
    to: 'Clifton (Do Talwar / Teen Talwar)',
    stops: ['Civic Centre', 'National Stadium', 'Karsaz', 'Shahrah-e-Faisal', 'FTC Flyover', 'DHA Phase 2', 'Clifton'],
    pick: '7:15 AM',
    back: '3:30 PM',
    van: 'Toyota HiAce · AC',
    days: 'Mon–Sat',
    seats: 2,
    total: 14,
    fare: 'Rs. 10,500',
    fareNum: 10500,
    tags: ['Girls Only', 'Female Attendant', 'School & College', 'CCTV on board'],
    category: 'Girls Only',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
  },
  {
    id: 'sht-khi-3',
    op: 'Johar Executive Pool',
    city: 'Karachi',
    from: 'Gulistan-e-Johar (Block 1–15)',
    to: 'Saddar & I.I. Chundrigar Road',
    stops: ['Kamran Chowrangi', 'University Road', 'Samama Shopping Mall', 'NIPA', 'Civic Centre', 'Jail Chowrangi', 'Numaish', 'M.A. Jinnah Road', 'Saddar'],
    pick: '7:40 AM',
    back: '5:30 PM',
    van: 'Suzuki APV GLX · Dual AC',
    days: 'Mon–Fri',
    seats: 4,
    total: 7,
    fare: 'Rs. 11,000',
    fareNum: 11000,
    tags: ['Corporate Office', 'Reserved Seating', 'Executive Vanpool'],
    category: 'Corporate Office',
    phone: '+92 333 1122334',
    whatsapp: '923331122334',
  },
  {
    id: 'sht-khi-4',
    op: 'North Nazimabad Twin Corridors',
    city: 'Karachi',
    from: 'North Nazimabad (Five Star)',
    to: 'DHA Phase 5 & 6',
    stops: ['KDA Chowrangi', 'Nazimabad 7', 'Liaquatabad 10', 'Guru Mandir', 'PECHS', 'Shahrah-e-Faisal', 'Baloch Colony Bridge', 'DHA Phase 2', 'DHA Phase 6'],
    pick: '7:20 AM',
    back: '5:45 PM',
    van: 'Toyota Coaster Saloon · AC',
    days: 'Mon–Fri',
    seats: 5,
    total: 22,
    fare: 'Rs. 11,500',
    fareNum: 11500,
    tags: ['Corporate & Executive', 'Wide Reclining Seats', 'GPS Live Tracking'],
    category: 'Executive Vanpool',
    phone: '+92 300 8877665',
    whatsapp: '923008877665',
  },
  {
    id: 'sht-khi-5',
    op: 'Bahria Town Karachi Fast Link',
    city: 'Karachi',
    from: 'Bahria Town Karachi (Main Gate)',
    to: 'Shahrah-e-Faisal & FTC',
    stops: ['Toll Plaza M-9', 'Safoora Goth', 'Malir Cantt Checkpost', 'Airport', 'Karsaz', 'Shahrah-e-Faisal', 'FTC'],
    pick: '7:00 AM',
    back: '6:15 PM',
    van: 'Toyota HiAce Grand Cabin · AC',
    days: 'Mon–Fri',
    seats: 4,
    total: 14,
    fare: 'Rs. 14,000',
    fareNum: 14000,
    tags: ['Corporate Office', 'High-Speed Express', 'Highway Commuter'],
    category: 'Corporate Office',
    phone: '+92 302 9988776',
    whatsapp: '923029988776',
  },
  {
    id: 'sht-khi-6',
    op: 'Federal B University Shuttle',
    city: 'Karachi',
    from: 'Federal B Area (Water Pump)',
    to: 'Karachi University / NED University',
    stops: ['Aisha Manzil', 'Yaseenabad', 'Mukka Chowk', 'Sohrab Goth', 'Maskan Chowrangi', 'KU Silver Jubilee Gate', 'NED Gate 1'],
    pick: '7:45 AM',
    back: '2:30 PM',
    van: 'Toyota HiAce · AC',
    days: 'Mon–Sat',
    seats: 3,
    total: 14,
    fare: 'Rs. 7,500',
    fareNum: 7500,
    tags: ['School & College', 'University Pass', 'Student Special'],
    category: 'School & College',
    phone: '+92 313 5544332',
    whatsapp: '923135544332',
  },

  // --- LAHORE ROUTES ---
  {
    id: 'sht-1',
    op: 'Noor Shuttles',
    city: 'Lahore',
    from: 'DHA Phase 5 & 6',
    to: 'Gulberg III (Main Boulevard)',
    stops: ['DHA Phase 5', 'DHA Phase 6', 'Bedian Road', 'Walton Road', 'Cavalry Ground', 'Main Boulevard', 'Gulberg III'],
    pick: '7:10 AM',
    back: '2:15 PM',
    van: 'Toyota HiAce · AC',
    days: 'Mon–Sat',
    seats: 2,
    total: 14,
    fare: 'Rs. 9,500',
    fareNum: 9500,
    tags: ['School & College', 'Girls only', 'Female attendant on board'],
    category: 'Girls Only',
    phone: '+92 300 9876543',
    whatsapp: '923009876543',
    contacted: '✓ You sent a request · 9 Nov',
  },
  {
    id: 'sht-2',
    op: 'Metro Executive Pick & Drop',
    city: 'Lahore',
    from: 'Johar Town / Wapda Town',
    to: 'Gulberg & Kalma Chowk IT Park',
    stops: ['Johar Town G-1', 'Doctor Hospital', 'Wapda Town Roundabout', 'Faisal Town', 'Model Town Link Rd', 'Kalma Chowk', 'Gulberg III'],
    pick: '8:00 AM',
    back: '5:30 PM',
    van: 'Suzuki APV GLX · Dual AC',
    days: 'Mon–Fri',
    seats: 4,
    total: 7,
    fare: 'Rs. 11,000',
    fareNum: 11000,
    tags: ['Corporate Office', 'Executive seats', 'Punctual GPS tracked'],
    category: 'Corporate Office',
    phone: '+92 321 8877665',
    whatsapp: '923218877665',
  },
  {
    id: 'sht-3',
    op: 'Safe Ride School Vans',
    city: 'Lahore',
    from: 'Bahria Town Lahore',
    to: 'Canal Road / Thokar Universities',
    stops: ['Bahria Town Safari', 'Sector C Commercial', 'Canal Road', 'Thokar Niaz Baig', 'Doctors Hospital', 'Punjab University Campus'],
    pick: '6:55 AM',
    back: '1:45 PM',
    van: 'Toyota HiAce Grand Cabin · AC',
    days: 'Mon–Sat',
    seats: 3,
    total: 14,
    fare: 'Rs. 10,000',
    fareNum: 10000,
    tags: ['University students', 'Live WhatsApp updates'],
    category: 'School & College',
    phone: '+92 333 4455667',
    whatsapp: '923334455667',
  },

  // --- ISLAMABAD / RAWALPINDI ROUTES ---
  {
    id: 'sht-4',
    op: 'Capital Commuters',
    city: 'Islamabad',
    from: 'F-10 & F-11 Markaz',
    to: 'Blue Area & Secretariat',
    stops: ['F-11 Markaz', 'F-10 Roundabout', 'G-10', 'G-9 Peshawar Morr', 'Blue Area Kulsum Plaza', 'Stock Exchange', 'Pak Secretariat'],
    pick: '8:15 AM',
    back: '5:00 PM',
    van: 'Toyota HiAce · AC',
    days: 'Mon–Fri',
    seats: 5,
    total: 14,
    fare: 'Rs. 8,500',
    fareNum: 8500,
    tags: ['Government & Corporate', 'Comfortable recliner seats'],
    category: 'Corporate Office',
    phone: '+92 301 9821045',
    whatsapp: '923019821045',
  },
  {
    id: 'sht-5',
    op: 'Rawalpindi Twin Link',
    city: 'Rawalpindi',
    from: 'Saddar Rawalpindi',
    to: 'Air University / NUST H-12',
    stops: ['Saddar Metro', 'Mareer Chowk', 'Chandni Chowk', 'Faizabad', 'I-8 Signal', 'Zero Point', 'H-9/H-12 NUST Gate'],
    pick: '7:30 AM',
    back: '4:30 PM',
    van: 'Toyota Coaster Saloon · AC',
    days: 'Mon–Fri',
    seats: 6,
    total: 22,
    fare: 'Rs. 9,000',
    fareNum: 9000,
    tags: ['Student monthly pass', 'Air conditioned luxury'],
    category: 'Executive Vanpool',
    phone: '+92 300 5544332',
    whatsapp: '923005544332',
  },

  // --- FAISALABAD & PESHAWAR ---
  {
    id: 'sht-7',
    op: 'Faisalabad Textile Pool',
    city: 'Faisalabad',
    from: 'Kohinoor City',
    to: 'Khurrianwala Industrial Zone',
    stops: ['Kohinoor 1', 'D-Ground', 'Jaranwala Road', 'Gatwala', 'Khurrianwala Interchange'],
    pick: '8:00 AM',
    back: '5:30 PM',
    van: 'Suzuki APV · AC',
    days: 'Mon–Sat',
    seats: 3,
    total: 7,
    fare: 'Rs. 8,000',
    fareNum: 8000,
    tags: ['Factory engineers & managers'],
    category: 'Corporate Office',
    phone: '+92 300 7766554',
    whatsapp: '923007766554',
  },
  {
    id: 'sht-8',
    op: 'Peshawar City Commute',
    city: 'Peshawar',
    from: 'Hayatabad Phase 3',
    to: 'University Town & Saddar',
    stops: ['Phase 3 Chowk', 'Tatara Park', 'Jamrud Road', 'University of Peshawar Gate', 'University Town', 'Khyber Bazaar', 'Saddar'],
    pick: '7:30 AM',
    back: '3:00 PM',
    van: 'Toyota HiAce · AC',
    days: 'Mon–Sat',
    seats: 4,
    total: 14,
    fare: 'Rs. 7,500',
    fareNum: 7500,
    tags: ['College & office routes'],
    category: 'School & College',
    phone: '+92 333 9988776',
    whatsapp: '923339988776',
  },
];

// 5. HOME & OFFICE CARGO MOVERS
export const MOVERS_DATA: MoverItem[] = [
  {
    id: 'mov-1',
    name: 'Al-Makkah Shifting & Transport',
    city: 'Lahore',
    trucks: 'Hyundai Shehzore & Mazda Titan · Covered container',
    base: 'Rs. 4,500',
    baseNum: 4500,
    km: 'Rs. 120/km',
    helper: 'Rs. 1,000/helper',
    tags: ['Furniture blankets included', 'Bed & wardrobe dismantling', 'Trained loaders'],
    category: 'Shehzore (2.5 Ton)',
    phone: '+92 333 5599182',
    whatsapp: '923335599182',
    contacted: '✓ You sent a request · 8 Nov',
  },
  {
    id: 'mov-2',
    name: 'Pak Movers & Packers',
    city: 'Lahore',
    trucks: 'Suzuki Ravi (1 ton) & Shehzore (2.5 ton)',
    base: 'Rs. 3,500',
    baseNum: 3500,
    km: 'Rs. 90/km',
    helper: 'Rs. 900/helper',
    tags: ['Bubble wrap packing', 'Fragile crockery care', 'City & Intercity'],
    category: 'Suzuki Ravi (Mini)',
    phone: '+92 300 1234567',
    whatsapp: '923001234567',
  },
  {
    id: 'mov-3',
    name: 'Executive Relocations Lahore',
    city: 'Lahore',
    trucks: 'Mazda 14ft & 17ft heavy cargo fleet',
    base: 'Rs. 7,000',
    baseNum: 7000,
    km: 'Rs. 150/km',
    helper: 'Rs. 1,200/helper',
    tags: ['Commercial office shifting', 'Direct cargo fleet', 'Hydraulic tail lift'],
    category: 'Mazda (14-17ft)',
    phone: '+92 321 4455667',
    whatsapp: '923214455667',
  },
  {
    id: 'mov-4',
    name: 'City Speed Cargo Delivery',
    city: 'Lahore',
    trucks: 'Suzuki Ravi mini pickup fleet',
    base: 'Rs. 2,500',
    baseNum: 2500,
    km: 'Rs. 75/km',
    helper: 'Rs. 800/helper',
    tags: ['Single room / single item', 'Same day instant moving'],
    category: 'Suzuki Ravi (Mini)',
    phone: '+92 345 8899201',
    whatsapp: '923458899201',
  },
  {
    id: 'mov-5',
    name: 'Islamabad Capital Movers',
    city: 'Islamabad',
    trucks: 'Mazda Titan 16ft & Covered Shehzore',
    base: 'Rs. 5,000',
    baseNum: 5000,
    km: 'Rs. 130/km',
    helper: 'Rs. 1,100/helper',
    tags: ['House moving specialists', 'AC uninstall & reinstall option'],
    category: 'Shehzore (2.5 Ton)',
    phone: '+92 301 9821045',
    whatsapp: '923019821045',
  },
  {
    id: 'mov-6',
    name: 'Rawalpindi Cargo Movers',
    city: 'Rawalpindi',
    trucks: 'Suzuki Ravi & Master Forland 12ft',
    base: 'Rs. 3,800',
    baseNum: 3800,
    km: 'Rs. 95/km',
    helper: 'Rs. 900/helper',
    tags: ['Narrow street specialist', 'Safe lifting equipment'],
    category: 'Suzuki Ravi (Mini)',
    phone: '+92 300 5544332',
    whatsapp: '923005544332',
  },
  {
    id: 'mov-7',
    name: 'Karachi Port Logistics & Movers',
    city: 'Karachi',
    trucks: 'Mazda 18ft Container & Bed Trucks',
    base: 'Rs. 6,500',
    baseNum: 6500,
    km: 'Rs. 140/km',
    helper: 'Rs. 1,200/helper',
    tags: ['Corporate office relocation', 'Heavy safe & server transport'],
    category: 'Office Relocation',
    phone: '+92 345 1122334',
    whatsapp: '923451122334',
  },
  {
    id: 'mov-8',
    name: 'Faisalabad Industrial Cargo',
    city: 'Faisalabad',
    trucks: 'Hyundai Shehzore & Isuzu D-Max',
    base: 'Rs. 4,000',
    baseNum: 4000,
    km: 'Rs. 110/km',
    helper: 'Rs. 950/helper',
    tags: ['Textile yarn & household shifting'],
    category: 'Shehzore (2.5 Ton)',
    phone: '+92 300 7766554',
    whatsapp: '923007766554',
  },
  {
    id: 'mov-9',
    name: 'Multan Safe Shifting',
    city: 'Multan',
    trucks: 'Shehzore 2.5 ton covered',
    base: 'Rs. 3,800',
    baseNum: 3800,
    km: 'Rs. 100/km',
    helper: 'Rs. 900/helper',
    tags: ['Mango crate logistics', 'Furniture packing & moving'],
    category: 'Shehzore (2.5 Ton)',
    phone: '+92 312 3344556',
    whatsapp: '923123344556',
  },
  {
    id: 'mov-10',
    name: 'Peshawar Frontier Movers',
    city: 'Peshawar',
    trucks: 'Suzuki Ravi & Mazda 14ft',
    base: 'Rs. 4,200',
    baseNum: 4200,
    km: 'Rs. 115/km',
    helper: 'Rs. 1,000/helper',
    tags: ['KPK intercity cargo', 'Heavy wooden furniture specialists'],
    category: 'Mazda (14-17ft)',
    phone: '+92 333 9988776',
    whatsapp: '923339988776',
  },
];
