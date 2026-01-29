# 5thVital Admin Dashboard

A production-ready Next.js admin dashboard for managing 5thVital website content.

## Features

- **Role-Based Access Control (RBAC)**: super_admin, editor, viewer
- **Secure Authentication**: Supabase Auth with server-side protection
- **Dashboard**: Overview with stats and quick actions
- **Leads Management**: View, edit status, and add notes to leads
- **Pages CMS**: Edit website pages with JSON content editor
- **Media Library**: Browse uploaded media files
- **Settings**: Manage site configuration (super_admin only)
- **User Management**: Add/remove admins and change roles (super_admin only)

## Tech Stack

- **Framework**: Next.js 14+ with App Router (TypeScript)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **Auth**: Server-side authentication with middleware protection

## Prerequisites

Before running the project, ensure you have:

1. Node.js 18+ installed
2. A Supabase project with the following tables:
   - `public.admins` - Admin users with roles
   - `public.pages` - Website pages content
   - `public.leads` - Contact form submissions
   - `public.media` - Media files metadata
   - `public.settings` - Site configuration

### Required Supabase Tables Schema

```sql
-- Admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own admin record
CREATE POLICY "Users can read own admin record" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Allow super_admins to manage all admin records
CREATE POLICY "Super admins can manage all" ON public.admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Pages table
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  source TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'closed')),
  notes TEXT,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Media table
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Settings table
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
```

### RLS Policies for Tables

Add appropriate RLS policies for your tables. Admin users should be able to read/write based on their role:

```sql
-- Example policies for pages (adjust for other tables)
CREATE POLICY "Admins can read pages" ON public.pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors and super_admins can modify pages" ON public.pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'editor')
    )
  );
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Installation & Running Locally

1. **Clone the repository** (if not already done)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Create your first admin user**:
   - Create a user in Supabase Auth (via Supabase dashboard)
   - Insert a record in `public.admins` table:
     ```sql
     INSERT INTO public.admins (user_id, email, role)
     VALUES ('your-auth-user-uuid', 'admin@example.com', 'super_admin');
     ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Setting up Custom Domain (admin.5thvital.com)

1. In Vercel dashboard, go to your project settings
2. Navigate to "Domains"
3. Add `admin.5thvital.com`
4. Update your DNS records as instructed by Vercel:
   - Add a CNAME record: `admin` → `cname.vercel-dns.com`
   - Or add an A record pointing to Vercel's IP

## User Roles

| Role | Dashboard | Leads | Pages | Media | Settings | Users |
|------|-----------|-------|-------|-------|----------|-------|
| **viewer** | View | View | View | View | View | ❌ |
| **editor** | View | Edit | Edit | View | View | ❌ |
| **super_admin** | View | Edit | Edit | View | Edit | Manage |

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── layout.tsx        # Dashboard layout with auth check
│   │   ├── page.tsx          # Dashboard home
│   │   ├── leads/            # Leads management
│   │   ├── pages/            # CMS pages
│   │   │   └── [slug]/       # Page editor
│   │   ├── media/            # Media library
│   │   ├── settings/         # Site settings
│   │   └── users/            # Admin management
│   ├── login/                # Login page
│   ├── globals.css           # Global styles
│   └── layout.tsx            # Root layout
├── components/
│   └── layout/               # Layout components
│       ├── Sidebar.tsx
│       ├── TopBar.tsx
│       ├── AdminLayout.tsx
│       └── NotAuthorized.tsx
├── lib/
│   ├── supabase/             # Supabase clients
│   │   ├── browser.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── auth/                 # Auth helpers
│   │   ├── getAdmin.ts
│   │   └── requireAdmin.ts
│   └── types.ts              # TypeScript types
├── middleware.ts             # Route protection
└── README.md
```

## Security Considerations

- All routes are protected by middleware checking for authenticated session
- Admin role is verified server-side on every page load
- RLS policies should be configured in Supabase for additional security
- Never expose service role key in the client

## Development Checklist

- [ ] Set up Supabase project
- [ ] Create required database tables
- [ ] Configure RLS policies
- [ ] Add environment variables
- [ ] Create first super_admin user
- [ ] Test all routes and permissions
- [ ] Deploy to Vercel
- [ ] Configure custom domain

## Troubleshooting

### "Not Authorized" after login
- Ensure the user exists in `public.admins` table with matching `user_id`
- Check that RLS policies allow reading from the admins table

### Login not working
- Verify Supabase URL and anon key are correct
- Check Supabase Auth settings allow email/password sign-in

### Database operations failing
- Review RLS policies for the affected table
- Ensure the admin's role has appropriate permissions

## License

MIT
