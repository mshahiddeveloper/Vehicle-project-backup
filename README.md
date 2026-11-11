# SafarPK / Global Mobility & Vehicle Rental Marketplace
> **Project Backup**: `Vehicle-project-backup`  
> **Production Status**: Fully Dynamic, Internationalized, Zero-Commission Direct Mobility Platform.

---

## 🌟 Executive Overview

**SafarPK** is a full-stack, enterprise-grade unified vehicle rental, commuter shuttle, chauffeur hire, and cargo shifting marketplace. Designed with a **direct-connect model** (0% platform commissions), it bridges vehicle owners, licensed chauffeurs, corporate commuter operators, and home shifting transporters directly with verified customers.

The platform is built with **full dynamic internationalization**, automatically tailoring its UI, currencies, cities, and listings according to the visitor's geographic location (supporting Pakistan, Germany, United Arab Emirates, United Kingdom, United States, Canada, Saudi Arabia, and global visitors).

---

## 🚀 Key Modules & Feature Highlights

### 1. 🌍 International Multi-Country Architecture
- **Geo-IP Auto-Detection**: Automatically identifies the visitor's country of origin via client-side IP lookup (`https://api.country.is/`), falling back to browser timezone and localStorage.
- **Dynamic Localization**:
  - **Currencies**: Displays native currency symbols (€, £, $, AED, Rs / PKR).
  - **Localized Cities**: City search automatically presents the active country's major hubs (e.g., Berlin, Munich, Frankfurt for Germany; Dubai, Abu Dhabi for UAE; London, Manchester for UK; Lahore, Karachi, Islamabad for Pakistan) plus custom-added cities.
  - **Dynamic Time & Greetings**: Real-time localized greeting based on the visitor's local hour (Morning, Afternoon, Evening, Night) with native time formatting.
  - **Active International Inventory**: Native listings pre-populated across Germany (BMW, Mercedes, Audi, VW, V-Class), UAE (G63 AMG, Land Cruiser), UK (S-Class), USA (Cadillac Escalade), and Pakistan.
- **Country Switcher Modal**: Quick country switcher accessible from the top header with persistent state synchronization.

---

### 2. 🚗 5 Core Mobility Service Verticals
1. **Vehicle Rental (Self-Drive & With Chauffeur)**:
   - Filter by fleet type: *All Fleet, Sedans, SUVs & 4x4, Luxury & VIP, Vans & Hiace, Budget & Compact*.
   - Real-time date selector, city filtering, and keyword search.
   - Comprehensive detail modal with technical specs, fuel type, seating capacity, air conditioning, and handover requirements.
2. **Hire a Driver (Licensed Chauffeurs)**:
   - Hourly booking (with configurable minimum hours), 8-hour, 12-hour, 24-hour, and outstation daily duties.
   - 3-State Availability filter (online chauffeurs highlighted, offline chauffeurs hidden).
3. **City-to-City Intercity Travel**:
   - Fixed-rate intercity routes with designated drivers, departure schedules, and highway safety amenities.
4. **Pick & Drop (Office & University Commuter Shuttles)**:
   - Fixed daily and monthly shared commuter shuttle routes with detailed intermediate boarding stops and scheduled pickup times.
   - Live vacant seats counter with real-time occupancy status (`% Full`).
5. **Home & Cargo Shifting**:
   - Moving trucks (Shehzore, Mazda, Flatbeds) with customizable helper (*mazdoor*) labor add-ons.

---

### 3. 🛡️ Super Admin Master Command Center (`/admin`)
- **Country Verification Policy Switcher**:
  - Configure Driving License & National ID upload policy per country or globally:
    - **`REQUIRED`**: Mandatory file upload with strict document validation.
    - **`OPTIONAL`**: Flexible booking with reminder for in-person document check at handover.
    - **`HIDDEN`**: Completely hides document upload forms for direct instant booking countries.
- **Category Master Switches**:
  - Enable or disable any category (*Car Rental, Hire a Driver, City to City, Pick & Drop, Home Shifting*) globally or per country. Disabled categories are cleanly hidden platform-wide.
- **Subscription Packages & Quotas (Full CRUD)**:
  - Add new subscription packages for listers, drivers, and transport providers.
  - Update monthly pricing in PKR and vehicle quota limits.
  - Enable, disable, or delete subscription tiers.
- **Site-Wide Promotional Announcements**:
  - Broadcast promotional banners, flash discounts, or emergency travel notices.
  - Configurable display styles: **Marquee Ticker**, **Static Header Banner Strip**, or **Welcome Modal Popup**.
- **Multi-Policy & Legal Terms Editor**:
  - Live rich editor for *Mutual Identity Privacy (PECA / ETO guidelines)*, *Zero-Liability & Cash Disclaimers*, *General Terms of Service*, and *Provider Codes of Conduct*.
