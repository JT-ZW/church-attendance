# Quick Start Guide

## 🚀 Get Your Church Attendance Platform Running in 15 Minutes

### Step 1: Supabase Setup (5 minutes)

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and strong password
   - Select region closest to you

2. **Get API Keys**
   - Go to Settings → API
   - Copy:
     - Project URL
     - `anon public` key
     - `service_role` key (⚠️ keep secret!)

3. **Update Environment**
   - Open `.env.local` in your project
   - Replace placeholder values with your actual keys

### Step 2: Database Setup (3 minutes)

1. **Run Schema**
   - In Supabase dashboard: SQL Editor → New Query
   - Copy entire content from `supabase-schema.sql`
   - Paste and click "Run"
   - Then run `supabase-guest-attendance.sql`
   - You should see "Success. No rows returned"

2. **Verify Tables**
   - Go to Database → Tables
   - Confirm you see: `branches`, `members`, `events`, `attendance`, `guests`, `guest_attendance`

### Step 3: Create Admin User (2 minutes)

1. **Add Admin**
   - Go to Authentication → Users
   - Click "Add User" → "Create new user"
   - Email: your.email@example.com
   - Password: (strong password)
   - ✅ Check "Auto Confirm User"
   - Click "Create user"

2. **Save Credentials**
   - Write down your admin email and password

### Step 4: Start The App (1 minute)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: First Login & Setup (4 minutes)

1. **Login**
   - Click "Admin Login" on home page
   - Use credentials from Step 3

2. **Create Branch**
   - Go to Branches → Add Branch
   - Name: "Main Branch"
   - Location: "Your church address"

3. **Add Test Member**
   - Go to Members → Add Member
   - Fill in details with your phone number

4. **Create Event**
   - Go to Events → Create Event
   - Title: "Test Service"
   - Select branch and date
   - Click Create

5. **Test QR Check-in**
   - Click QR code icon on the event
   - Open link in phone/new tab
   - Search for your name
   - Confirm check-in
   - ✅ Success!

## 🎉 You're Done!

Your church attendance platform is now fully operational.

## 📝 Next Steps

### Add Real Members

1. **Option A**: Admin bulk entry
   - Go to Members → Add Member
   - Add one by one

2. **Option B**: Self-registration
   - Share: `http://localhost:3000/register`
   - Members register themselves
   - Prevents duplicates via phone validation

### Create Weekly Events

1. Sunday Main Service
2. Midweek Prayer
3. Youth Service
4. Special Events

### Use QR Check-ins

1. Create event before service
2. Download QR code (Events → QR icon → Download)
3. Display on screen/print
4. Members scan and check-in
5. Watch real-time attendance

## 🐛 Common Issues

### "Can't connect to Supabase"
- Check `.env.local` has correct keys
- Restart dev server: `Ctrl+C` then `npm run dev`

### "Login not working"
- Verify admin user exists in Supabase dashboard
- Check "Auto Confirm User" was checked
- Password must be 6+ characters

### "Database errors"
- Re-run `supabase-schema.sql` in SQL Editor
- Check all tables exist in Database → Tables

### "QR link not working"
- Check `NEXT_PUBLIC_APP_URL` in `.env.local`
- For local testing, use: `http://localhost:3000`
- For production, use your domain

## 📱 Mobile Testing

1. Find your computer's local IP (e.g., 192.168.1.100)
2. Update `.env.local`: `NEXT_PUBLIC_APP_URL=http://192.168.1.100:3000`
3. Restart server
4. Access from phone: `http://192.168.1.100:3000`

## 🚀 Going to Production

When ready to deploy:

1. **Choose Hosting** (Vercel recommended for Next.js)
2. **Deploy**
   - Push code to GitHub
   - Connect repo to Vercel
   - Deploy automatically

3. **Set Environment**
   - Add all `.env.local` variables in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to your domain

4. **Update Supabase**
   - Go to Authentication → URL Configuration
   - Add production URL to allowed redirects

5. **Test Everything**
   - Login as admin
   - Create event
   - Test check-in flow

## 💡 Pro Tips

1. **Backup Regularly**: Export data from Database → Backups
2. **Monitor Usage**: Check Supabase dashboard for usage stats
3. **Security**: Never commit `.env.local` to GitHub
4. **Updates**: Keep dependencies updated: `npm audit fix`

## 🆘 Need Help?

- Check Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Review this guide again carefully
- Verify each step was completed

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Admin user created
- [ ] App running locally
- [ ] Can login as admin
- [ ] Branch created
- [ ] Test member added
- [ ] Event created with QR
- [ ] Check-in working

Once all checked, you're ready for Sunday service! 🎉
