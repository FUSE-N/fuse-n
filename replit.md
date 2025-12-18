# Fuse-IN Project Submission Portal

## Overview
This is a Flask web application for freelance project submissions. It allows clients to submit project requests through a form, which can be saved to Google Sheets and trigger email notifications.

## Project Architecture
- **Framework**: Flask (Python)
- **Server**: Gunicorn (production), Flask dev server (development)
- **Port**: 5000 (bound to 0.0.0.0)

## Key Files
- `app.py` - Main Flask application with routes and business logic
- `templates/` - HTML templates for pages
- `static/` - CSS and static assets
- `assets/` - Images and media files

## Features
- Project submission form (`/start-project`)
- Email notifications (requires MAIL_USERNAME and MAIL_PASSWORD)
- Google Sheets integration (requires `credentials.json`)
- Admin dashboard (`/admin`, `/dashboard`)

## Environment Variables Required
- `MAIL_USERNAME` - Gmail address for sending emails
- `MAIL_PASSWORD` - Gmail app password
- `ADMIN_EMAIL` - Admin email for notifications
- `ADMIN_USER` - Admin login username
- `ADMIN_PASS` - Admin login password
- `APP_SECRET_KEY` - Flask secret key for sessions

## Google Sheets Integration
To enable Google Sheets:
1. Create a Google Cloud service account
2. Download the credentials JSON file as `credentials.json`
3. Create a Google Sheet named "Client_Project_Submissions"
4. Share the sheet with the service account email

## Running Locally
```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port app:app
```

## Recent Changes
- December 18, 2025: Initial Replit setup
  - Added graceful handling for missing Google Sheets credentials
  - Configured for Replit environment
