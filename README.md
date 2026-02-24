# Church Attendance & Analytics Platform

A modern, full-stack church management system built with Next.js, TypeScript, Tailwind CSS, and Supabase. This platform enables centralized member management, QR-based event check-ins, and real-time attendance tracking.

## 🚀 Features (MVP - Phase 1)

### ✅ Completed Features

- **Member Management**
  - Self-registration for new members
  - Phone number validation (prevents duplicates)
  - Admin CRUD operations for member management
  - Member search and filtering by branch

- **Event Management**
  - Create and manage church events
  - Generate unique QR codes for each event
  - Toggle event active/inactive status
  - Real-time attendance tracking

- **QR Check-in System**
  - Mobile-optimized check-in interface
  - Autocomplete member search
  - Duplicate check-in prevention
  - Success confirmation feedback

- **Admin Dashboard**
  - Overview statistics (members, events, attendance)
  - Recent events list with attendance counts
  - Secure admin authentication

- **Multi-branch Support**
  - Branch CRUD operations
  - Branch-based member and event filtering
  - Scalable architecture for multiple locations

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts
- **QR Codes**: qrcode, react-qr-code
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account ([create one here](https://supabase.com))
- npm or yarn package manager

## 🚦 Getting Started

### 1. Clone and Install

The project is already set up with all dependencies installed.

### 2. Set Up Supabase

Follow the detailed instructions in [SETUP.md](./SETUP.md) to:
1. Create a Supabase project
2. Get your API keys
3. Update `.env.local` with your credentials
4. Run the database schema

### 3. Configure Environment Variables

Edit `.env.local` (already created) and replace with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### For Administrators

1. **Login**: Navigate to `/login` with your admin credentials
2. **Manage Branches**: Add church branches in the Branches section
3. **Manage Members**: Add, edit, or delete members
4. **Create Events**: Create events and generate QR codes
5. **Track Attendance**: View real-time attendance during events

### For Church Members

1. **Register**: Visit `/register` to join the church
2. **Check-in**: Scan the QR code at events or use the link
3. **Search**: Find your name and confirm attendance

## 📁 Project Structure

```
church/
├── app/
│   ├── (admin)/              # Protected admin routes
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── members/          # Member management
│   │   ├── events/           # Event management
│   │   ├── branches/         # Branch management
│   │   └── analytics/        # Analytics (Phase 2)
│   ├── (public)/             # Public routes
│   │   ├── checkin/[token]/  # QR check-in page
│   │   └── register/         # Member registration
│   └── login/                # Admin login
├── components/
│   ├── admin/                # Admin components
│   ├── public/               # Public components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── actions/              # Server actions
│   ├── supabase/             # Supabase clients
│   ├── types/                # TypeScript types
│   ├── utils/                # Utility functions
│   └── validations/          # Zod schemas
├── supabase-schema.sql       # Database schema
└── SETUP.md                  # Setup instructions
```

## 🔐 Security Features

- Row Level Security (RLS) policies
- Admin authentication required for protected routes
- Phone number uniqueness validation
- Secure server-side operations
- Environment variable protection

## 📊 Database Schema

The platform uses 4 main tables:

- **branches**: Church locations
- **members**: Church members with registration info
- **events**: Church events with QR tokens
- **attendance**: Check-in records

See `supabase-schema.sql` for the complete schema with indexes, views, and RLS policies.

## 🎯 Key Features Explained

### QR-Based Check-in

1. Admin creates an event → System generates unique QR code
2. QR code displayed at venue
3. Members scan → Land on check-in page
4. Search name → Confirm → Attendance recorded
5. Real-time updates to admin dashboard

### Duplicate Prevention

- Phone numbers are unique per member
- One check-in per member per event
- Database-level constraints enforce uniqueness

### Multi-branch Architecture

- All data is branch-scoped
- Filters available for branch-specific views
- Ready for multi-tenant expansion

## 🚧 Phase 2 Features (Coming Soon)

- [ ] Advanced analytics dashboard with charts
- [ ] Age distribution breakdown
- [ ] Attendance trend forecasting
- [ ] CSV/PDF report exports
- [ ] SMS notifications
- [ ] Member attendance history
- [ ] Geolocation validation

## 🐛 Troubleshooting

**Issue**: Environment variables not loading
- **Solution**: Restart dev server after updating `.env.local`

**Issue**: Supabase connection errors
- **Solution**: Verify your API keys in `.env.local`

**Issue**: Database errors
- **Solution**: Ensure `supabase-schema.sql` was executed successfully

**Issue**: Login not working
- **Solution**: Create admin user in Supabase dashboard (Authentication → Users)

## 📝 Development Notes

### Running in Production

1. Update `NEXT_PUBLIC_APP_URL` in `.env.local`
2. Run `npm run build`
3. Deploy to Vercel/Netlify/your hosting platform
4. Set environment variables in hosting platform
5. Update Supabase allowed redirect URLs

### Adding New Features

- Server actions go in `lib/actions/`
- Components in `components/admin/` or `components/public/`
- Types in `lib/types/`
- Always use TypeScript for type safety

## 🤝 Contributing

This is a private church project. For issues or suggestions, contact the development team.

## 📄 License

Private project - All rights reserved

## 👨‍💻 Developer

Built for church management and community engagement.

---

**Need Help?** Check [SETUP.md](./SETUP.md) for detailed setup instructions or contact your administrator.
