# Security Guidelines

## 🔒 Environment Variables

### ✅ Safe Practices
- **.env.local** is in `.gitignore` - ✅ NEVER commit this file
- All sensitive keys use `process.env` variables
- No hardcoded secrets in source code

### 🚨 Danger Zones
These environment variables contain sensitive information and should NEVER be committed:

- `MONGODB_URI` - Database connection string with credentials
- `CLERK_SECRET_KEY` - Server-side authentication secret
- `CLOUDINARY_API_SECRET` - Image upload service secret

### 🟡 Public Variables (Safe to expose)
These are prefixed with `NEXT_PUBLIC_` and are safe to be seen by users:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Client-side authentication
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Public cloud identifier
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Public URLs

## 🛡️ Pre-commit Checklist

Before pushing to GitHub:

1. ✅ Check `git status` - ensure `.env.local` is not listed
2. ✅ Verify `.gitignore` contains `.env*`
3. ✅ No API keys hardcoded in source files

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate all exposed API keys**
2. **Remove from git history**: `git filter-branch` or BFG Repo-Cleaner
3. **Force push**: `git push --force-with-lease`
4. **Update all deployment environments**

## 🔍 Tools to Help

- **GitHub Secret Scanning** - Automatically detects common secrets
- **GitGuardian** - Real-time secret detection
- **git-secrets** - Prevents commits with secrets

## 📋 Deployment Security

### Vercel
- Add environment variables in Vercel dashboard
- Never include secrets in `vercel.json`

### Other Platforms
- Use platform-specific environment variable management
- Never hardcode production secrets in code
