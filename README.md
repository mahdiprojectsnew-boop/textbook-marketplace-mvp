# Textbook Marketplace

University textbook buy, sell, and rental platform organized around the **Professor → Course → Book** discovery model.

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Auth:** NextAuth v4 with JWT strategy
- **Database:** PostgreSQL via Supabase
- **Payments:** Stripe Connect
- **Storage:** AWS S3
- **Email:** Resend
- **Hosting:** Vercel

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/textbook-marketplace
cd textbook-marketplace
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.template .env.local
# Fill in all values in .env.local
```

### 3. Run database migration

Open Supabase SQL Editor and run the full contents of:
```
supabase_migration_v1.sql
```

### 4. Seed universities

```bash
npm run seed:universities
```

### 5. Create admin account

In Supabase SQL Editor, run:
```sql
-- Generate a bcrypt hash at https://bcrypt-generator.com (cost: 10)
INSERT INTO admin_users (email, password_hash, name)
VALUES ('admin@yourdomain.com', '$2a$10$YOUR_HASH_HERE', 'Admin');
```

### 6. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login, register, password reset
│   ├── (main)/       # Authenticated user pages
│   ├── (admin)/      # Admin panel
│   └── api/          # API route handlers
├── components/       # React components
├── lib/              # Utilities, clients, configs
├── types/            # TypeScript types (all DB tables)
└── hooks/            # Custom React hooks
```

## Development Roadmap

See `Phase1_Development_Roadmap.md` for the full build plan.

Current status: **Phase 1 — Foundation**
