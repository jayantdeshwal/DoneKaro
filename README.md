🏠 DoneKaro

DoneKaro is a hyper-local service platform connecting residents of Muzaffarnagar with verified electricians, plumbers, carpenters, AC technicians, and painters with 0% commission.

Built with performance, accessibility, and real-world utility in mind, the platform provides a complete end-to-end booking lifecycle, transparent quoting, and passwordless authentication.

✨ Core Features & Flows

The platform is divided into three distinct role-based experiences, all optimized for one-handed mobile use:

🧑‍🔧 For Workers (Service Professionals)

Register as a Worker: Simple onboarding for local tradespeople.

Lead Generation: Receive real-time local service requests.

Smart Quoting System: Submit structured quotes (labor, parts, visiting charges) directly to customers.

Job Management: Track job statuses (Requested ➔ Quote Submitted ➔ Scheduled ➔ Completed).

Mobile-First UX: Streamlined bottom-tab navigation and high-contrast UI for outdoor readability.

👤 For Customers

Browse & Filter: Find local workers by trade and availability.

Effortless Booking: Review worker profiles and request a booking with just a few taps.

Transparent Pricing: Review and approve itemized quotes before work begins.

Real-Time Tracking: View bookings, notifications, profile settings, and payment summaries.

🛡️ For Administrators

Command Center: Full oversight of pending approvals, active jobs, and platform alerts.

Data & Analytics: 14-day booking demand trends and user registration metrics.

High Security: 24-hour JWT-backed session limits with required OTP re-verification for sensitive actions.

🌐 Cross-Platform Features

Localization: Switch seamlessly between English and Hindi (i18n).

🛠️ Technology Stack

Frontend Framework: React 18 with TypeScript

Build Tool: Vite

Styling: Tailwind CSS (Custom Amber Design System, WCAG compliant contrast)

Routing: React Router v6 (with role-based route guards and dynamic layout unmounting)

Backend & Database: Supabase (PostgreSQL)

Authentication: Supabase Auth + Edge Functions (Passwordless OTP via MSG91)

📁 Project Structure

public/       Static assets
src/
  components/ Shared layout
  context/    Local mock application state & global providers
  i18n/       English and Hindi translations
  pages/      Customer, worker, and admin screens
  shared/     Frontend constants and types
  ui/         Reusable interface controls


🚀 Getting Started

Prerequisites

Node.js (v18 or higher)

npm or yarn

A Supabase project

Run Locally

Clone the repository and install dependencies:

git clone https://github.com/yourusername/muzaffarnagar-kaamgar.git
cd muzaffarnagar-kaamgar
npm install


Environment Setup:
Copy .env.example to .env and fill in only the browser-safe Supabase values:

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key


⚠️ SECURITY WARNING: These values come from Supabase Dashboard > Project Settings > API. Never add a service-role key, database password, MSG91 key, or other private secret to a VITE_* variable. Private service credentials are only configured securely as Supabase Edge Function secrets.

Run the Development Server:

npm run dev


Open http://localhost:3000 (or http://localhost:5173 depending on your Vite config).

🔐 Security & Architecture

Passwordless Auth: All users authenticate via robust phone-number validation (+91/10-digit sanitization) leveraging MSG91 through secure Supabase Edge Functions.

Row Level Security (RLS): Strict PostgreSQL RLS policies ensure users can only access their own bookings and profile data.

Progressive Disclosure UI: Dynamic layout rendering ensures complex DOM elements (like global footers) are completely unmounted on worker dashboards to maximize mobile screen real estate and performance.


🌍 Impact

DoneKaro is built specifically for the local economy of Muzaffarnagar, aiming to bridge the gap between digital convenience and traditional daily-wage skilled labor, empowering local workers with digital visibility and reliable income streams.

© 2026 DoneKaro. All rights reserved.
