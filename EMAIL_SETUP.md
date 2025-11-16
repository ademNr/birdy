# Email Configuration Guide

## Common Issues and Solutions

### Error: "Failed to send verification email"

This error occurs when the SMTP email service is not properly configured. Follow the steps below to fix it.

## Setup Instructions

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Examly" as the name
   - Click "Generate"
   - Copy the 16-character password (no spaces)

3. **Add to `.env.local`**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

### Option 2: Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@outlook.com
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@yahoo.com
```

#### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
SMTP_FROM=your-email@domain.com
```

## Troubleshooting

### 1. Check Environment Variables

Make sure your `.env.local` file exists in the root directory and contains all required variables:

```bash
# Check if file exists
ls .env.local

# Verify variables are set (don't share actual values!)
cat .env.local | grep SMTP
```

### 2. Restart Development Server

After adding/changing environment variables, **restart your Next.js server**:

```bash
# Stop the server (Ctrl+C)
# Then restart
pnpm dev
```

### 3. Check Console Logs

The improved error handling will now show specific error messages. Check your terminal/console for:
- "SMTP is not configured" - Missing environment variables
- "Invalid login" - Wrong credentials
- "Connection timeout" - Network/firewall issue
- Other specific error messages

### 4. Common Gmail Issues

**"Less secure app access" error:**
- Gmail no longer supports this. Use App Passwords instead (see Option 1 above).

**"Username and Password not accepted":**
- Make sure you're using an App Password, not your regular Gmail password
- App passwords are 16 characters with no spaces

**"Connection refused":**
- Check if port 587 is blocked by firewall
- Try port 465 with `secure: true` (update code if needed)

### 5. Test Email Configuration

You can test your email configuration by:
1. Trying to register a new account
2. Check the server console for detailed error messages
3. The error message will now tell you exactly what's wrong

## Production Setup

For production, consider using:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Very affordable)
- **Resend** (Developer-friendly)

These services are more reliable than SMTP and provide better deliverability.

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- Use App Passwords, not regular passwords
- In production, use environment variables from your hosting platform
- Consider using a dedicated email service for better deliverability

