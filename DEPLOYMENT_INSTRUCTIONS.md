# VibeReader Deployment Instructions

## Quick Deployment Checklist

✅ Build is working (verified)
✅ All configuration files ready
✅ Environment variables documented
⏳ Deploy to platform

## Step-by-Step Deployment Guide

### Option 1: Deploy via Bolt.new (Recommended)

1. **In Bolt.new Interface:**
   - Look for a "Deploy" or "Publish" button in the top right
   - Click it to open deployment settings

2. **Configure Environment Variables:**
   - In the deployment settings, add these 5 environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://sjnlagztjtziebnszebl.supabase.co

   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqbmxhZ3p0anR6aWVibnN6ZWJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NjcyOTIsImV4cCI6MjA3ODM0MzI5Mn0.ZQ8YOzo8Ws7V08RDOW7y9v96tdf8Egm_K-qiZAV0sIo

   NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY=AIzaSyACCa-C_eRaK4JJ0kRXT7_aPKYdtFYQKZg

   NEXT_PUBLIC_OPENROUTER_API_KEY=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

   NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY=AIzaSyCNmfofzKfNUm2KF2PsTiqO6_VtZqZPPNU
   ```

3. **Deploy:**
   - Click "Deploy" or "Publish"
   - Wait for the build to complete (usually 2-5 minutes)
   - You'll get a live URL when deployment succeeds

### Option 2: Deploy to Netlify Manually

1. **Go to Netlify:**
   - Visit https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect Repository:**
   - If using Git, connect your repository
   - Or drag and drop your project folder

3. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 20

4. **Environment Variables:**
   - Go to Site settings → Environment variables
   - Add all 5 variables listed above

5. **Deploy:**
   - Click "Deploy site"
   - Monitor the build logs

## What Happens During Deployment

1. **Build Phase:**
   - Dependencies install
   - Next.js compiles your app
   - Static pages generate
   - Environment variables get embedded

2. **Deploy Phase:**
   - Built files uploaded to CDN
   - Your site goes live
   - You get a URL (like: `your-app.netlify.app`)

## After Deployment

### Test Your Deployed App:

1. **Homepage:** Should load with beautiful landing page
2. **Sign Up:** Create a test account
3. **Library:** Add a book to your library
4. **Recommendations:** Test the AI recommendations
5. **Vibe Selector:** Try clicking different vibes

### If Something Doesn't Work:

1. **Check Build Logs:**
   - Look for any errors during deployment
   - Verify all environment variables are set

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for any API errors
   - Verify Supabase connection

3. **Common Issues:**
   - **Database not connecting:** Check Supabase credentials
   - **AI recommendations failing:** Check API keys
   - **Images not loading:** Clear browser cache

## Environment Variables Explained

| Variable | Purpose | Where to Get It |
|----------|---------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database connection | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database authentication | Supabase Dashboard |
| `NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY` | Book search | Google Cloud Console |
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | AI recommendations | OpenRouter.ai |
| `NEXT_PUBLIC_GOOGLE_AI_STUDIO_API_KEY` | Alternative AI | Google AI Studio |

## Files Required for Deployment

✅ `package.json` - Dependencies
✅ `next.config.js` - Next.js configuration
✅ `netlify.toml` - Netlify configuration
✅ `.npmrc` - NPM settings
✅ All source files in `app/`, `components/`, `lib/`

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] All pages accessible
- [ ] Database migrations applied
- [ ] Supabase Row Level Security enabled
- [ ] API keys valid and not rate-limited

## Support

If deployment fails:
1. Check the build logs carefully
2. Verify all 5 environment variables are set correctly
3. Ensure Node.js version is set to 20
4. Try clearing build cache and redeploying

## Security Notes

⚠️ **IMPORTANT:** The API keys shown here are already in your code. For production:
- Rotate API keys if needed
- Set up rate limiting
- Monitor API usage
- Never commit `.env` to version control (it's in `.gitignore`)

Your app is ready to deploy! 🚀
