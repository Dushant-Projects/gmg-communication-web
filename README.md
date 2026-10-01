# GMG Store — Setup
live url:https://gmg-communication.vercel.app/
## 1. Install
```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```
<!-- 
## 2. Supabase (after running mobile_store_schema.sql)
- Project Settings > API: copy **Project URL** and **anon public key** into `.env.local`.
  (Never use the service_role key in this app.)
- Authentication > URL Configuration:
  - Site URL: `http://localhost:3000` (change to your Vercel URL for production)
  - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://gmg-communication.vercel.app/auth/callback` -->
<!-- - Authentication > Providers > Email: for a smooth demo you can turn **Confirm email** off.
- Authentication > Providers > Google: paste Google Client ID/Secret.
  In Google Cloud Console add this Authorized redirect URI:
  `https://<your-project-ref>.supabase.co/auth/v1/callback` -->

<!-- ## 3. Make yourself admin
Sign up on /signup, then in Supabase SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';
```
Now /admin works. -->
<!-- 
## 4. Cloudinary
Fill `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
Uploads are signed by `/api/cloudinary/sign` (admin only).

## 5. Deploy (Vercel)
Push to GitHub, import in Vercel, add ALL env vars from `.env.example`
(set `NEXT_PUBLIC_SITE_URL` to the Vercel URL), then add the Vercel callback URL in Supabase.

## Structure
```
src/
  app/            routes (App Router)
  features/       feature-first modules (auth now; catalog, cart, orders, admin next)
  lib/            supabase clients, auth helpers, utils
  proxy.ts        session refresh + route protection (Next.js 16 "proxy")
``` -->
