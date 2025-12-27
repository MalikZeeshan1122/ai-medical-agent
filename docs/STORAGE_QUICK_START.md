# 📦 Storage Setup Instructions

## Quick Start (3 Steps)

### Step 1: Get Service Role Key

1. Go to https://supabase.com → Your Project
2. Click **Settings** (gear icon) → **API**
3. Under "Project API keys", copy the **Service Role** key (long secret string)

### Step 2: Add to .env

Open `.env` and add:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Create Buckets

Run one of these commands:

```bash
# Using npm script
npm run create:buckets

# Or directly with Node
node scripts/createStorageBuckets.js
```

**Expected output:**
```
🚀 Creating Supabase Storage Buckets...

📁 Creating medical-documents bucket (private)...
✅ medical-documents created
📁 Creating user-profiles bucket (public)...
✅ user-profiles created

✅ Storage buckets setup complete!
```

---

## What Gets Created

| Bucket | Type | Access | Usage |
|--------|------|--------|-------|
| **medical-documents** | Private | Authenticated users only | Store prescriptions, test reports, medical records |
| **user-profiles** | Public | Anyone can read | Store profile pictures |

---

## File Structure

After creation, files are organized as:

```
medical-documents/
  └── user-123/
      ├── prescription/
      │   ├── 1702200000_rx_001.pdf
      │   └── 1702300000_rx_002.pdf
      ├── test-report/
      │   └── 1702100000_blood_test.pdf
      └── vaccination/
          └── 1702000000_covid_vaccine.pdf

user-profiles/
  ├── profile_user-123.jpg
  └── profile_user-456.png
```

---

## How to Use in Your Code

### Upload a File

```typescript
import { uploadFile } from '@/lib/supabaseStorage'

const file = new File(['content'], 'document.pdf')
await uploadFile('medical-documents', 'user-123/prescription/file.pdf', file)
```

### Get Public URL

```typescript
import { getPublicUrl } from '@/lib/supabaseStorage'

const url = getPublicUrl('user-profiles', 'profile_user-123.jpg')
console.log(url) // https://cdklguvcodbzfemyyadv.supabase.co/storage/v1/object/public/user-profiles/profile_user-123.jpg
```

### Delete a File

```typescript
import { deleteFile } from '@/lib/supabaseStorage'

await deleteFile('medical-documents', 'user-123/prescription/file.pdf')
```

### Use the Upload Component

```typescript
import { MedicalDocumentUpload } from '@/components/MedicalDocumentUpload'

<MedicalDocumentUpload userId={user.id} />
```

---

## Troubleshooting

### ❌ "SUPABASE_SERVICE_ROLE_KEY not found"

**Solution:**
1. Make sure you added the key to `.env`
2. Restart your terminal
3. The key should start with `eyJhbGciOi...` (it's a JWT token)

### ❌ "Already exists" Error

**Solution:** This is expected! It means the buckets were already created. You can safely continue.

### ❌ "Unauthorized" Error

**Solution:**
1. Your Service Role Key might be wrong
2. Get a fresh one from Supabase Settings
3. Make sure you're using the **Service Role** key, not the anon key

### ✅ Manual Creation (If Script Fails)

If the script doesn't work, create buckets manually:

1. Go to https://supabase.com → Your Project
2. Click **Storage** → **Create a new bucket**
3. Name: `medical-documents`
4. Toggle **Public bucket**: OFF
5. Click **Create bucket**
6. Repeat for `user-profiles` with **Public bucket**: ON

---

## Security Notes

🔒 **Keep Service Role Key Secret!**
- Never commit it to Git
- Never share it publicly
- Store it only in `.env` (which is in `.gitignore`)

✅ **Bucket Policies:**
- **medical-documents**: Only authenticated users can access their own files
- **user-profiles**: Public read-only (anyone can view)

---

## Next Steps

1. ✅ Create buckets (you're here!)
2. Add Secrets to Supabase Edge Functions
3. Deploy your app
4. Start uploading documents!
