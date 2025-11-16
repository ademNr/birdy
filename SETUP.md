# Setup Guide for Examly

## Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Up Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in all required values (see below)

3. **Start MongoDB**
   - Local: Make sure MongoDB is running
   - Atlas: Use your connection string

4. **Run the App**
   ```bash
   pnpm dev
   ```

## Environment Variables Required

### MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/examly
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examly
```

### NextAuth
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

### Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Add to `.env.local`:
```env
GEMINI_API_KEY=your-api-key-here
```


## File Upload Directory

The app creates an `uploads/` directory automatically. Make sure the server has write permissions.

## Testing the App

1. Sign up with a valid email and password
2. Sign in with your credentials
3. Upload a PDF, Word, or PowerPoint file
4. Select features to generate
5. Process and view results

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running (local)
- Verify connection string (Atlas)
- Check network/firewall settings


### File Upload Fails
- Check file size (max 50MB)
- Verify file format is supported
- Check `uploads/` directory permissions

### AI Processing Fails
- Verify Gemini API key is correct
- Check API quota/limits
- Ensure file text extraction worked

## Production Deployment

1. Set all environment variables in your hosting platform
2. Build the app: `pnpm build`
3. Start production server: `pnpm start`
4. Consider using:
   - MongoDB Atlas for database
   - Vercel/Netlify for hosting
   - AWS SES or SendGrid for email
   - Cloud storage for file uploads (S3, etc.)

