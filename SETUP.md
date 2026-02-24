# Church Attendance Platform - Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - **Project Name**: Church Attendance Platform
   - **Database Password**: (Create a strong password and save it)
   - **Region**: Choose closest to your location
5. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
   - **service_role key** (under "Project API keys" → "service_role" - ⚠️ Keep this secret!)

## Step 3: Update Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project root
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see: "Success. No rows returned"

This will create:
- ✅ All tables (branches, members, events, attendance)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions (calculate_age, get_age_group)
- ✅ Views for analytics
- ✅ A default branch

## Step 5: Create Your First Admin User

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click "Add User" → "Create new user"
3. Fill in:
   - **Email**: your.email@example.com
   - **Password**: (Create a strong password)
   - **Auto Confirm User**: ✅ (Check this box)
4. Click "Create user"
5. Save your admin credentials securely

## Step 6: Verify the Setup

1. Go to **Database** → **Tables**
2. You should see these tables:
   - branches
   - members
   - events
   - attendance
3. Click on "branches" and verify one default branch exists

## Step 7: Enable Realtime (Optional but Recommended)

1. Go to **Database** → **Replication**
2. Find the following tables and enable replication:
   - ✅ attendance
   - ✅ events

This enables live updates for attendance tracking.

## Step 8: Start the Development Server

Now you're ready to run the application:

```bash
npm run dev
```

Your application will be available at: http://localhost:3000

## Troubleshooting

### Issue: Environment variables not loading
- Solution: Restart your development server after updating `.env.local`

### Issue: RLS policies blocking requests
- Solution: Make sure you're logged in as an admin user for protected routes

### Issue: Cannot insert data
- Solution: Check the browser console for specific error messages and verify RLS policies

## Next Steps

After setup is complete:

1. **Login as Admin**: Navigate to `/login` and use your admin credentials
2. **Create Branches**: Add your church branches
3. **Add Members**: Start adding members manually or test self-registration
4. **Create Events**: Create your first event and generate QR code
5. **Test Check-in**: Use the QR code to test the check-in flow

## Security Reminders

- ⚠️ **NEVER** commit `.env.local` to version control
- ⚠️ Keep your `service_role` key secret
- ⚠️ The `anon` key is safe to expose in your frontend
- ⚠️ Always use HTTPS in production

## Need Help?

If you encounter any issues:
1. Check the Supabase logs: **Logs** → **Database**
2. Check browser console for errors
3. Verify your environment variables are correct
4. Ensure the database schema was applied successfully
