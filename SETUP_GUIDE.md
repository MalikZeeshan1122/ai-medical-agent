# AI Medical Assistant - Complete Setup Guide

This guide walks you through setting up the AI Medical Assistant from scratch, including local development, deployment, and configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Lovable Cloud Configuration](#lovable-cloud-configuration)
4. [AI Integration Setup](#ai-integration-setup)
5. [Hospital Scraping Configuration](#hospital-scraping-configuration)
6. [Authentication Setup](#authentication-setup)
7. [Storage Configuration](#storage-configuration)
8. [Edge Functions Deployment](#edge-functions-deployment)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher ([Download](https://nodejs.org))
- **Git**: For version control ([Download](https://git-scm.com))
- **Code Editor**: VS Code recommended ([Download](https://code.visualstudio.com))

### Required Accounts
- **Lovable Account**: Sign up at [lovable.dev](https://lovable.dev)
- **GitHub Account** (optional): For code hosting and collaboration

### Optional Services
- **Firecrawl Account**: For enhanced hospital scraping ([firecrawl.dev](https://firecrawl.dev))
- **ScraperAPI Account**: Alternative scraping service ([scraperapi.com](https://scraperapi.com))

## Initial Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd ai-medical-assistant

# Install dependencies
npm install
# or if using Bun
bun install
```

### 2. Verify Installation

```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Check npm version
npm --version

# Verify dependencies installed
ls node_modules  # Should see many packages
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You should see the application running (with connection errors, which we'll fix next).

## Lovable Cloud Configuration

### Understanding Lovable Cloud

Lovable Cloud provides:
- PostgreSQL database
- User authentication
- File storage
- Serverless functions (Edge Functions)
- AI gateway access

### Automatic Configuration

When you open the project in Lovable:

1. **Navigate to your project** in Lovable
2. **Lovable Cloud is already enabled** (indicated by Cloud tab)
3. **Environment variables are auto-configured**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`

### Verify Cloud Configuration

1. Click the **Cloud** tab in Lovable
2. Navigate to **Database** → You should see tables like:
   - profiles
   - appointments
   - medications
   - hospitals
   - doctors
3. Navigate to **Storage** → You should see buckets:
   - patient-avatars
   - doctor-photos

If tables don't exist, the migrations will run automatically on first deployment.

## AI Integration Setup

### Lovable AI Gateway

The AI integration uses Lovable AI Gateway, which is **pre-configured** with Lovable Cloud.

#### Verify AI Integration

1. In Lovable, go to **Settings** → **Integrations**
2. Confirm **Lovable AI** is enabled
3. The `LOVABLE_API_KEY` is automatically set in Edge Function secrets

#### Available AI Models

- `google/gemini-2.5-flash` - Default, balanced performance
- `google/gemini-2.5-pro` - Advanced reasoning
- `google/gemini-3-pro-preview` - Next-gen capabilities
- `openai/gpt-5` - OpenAI flagship
- `openai/gpt-5-mini` - Cost-effective OpenAI
- `openai/gpt-5-nano` - Fastest OpenAI

#### Test AI Integration

1. Sign in to the application
2. Navigate to the Chat page
3. Send a test message: "What is diabetes?"
4. You should receive a streaming AI response

If AI doesn't work:
- Check Edge Function logs in Cloud → Functions → chat
- Verify `LOVABLE_API_KEY` exists in Secrets
- Check Lovable AI credits in Settings → Plans & Credits

## Hospital Scraping Configuration

### Native Scraper (Built-in, Free)

The advanced native scraper works **without any configuration**:
- Automatically used when no API keys are configured
- Supports recursive crawling up to 100 pages
- Extracts metadata, emails, phones
- No rate limits

### Firecrawl Setup (Recommended)

For better scraping results:

1. **Get Firecrawl API Key**:
   - Go to [firecrawl.dev](https://firecrawl.dev)
   - Sign up for an account
   - Navigate to Dashboard → API Keys
   - Copy your API key (starts with `fc-`)

2. **Configure in Application**:
   - Navigate to **Hospitals** page
   - Click **Settings** button (top right)
   - Go to **API Configuration** tab
   - Enter your Firecrawl API key
   - Click **Test Key** to verify
   - Click **Save Settings**

3. **Test Scraping**:
   - Add a test hospital (e.g., Mayo Clinic - https://www.mayoclinic.org)
   - Click **Scrape Website**
   - Wait for completion
   - Click **Preview Content** to see results

### ScraperAPI Setup (Alternative)

Similar process:

1. Get API key from [scraperapi.com](https://scraperapi.com)
2. Configure in Settings → ScraperAPI section
3. Test and save

### Bulk Scraping

Once configured:
1. Select multiple hospitals using checkboxes
2. Click **Scrape Selected** button
3. Monitor progress in toast notifications

## Authentication Setup

### Current Configuration

Authentication is pre-configured with:
- **Email/Password** authentication
- **Auto-confirm email** enabled (for development)
- **Row Level Security** enabled on all user tables

### Customize Authentication

To modify authentication settings:

1. **In Lovable**:
   - Go to Cloud → Authentication → Settings
   - Configure:
     - Email confirmation (on/off)
     - Password requirements
     - Social providers (Google, etc.)

2. **Disable Auto-Confirm** (for production):
   ```sql
   -- Run this migration in Cloud → Database → SQL Editor
   -- This forces email verification
   ALTER TABLE auth.users 
   ADD CONSTRAINT check_email_verified 
   CHECK (email_confirmed_at IS NOT NULL);
   ```

### Test Authentication

1. Sign up with a new email
2. Verify you receive a confirmation email (if auto-confirm disabled)
3. Log in with credentials
4. Verify you can access protected pages (Profile, Appointments, etc.)

## Storage Configuration

### Current Buckets

Two storage buckets are configured:

1. **patient-avatars** (Public)
   - For user profile pictures
   - Public read access
   - User-specific write access

2. **doctor-photos** (Public)
   - For doctor profile images
   - Public read access
   - Authenticated write access

### Verify Storage

1. Go to Cloud → Storage
2. Click on each bucket
3. Verify policies are set correctly

### Test File Upload

1. Navigate to Profile page
2. Click on avatar area
3. Upload an image (< 5MB)
4. Verify image displays correctly

### Add Custom Bucket

If you need additional storage:

```sql
-- Run in Cloud → Database → SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false);

-- Create policy for user access
CREATE POLICY "Users can access their own documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'medical-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Edge Functions Deployment

### Automatic Deployment

Edge Functions deploy automatically when you:
1. Save changes in Lovable
2. Push to GitHub (if connected)

Functions in this project:
- `chat` - AI chat completions
- `scrape-hospital` - Hospital web scraping
- `advanced-scrape` - Advanced native scraping
- `private-ai-chat` - User-specific AI conversations
- `hospital-assistant` - Hospital-specific assistance
- `send-appointment-reminder` - Automated reminders

### Manual Deployment

If functions aren't deployed:

1. In Lovable, go to Cloud → Functions
2. Click on each function
3. Click **Deploy** button
4. Wait for deployment to complete

### Verify Functions

Test each function:

```bash
# Test chat function
curl -X POST https://[your-project-id].supabase.co/functions/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test scraping
curl -X POST https://[your-project-id].supabase.co/functions/v1/advanced-scrape \
  -H "Content-Type: application/json" \
  -d '{"hospitalId":"test","websiteUrl":"https://example.com"}'
```

### View Function Logs

1. Cloud → Functions → [Function Name]
2. Click **Logs** tab
3. View real-time logs and errors

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Visual Regression Tests

```bash
# Run Percy tests (requires PERCY_TOKEN)
npm run test:visual
```

### Manual Testing Checklist

- [ ] Sign up with new account
- [ ] Log in with existing account
- [ ] Update profile information
- [ ] Upload avatar image
- [ ] Send AI chat message
- [ ] Track symptoms
- [ ] Create appointment
- [ ] Add medication
- [ ] Add allergy
- [ ] Browse doctors
- [ ] Add hospital
- [ ] Scrape hospital website
- [ ] View analytics

## Deployment

### Deploy to Lovable

1. **Save all changes** in Lovable editor
2. Click **Publish** button (top right)
3. **Backend deploys immediately** (edge functions, migrations)
4. **Frontend requires update**:
   - Click **Update** in publish dialog
   - Wait for build to complete
   - Verify deployment

### Custom Domain

To use a custom domain:

1. Go to Settings → Domains in Lovable
2. Click **Add Domain**
3. Enter your domain (e.g., medicalassistant.com)
4. Follow DNS configuration instructions:
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: [provided by Lovable]
   ```
5. Wait for DNS propagation (up to 48 hours)
6. SSL certificate auto-provisions

### Self-Hosting

For self-hosting outside Lovable:

1. **Export project** from GitHub
2. **Set up Supabase project**:
   - Create project at [supabase.com](https://supabase.com)
   - Run migrations from `supabase/migrations/`
   - Configure environment variables
3. **Deploy frontend**:
   - Build: `npm run build`
   - Deploy to: Vercel, Netlify, or your hosting
4. **Deploy edge functions**:
   - Use Supabase CLI
   - Deploy: `supabase functions deploy`

See [Self-Hosting Guide](https://docs.lovable.dev/tips-tricks/self-hosting) for details.

## Troubleshooting

### Common Issues

#### Issue: "Failed to fetch"
**Cause**: Lovable Cloud not configured or offline
**Solution**:
1. Verify Cloud is enabled in Lovable
2. Check Cloud status in Settings
3. Restart development server

#### Issue: "Invalid JWT"
**Cause**: Authentication token expired or malformed
**Solution**:
1. Log out and log back in
2. Clear localStorage: `localStorage.clear()`
3. Refresh page

#### Issue: "Permission denied"
**Cause**: Row Level Security blocking access
**Solution**:
1. Verify you're logged in
2. Check RLS policies in Cloud → Database
3. Verify user_id matches auth.uid()

#### Issue: "AI responses not streaming"
**Cause**: Edge function error or LOVABLE_API_KEY missing
**Solution**:
1. Check function logs in Cloud → Functions → chat
2. Verify LOVABLE_API_KEY in Secrets
3. Test function directly with curl

#### Issue: "Scraping fails"
**Cause**: Invalid URL or API key
**Solution**:
1. Verify URL is accessible
2. Test API key with "Test Key" button
3. Check function logs for detailed error

#### Issue: "File upload fails"
**Cause**: Storage bucket policy or file size
**Solution**:
1. Verify file is < 5MB
2. Check storage policies in Cloud → Storage
3. Verify bucket exists

### Debug Tools

**View Console Logs**:
```javascript
// In browser console
localStorage.setItem('debug', 'supabase:*')
```

**Clear All Data**:
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Then refresh page
```

**View Network Requests**:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "supabase" or "functions"

### Get Help

- **Documentation**: [docs.lovable.dev](https://docs.lovable.dev)
- **Discord**: [Lovable Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **GitHub Issues**: Open an issue in this repository
- **Lovable Support**: support@lovable.dev

## Next Steps

After setup:
1. Customize the design system (colors, fonts)
2. Add additional medical features
3. Configure production authentication
4. Set up custom domain
5. Add monitoring and analytics
6. Implement additional AI capabilities

---

**Setup Complete!** 🎉

You now have a fully functional AI Medical Assistant. For feature development, see the main README.md.
