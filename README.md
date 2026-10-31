> **Licensing update (31 October 2026):** The current policy requires prior written permission for reuse and a separate agreement for AI training. See [LICENSE](LICENSE). Earlier grants remain valid for previously licensed material; [LICENSE.previous](LICENSE.previous) preserves those terms. Any older license descriptions below describe the previous policy. Contact [ei@nsisong.com](mailto:ei@nsisong.com).

# Debtstracker

> **Track your debt, plan your freedom.**

A multi-tenant SaaS application for tracking debts, managing expenses, and planning for relocation savings. Built with Next.js 15, TypeScript, and designed for a fintech aesthetic with dark mode only.

## Features

- **Email/Password Authentication** - Secure login with bcrypt password hashing
- **Multi-Tenant Architecture** - Complete data isolation between users
- **Debt Management** - Track multiple debts with priority levels and currency support
- **Dashboard Analytics** - View total debt, monthly payments, and savings goals
- **Dark Mode UI** - Minimalist, data-heavy fintech design
- **Lowercase Typography** - Unique design constraint for modern aesthetic

## Screenshots

### Landing Page
![Landing Page](./screenshots/01-landing-page.png)
*The marketing page with call-to-action buttons*

### Sign Up
![Sign Up Page](./screenshots/02-signup-page.png)
*User registration with email and password*

### Login
![Login Page](./screenshots/03-login-page.png)
*Secure authentication flow*

### Dashboard - Empty State
![Empty Dashboard](./screenshots/04-dashboard-empty.png)
*Clean dashboard view for new users*

### Add Debt Form
![Add Debt Form](./screenshots/05-add-debt-form.png)
*Form to add new debt with currency and priority*

### Dashboard - With Debt
![Dashboard with Debt](./screenshots/06-dashboard-with-debt.png)
*Dashboard showing debt cards with progress bars*

### Dashboard - Multiple Debts
![Dashboard Multiple Debts](./screenshots/07-dashboard-multiple-debts.png)
*Full dashboard view with multiple debts tracked*

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + Shadcn UI
- **Database**: Vercel Postgres / Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Auth.js v5 (NextAuth) with Credentials Provider
- **Password Security**: bcryptjs
- **Icons**: Lucide React

## Database Schema

Multi-tenant architecture with strict data isolation:

- **users**: Authentication data with hashed passwords
- **debts**: User-specific debts (userId FK, name, total_amount, current_balance, currency, priority)
- **transactions**: Payment and expense tracking
- **goals**: Relocation/savings targets

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/1cbyc/debtstracker.git
   cd debtstracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```bash
   # Database (Neon or Vercel Postgres)
   POSTGRES_URL=postgresql://username:password@host/database
   
   # Auth.js Secret (generate with: openssl rand -base64 32)
   AUTH_SECRET=your_secret_here
   ```

4. **Set up the database**
   ```bash
   # Generate migration files
   npx drizzle-kit generate
   
   # Push schema to database
   npx drizzle-kit push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Test Credentials

For testing purposes, you can create a user or use these example credentials:

**Email**: `demo@debtstracker.app`  
**Password**: `demo123456`

> **Note**: You'll need to sign up first as the database starts empty. Use the credentials above or create your own.

## Design Philosophy

### UI/UX Rules
1. **Minimalist, Data-Heavy**: Focus on information density and clarity
2. **Dark Mode Only**: Slate/Zinc color palette for reduced eye strain
3. **Lowercase Typography**: All text enforced to lowercase for modern aesthetic
4. **Mobile-First**: Optimized for quick data entry on mobile devices

### Color Palette
- Background: `hsl(240 10% 3.9%)`
- Foreground: `hsl(0 0% 98%)`
- Primary: `hsl(0 0% 98%)`
- Destructive (High Priority): `hsl(0 62.8% 30.6%)`
- Muted: `hsl(240 3.7% 15.9%)`

## Security Features

- **Password Hashing**: bcrypt with 10 rounds
- **Multi-Tenancy**: Strict userId validation on all server actions
- **Session Management**: JWT-based sessions with Auth.js
- **Server Actions**: All mutations validated with user ownership checks

## Project Structure

```
debtstracker/
├── app/
│   ├── actions.ts           # Server actions (addDebt, logPayment, etc.)
│   ├── auth-actions.ts      # Authentication server actions
│   ├── api/auth/[...nextauth]/  # Auth.js API route
│   ├── dashboard/           # Protected dashboard routes
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── page.tsx             # Marketing landing page
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── app-sidebar.tsx      # Dashboard sidebar
│   ├── login-form.tsx       # Client login form
│   └── signup-form.tsx      # Client signup form
├── db/
│   ├── schema.ts            # Drizzle schema definitions
│   └── index.ts             # Database client
├── auth.ts                  # Auth.js configuration
├── middleware.ts            # Route protection
└── drizzle.config.ts        # Drizzle Kit configuration
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate database migrations
npx drizzle-kit generate

# Push schema changes
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database with [Drizzle ORM](https://orm.drizzle.team/)
- Authentication via [Auth.js](https://authjs.dev/)
- UI Components inspired by [Shadcn UI](https://ui.shadcn.com/)

---

**Made with ❤️ by [1cbyc](https://github.com/1cbyc)**
