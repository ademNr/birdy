# Supabase Storage Setup Guide

This application uses Supabase Storage to store uploaded files, which is necessary for Vercel deployments since Vercel's filesystem is read-only.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. A Supabase project created

## Setup Steps

### 1. Create a Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `documents`
5. Set it to **Private** (files are accessed via service role key)
6. Click **Create bucket**

### 2. Configure Bucket Policies (Optional but Recommended)

For security, you can set up Row Level Security (RLS) policies:

1. Go to **Storage** → **Policies** for the `documents` bucket
2. Add policies to restrict access (or leave it managed by service role key)

### 3. Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (keep this secret!)

### 4. Set Environment Variables

Add these to your `.env.local` file (for local development):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application

## How It Works

1. **Upload**: Files are temporarily stored in `/tmp` (Vercel) or `uploads/` (local), then uploaded to Supabase Storage
2. **Storage**: Files are stored in Supabase Storage bucket `documents` with path: `{userId}/{filename}`
3. **Text Extraction**: Text is extracted during upload and stored in MongoDB
4. **Processing**: The process API uses stored extracted text (no need to download files)
5. **File Access**: If needed, files can be downloaded from Supabase using the stored path

## Storage Structure

```
documents/
  └── {userId}/
      ├── {timestamp}-{random}.pdf
      ├── {timestamp}-{random}.docx
      └── ...
```

## Troubleshooting

### Error: "Supabase is not configured"
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your environment variables
- Restart your development server after adding environment variables
- In Vercel, make sure environment variables are set and you've redeployed

### Error: "Failed to upload file to storage"
- Check that the `documents` bucket exists in Supabase
- Verify the bucket name matches `STORAGE_BUCKET` in `lib/supabase.ts`
- Check that your service role key has the correct permissions
- Check file size limits (Supabase free tier: 50MB per file)

### Files not accessible
- Make sure the bucket is set to **Private** and accessed via service role key
- Check that the file path stored in MongoDB matches the Supabase storage path

## Cost Considerations

- **Supabase Free Tier**: 1GB storage, 2GB bandwidth/month
- **Supabase Pro Tier**: 100GB storage, 200GB bandwidth/month ($25/month)

For most applications, the free tier is sufficient for development and small-scale production use.

