# Bus Management System - Setup Instructions

## 🚀 Quick Start Guide

Your system has been fixed and is now ready to run! Follow these steps to get everything working.

## 📋 Prerequisites

1. **PostgreSQL Database** installed and running
2. **.NET 8 SDK** installed
3. **Node.js** (version 16 or higher) installed
4. **Supabase Account** (for authentication)

## 🗄️ Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE busmgmt;
   CREATE USER bususer WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE busmgmt TO bususer;
   ```

2. **Update Connection String** in `Backend/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Database=busmgmt;Username=bususer;Password=your_secure_password;Port=5432"
   }
   ```

## 🔑 Supabase Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Get your project URL and anon key

2. **Create Environment File:**
   - Copy `Frontend/env.local.example` to `Frontend/.env.local`
   - Update with your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 🏗️ Backend Setup

1. **Navigate to Backend Directory:**
   ```bash
   cd Backend
   ```

2. **Restore NuGet Packages:**
   ```bash
   dotnet restore
   ```

3. **Run Database Migrations:**
   ```bash
   dotnet ef database update
   ```

4. **Start Backend:**
   ```bash
   dotnet run
   ```
   
   The backend will start on `https://localhost:7001` and `http://localhost:5000`

## 🎨 Frontend Setup

1. **Navigate to Frontend Directory:**
   ```bash
   cd Frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start Frontend:**
   ```bash
   npm start
   ```
   
   The frontend will start on `http://localhost:3000`

## 🌐 Access the System

1. **Open Browser:** Navigate to `http://localhost:3000`
2. **You should see:** The main entry page with booking and login forms
3. **Test Features:**
   - Public booking form (no login required)
   - Staff login system
   - Role-based dashboards

## 🔧 Troubleshooting

### Backend Won't Start
- Check PostgreSQL connection string
- Ensure .NET 8 SDK is installed
- Check port availability (5000, 7001)

### Frontend Won't Display
- Verify `.env.local` file exists with correct Supabase credentials
- Check browser console for errors
- Ensure backend is running

### Database Issues
- Verify PostgreSQL is running
- Check connection string format
- Ensure database `busmgmt` exists

### Supabase Connection Issues
- Verify project URL and anon key
- Check Supabase project status
- Ensure proper CORS settings

## 📱 System Features

✅ **Public Booking System** - Customers can book trips without accounts
✅ **Multi-tenant Architecture** - Separate data for each company
✅ **Role-based Access** - Different dashboards for different user types
✅ **Real-time Updates** - SignalR for live bus tracking
✅ **Payment Integration** - Stripe and PayGate support
✅ **Comprehensive Logging** - Application Insights and ELK stack

## 🎯 User Roles

1. **Developer** - System administration and monitoring
2. **Company Admin** - Company management and settings
3. **Operations Manager** - Fleet and route management
4. **Booking Office** - Customer bookings and payments
5. **Boarding Operator** - Trip execution and passenger management

## 🚨 Important Notes

- **Never commit** `.env.local` files to version control
- **Update payment keys** in `appsettings.json` for production
- **Secure JWT secret** in production environment
- **Enable HTTPS** in production

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console and backend logs
3. Verify all prerequisites are met
4. Ensure all environment variables are set correctly

---

🎉 **Your Bus Management System is now ready to run!** 🎉
