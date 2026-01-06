# Fuse-IN Project Submission Portal

## Overview
This is a comprehensive Flask web application for project submission and client management. It features secure authentication, real-time communication, and a robust, multi-gateway billing system. **Supabase** is used as the unified backend for data storage, real-time chat, and user authentication.

## Project Architecture
- **Framework**: Flask (Python), Jinja2 (Templating)
- **Backend Services**: **Supabase** (PostgreSQL, Auth, Realtime)
- **Payment Gateways**: Stripe, Paystack (Server-side Secure Implementation)
- **Deployment**: Gunicorn (production), Flask dev server (development)
- **Port**: 5000 (bound to 0.0.0.0)

## Key Files
| File | Purpose | Notes |
|------|---------|-------|
| `app.py` | Main Flask application with routes, admin login, and API endpoints | Contains secure payment webhook routes |
| `services.py` | Factory for Data and Email service managers | **Must be updated for Supabase and Payment Gateway SDKs** |
| `templates/` | HTML templates for pages | Uses `components/sidebar.html` for modularity |
| `static/css/layout.css` | Externalized styles for the dashboard layout | Improves page load performance |
| `static/js/supabase_init.js` | Client-side Supabase setup and Auth functions | Handles Google OAuth and email authentication |

## Expanded Features
1. **Secure Admin & User Dashboards:** Separate protected views for clients and the administrator
2. **Unified Project Data:** All project submissions are saved securely to **Supabase PostgreSQL**
3. **Real-Time Chat System (`/messages`):**
   - Allows immediate interaction between clients and the project owner
   - Built using **Supabase Realtime** for instant message delivery
4. **Multi-Gateway Billings System (`/billings`):**
   - Supports payments via **Stripe, Paystack, Mobile Money, and Bank Transfer**
   - All payment verification and secret key usage are handled **server-side** for maximum security
5. **Secure Authentication:** User data and password hashes are managed by Supabase Auth
6. **Email Notifications:** Triggers email alerts for new submissions, payments, and messages

## Environment Variables Required (Updated)
You must configure the following variables in your environment (`.env` file or Replit Secrets):

| Variable | Purpose | Security Note |
|----------|---------|---------------|
| `APP_SECRET_KEY` | Flask secret key for session management | Required |
| **`ADMIN_PASSWORD_HASH`** | **Secure bcrypt hash of the admin password** | **CRITICAL SECURITY FIX** |
| `SUPABASE_URL` | Your project's Supabase URL | Required |
| `SUPABASE_ANON_KEY` | Your project's public key (client-side) | Required |
| **`SUPABASE_SERVICE_KEY`** | Your project's secret key (server-side DB access) | **NEW REQUIREMENT** |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Credentials for sending notification emails | Required for email notifications |
| **`STRIPE_SECRET_KEY`** | Stripe secret key (`sk_live_...`) | **CRITICAL: Server-side ONLY** |
| **`STRIPE_PUBLIC_KEY`** | Stripe publishable key (`pk_live_...`) | Client-side safe |
| **`PAYSTACK_SECRET_KEY`** | Paystack secret key | **CRITICAL: Server-side ONLY** |
| **`PAYSTACK_PUBLIC_KEY`** | Paystack public key | Client-side safe |

## Supabase & Database Setup
The following tables are **required** to support the new features:

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| `projects` | Stores client project submission data | `id`, `user_id`, `status`, `created_at` |
| **`invoices`** | Stores billing records and amounts owed | `id`, `project_id`, `amount`, `status`, `due_date` |
| **`transactions`** | Logs all payment gateway events | `id`, `invoice_id`, `reference`, `gateway`, `status`, `amount` |
| **`messages`** | Stores real-time chat history | `id`, `project_id`, `sender_id`, `content`, `created_at`, `read_status` |

## Payment Integration Flow
Payment processing is handled through secure server-side endpoints in `app.py`:

| Gateway | Server Route | Security Requirement |
|---------|--------------|----------------------|
| **Stripe** | `/api/billing/create-session` | Uses `STRIPE_SECRET_KEY` to create a Checkout Session ID |
| **Stripe Webhook** | `/api/billing/stripe-webhook` | **CRITICAL:** Must verify signature using webhook secret to confirm payment |
| **Paystack** | `/api/billing/verify-paystack` | Uses `PAYSTACK_SECRET_KEY` to verify payment reference |
| **Mobile Money/Bank** | `/api/billing/verify-manual` | Manual verification endpoint for bank transfers |

## Authentication Flow
### Google OAuth Setup
1. **Google Cloud Console Configuration:**
   - Add authorized redirect URIs:
     ```
     https://sefuxvdhfgylmlqdrhoh.supabase.co/auth/v1/callback
     http://localhost:5500/login.html
     https://yourdomain.com/login.html
     ```

### Email/Password Authentication
- Email confirmation required for new signups
- Password reset flow with secure token validation
- Session persistence with automatic token refresh

## Running on Replit

### Prerequisites
- Replit account
- Supabase account and project
- Google OAuth credentials (for Google login)
- Payment gateway accounts (Stripe, Paystack)

### Setup Steps

1. **Fork this repository to Replit**

2. **Configure Environment Variables in Replit Secrets:**
   - Go to Tools → Secrets
   - Add all required environment variables from the table above

3. **Install Dependencies:**
   ```bash
   pip install Flask gunicorn python-dotenv Flask-Mail flask-bcrypt supabase-py stripe paystack
   ```

4. **Initialize Supabase Database:**
   - Create required tables in Supabase (see Database Setup section)
   - Set up Row Level Security (RLS) policies

5. **Run the Application:**
   - Click the **Run** button in Replit
   - The application will start automatically

6. **Access the Application:**
   - Open the generated Replit URL in your browser
   - Admin dashboard: `/admin`
   - User dashboard: `/dashboard`

## Security Considerations
1. **API Keys**: Never expose secret keys in client-side code
2. **Password Storage**: Use bcrypt for password hashing (handled by Supabase)
3. **Session Management**: Implement secure session timeout and validation
4. **CORS**: Configure proper CORS headers for API endpoints
5. **Input Validation**: Validate all user inputs on server side

## Troubleshooting

### Common Issues

1. **Google OAuth redirect errors:**
   - Verify authorized redirect URIs in Google Cloud Console
   - Check Supabase Site URL configuration
   - Clear browser cache and test in incognito mode

2. **Database connection issues:**
   - Verify Supabase URL and service key in Replit Secrets
   - Check network connectivity to Supabase

3. **Payment gateway failures:**
   - Verify API keys are correct and active
   - Check webhook configuration for Stripe/Paystack

4. **Email delivery problems:**
   - Verify SMTP credentials in Replit Secrets
   - Check email service provider limits

## Recent Changes
- **December 2024**: Major update to Supabase integration with advanced features
  - Added real-time chat system using Supabase Realtime
  - Implemented multi-gateway billing system
  - Enhanced security with server-side payment processing
  - Updated authentication flow with Google OAuth support

- **December 18, 2025**: Initial Replit setup
  - Added graceful handling for missing Google Sheets credentials
  - Configured for Replit environment

---
