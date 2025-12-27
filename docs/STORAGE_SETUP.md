# 🔧 Storage Bucket Setup Guide

## Step 1: Get Your Service Role Key

To create storage buckets via command line, you need your Supabase Service Role Key:

1. Go to https://supabase.com
2. Select your project `cdklguvcodbzfemyyadv`
3. Click **Settings** (gear icon)
4. Click **API**
5. Under "Project API keys", find **Service Role** (secret key)
6. Copy the entire key

## Step 2: Add to .env

Add this line to your `.env` file:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6I...
```

⚠️ **IMPORTANT:** Keep this key SECRET! Don't commit it to Git.

## Step 3: Create Buckets

Run this command:

```bash
node scripts/createStorageBuckets.js
```

Or use npm script:

```bash
npm run create:buckets
```

## Alternative: Create Manually in Supabase Dashboard

If the command doesn't work, create buckets manually:

1. Go to https://supabase.com → Your Project
2. Click **Storage** in left sidebar
3. Click **Create a new bucket**
4. Enter name: `medical-documents`
5. Toggle **Public bucket**: OFF (private)
6. Click **Create bucket**
7. Repeat for `user-profiles` with **Public bucket**: ON

## Bucket Structure

After creation, your buckets will look like:

```
medical-documents/
  └── {user-id}/
      ├── prescription/
      ├── test-report/
      └── vaccination/

user-profiles/
  └── profile_{user-id}.jpg
```

## Test Upload

Once buckets are created, test with:

```typescript
import { uploadFile } from '@/lib/supabaseStorage'

const file = new File(['test'], 'test.txt')
await uploadFile('medical-documents', 'test.txt', file)
```

## Troubleshooting

**Error: "SUPABASE_SERVICE_ROLE_KEY not found"**
- Add the key to your `.env` file (see Step 2)

**Error: "Already exists"**
- This is normal! Buckets already exist, which is good.

**Error: "Unauthorized"**
- Your Service Role Key might be incorrect
- Get a fresh one from Supabase Settings → API
