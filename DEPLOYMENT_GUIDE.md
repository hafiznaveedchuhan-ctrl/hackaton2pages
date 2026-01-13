# Full-Stack Deployment Guide

## Overview
This guide helps you deploy the complete full-stack application with:
- **Frontend**: Deployed on GitHub Pages (Next.js Static Export)
- **Backend**: Deployed on Railway
- **Communication**: Frontend calls Backend APIs

---

## Phase 1: Deploy Backend to Railway

### 1. Backend Setup on Railway
1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository (`hackaton2pages`)
4. Select the `Phase-3/backend` directory as the root
5. Add environment variables:
   ```
   DATABASE_URL=<your-db-url>
   JWT_SECRET=<secure-random-string>
   ```
6. Deploy

**After Railway deploys your backend, you'll get a URL like:**
```
https://your-backend.railway.app
```

---

## Phase 2: Update Frontend with Backend URL

### 1. Update Environment Variable
Once you have your Railway backend URL, update the frontend configuration:

**File:** `Phase-3/frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 2. Build Frontend for GitHub Pages
```bash
cd Phase-3/frontend
npm run build
```

---

## Phase 3: Deploy Frontend to GitHub Pages

### 1. Configure next.config.js for GitHub Pages
The frontend needs a static export configuration. Update `Phase-3/frontend/next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/hackaton2pages' : '',
};

module.exports = nextConfig;
```

### 2. Push Changes
```bash
git add .
git commit -m "feat: configure frontend for GitHub Pages deployment"
git push origin feature/connect-railway-backend
```

### 3. Enable GitHub Pages
1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set source to **GitHub Actions**
4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master, main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: cd Phase-3/frontend && npm install

      - name: Build
        run: cd Phase-3/frontend && npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./Phase-3/frontend/out
```

5. Push this workflow file
6. GitHub Actions will automatically build and deploy

---

## Full-Stack URL Structure

After deployment:

| Component | URL |
|-----------|-----|
| Frontend | `https://hafiznaveedchuhan-ctrl.github.io/hackaton2pages/` |
| Backend API | `https://your-backend.railway.app/api/` |
| API Communication | Frontend calls backend via `NEXT_PUBLIC_API_URL` |

---

## Testing Connection

Once both are deployed:
1. Visit frontend URL in browser
2. Check browser console for API calls
3. Verify no CORS errors
4. Test login/dashboard functions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Add frontend URL to backend CORS settings |
| 404 on GitHub Pages | Check `basePath` configuration in next.config.js |
| API calls fail | Verify `NEXT_PUBLIC_API_URL` is correct |
| Build fails | Ensure `output: 'export'` in next.config.js |

---

## Next Steps

1. ✅ Push code to GitHub (DONE)
2. ⏳ Deploy backend to Railway (PENDING)
3. ⏳ Get Railway backend URL
4. ⏳ Update `.env.local` with backend URL
5. ⏳ Deploy frontend to GitHub Pages
6. ⏳ Test full-stack integration

Ready to proceed? 🚀
