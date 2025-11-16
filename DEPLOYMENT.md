# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Repository**: Push your code to a repository
3. **MongoDB Database**: Set up a MongoDB database (MongoDB Atlas recommended)
4. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Variables

Set the following environment variables in your Vercel project settings:

### Required Variables

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
NEXTAUTH_SECRET=your-secret-key-here (generate a random string, at least 32 characters)
NEXTAUTH_URL=https://your-app.vercel.app
GEMINI_API_KEY=your-gemini-api-key-here
```

### Optional Variables (for email functionality)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Deployment Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `pnpm build` (or `npm run build`)
   - Output Directory: `.next`
   - Install Command: `pnpm install` (or `npm install`)

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Make sure to set them for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-app.vercel.app`

## Important Notes

- **File Uploads**: The `uploads` folder is not persisted on Vercel. Files are deleted after processing. Consider using a cloud storage service (AWS S3, Cloudinary, etc.) for production.
- **Database**: Make sure your MongoDB Atlas cluster allows connections from Vercel's IP addresses (or set IP whitelist to 0.0.0.0/0 for development).
- **API Routes**: All API routes are serverless functions on Vercel with a 10-second timeout by default. For longer processing times, consider using Vercel Pro or breaking up the work.
- **NextAuth**: Ensure `NEXTAUTH_URL` matches your production domain exactly.

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test user login
- [ ] Test file upload
- [ ] Test material generation
- [ ] Test material sharing
- [ ] Test notifications
- [ ] Verify environment variables are set correctly
- [ ] Check MongoDB connection
- [ ] Verify Gemini API is working

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation passes locally
- Check build logs in Vercel dashboard

### API Routes Not Working
- Verify environment variables are set
- Check MongoDB connection string
- Verify API keys are correct

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set and is at least 32 characters
- Verify `NEXTAUTH_URL` matches your production domain
- Check that cookies are enabled in the browser

## Support

For issues specific to:
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **MongoDB**: [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- **Google Gemini**: [Gemini API Documentation](https://ai.google.dev/docs)