- **Staff / Agent Governance & RBAC**:
  - Super Admin can create SafarPK employee accounts with granular permissions (`canVerifyCnic`, `canVerifyLicense`, `canEditCustomer`, `canEditLister`, `canCreateLister`, `canCollectCash`, `canApproveListings`).
- **Stealth Anti-Fraud Surveillance Log**:
  - Covert background audit trail tracking every staff agent's transactions.
  - Compares official platform tariffs vs. reported fees to identify undercutting or fraud.
  - Embedded **Payment Proof Slip** inspection modal for complete verification.

---

### 4. 👨‍✈️ Dedicated Driver Dashboard (`/driver`)
- **Real Document Upload & Preview**:
  - Direct file upload for Commercial Driving License and National ID (CNIC / Passport).
  - Instant live image previews (`URL.createObjectURL`) with re-upload and remove triggers.
  - Anti-tamper validation (rejects promotional banners, flyers, and random images).
- **3-State Live Visibility Control**:
  - **`AVAILABLE` (Online)**: Profile and contact number visible on marketplace.
  - **`BUSY` (On Active Trip)**: Status marked on trip.
  - **`OFFLINE` (Hidden)**: Profile completely removed from public search for privacy.
- **Self-Managed Tariffs**:
  - Hourly rate, minimum booking hours, 8-hour shift, 12-hour shift, 24-hour rate, overtime per hour, outstation per day, and night stay allowance.
- **Coverage Cities**:
  - Select operational cities and add custom local cities dynamically.

---

### 5. 🚌 Lister & Provider Control Portals (`/lister` & `/provider`)
- **Fleet Owner (Lister)**:
  - Full CRUD on vehicle listings (edit price, specs, location, and photos).
  - Dedicated chauffeur assignment to vehicles.
  - Customer Vault Inspection (view verified credentials of confirmed bookings).
- **Commuter Route Manager (Provider)**:
  - Add, edit, pause, and delete Pick & Drop commuter routes.
  - Manage intermediate boarding stops with scheduled pickup times.
  - Live Vacant Seats stepper (`- / +`) updating occupancy percentage in real-time.

---

### 6. 🤝 Mutual Trust & Bilateral Security Architecture
- **Statutory Privacy Guarantee**: Customer documents are encrypted and never shown publicly.
- **Bilateral Credential Disclosure**: Upon confirmed booking:
  - **Customer receives**: Vehicle Excise Smart Card, FBR NTN / Business Registration, and assigned driver license details.
  - **Provider receives**: Customer verified driving license and national identity credentials for key handover inspection.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 14](https://nextjs.org/) (App Router, React 18, React Server & Client Components) |
| **Styling & UI** | [Tailwind CSS 3.4](https://tailwindcss.com/), Lucide React Icons |
| **State & Context** | React Context (`CountryContext`, `SettingsContext`), LocalStorage Sync, Custom Event Dispatches |
| **Backend & API** | Node.js, Express / NestJS architecture, REST API |
| **Database & ORM** | PostgreSQL with [Prisma ORM](https://www.prisma.io/) |
| **Language** | TypeScript (Strict type checking, 100% build pass) |

---

## 📁 Repository Directory Structure

```text
vehicle-rental-marketplace/
├── admin/
│   └── settings.json           # Global & per-country configuration schema
├── backend/                    # Backend API service & Prisma schema
│   ├── prisma/
│   │   └── schema.prisma       # Database schema & entity models
│   └── src/
│       ├── modules/            # Domain modules (auth, booking, listing, user, etc.)
│       └── main.ts             # Backend entrypoint
├── frontend/                   # Next.js 14 Web Application
│   ├── public/
│   │   └── countries.json      # Static country specifications & cities
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/          # Super Admin Command Center
│   │   │   ├── agent/          # Field Agent / Staff Portal
│   │   │   ├── customer/       # Customer Booking History & Profile
│   │   │   ├── driver/         # Driver & Chauffeur Dashboard
│   │   │   ├── lister/         # Vehicle Owner & Fleet Management
│   │   │   ├── provider/       # Pick & Drop & Shifting Operator Hub
│   │   │   ├── context/        # CountryContext & SettingsContext
│   │   │   ├── layout.tsx      # Root layout with <Providers>
│   │   │   ├── page.tsx        # Public Homepage & Unified Marketplace
│   │   │   └── providers.tsx   # Client-side context providers wrapper
│   │   ├── components/         # Shared UI components (FeatureToggle, EditDialog)
│   │   ├── data/
│   │   │   └── countries.ts    # Supported countries, currencies, and cities
│   │   └── lib/
│   │       └── api.ts          # API clients, helpers, masks, and formatters
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml          # Containerized local environment
├── .gitignore                  # Git ignore rules
└── README.md                   # Complete documentation
```

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Run Type Checks & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```

### 3. Launch Development / Production Server
```bash
# Production Mode
cd frontend
npm run start

# Dev Mode
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 🔒 License & Copyright
Proprietary software. All rights reserved. Designed and developed for **SafarPK Mobility Systems**.
