# The Daily Array — Angular 21 + Bootstrap 5 + Backstage Admin

Full stack affiliate product site with a protected admin dashboard at `/backstage`.

---

## What is included

### Public site
- Homepage with hero, dynamic category grid, featured products
- Category listing pages — `/categories/:slug`
- Product detail pages — `/products/:slug` with rich HTML description
- Click tracking — every product view and Amazon click recorded silently

### Backstage admin (protected)
- `/backstage` — Login page (Supabase Auth)
- `/backstage/dashboard` — Stats cards + top products table + quick actions
- `/backstage/products` — Product list with search, filter, toggle featured/active
- `/backstage/products/new` — Add product with Cloudinary image upload + Quill rich text editor
- `/backstage/products/edit/:id` — Edit existing product
- `/backstage/categories` — Full category CRUD with modal form
- `/backstage/analytics` — Line charts (Chart.js), traffic source pie chart, full product performance table with estimated earnings

---

## Auth guard — how it works

Every route under `/backstage/*` (except the login page itself) is protected
by `authGuard`. If you are not logged in, you are immediately redirected to
`/backstage`. Once logged in, trying to visit `/backstage` again redirects
you to `/backstage/dashboard`.

The guard checks your Supabase session on every navigation. If your session
expires, you are automatically redirected to login on the next page load.

---

## Setup — Step by Step

### 1. Install Node 20+ and Angular CLI 21
```bash
npm install -g @angular/cli@21
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Supabase
1. Create a free project at supabase.com
2. Run `supabase-setup.sql` in the SQL Editor — creates all 7 tables
3. Run `supabase-tracking.sql` — creates tracking tables + RPC functions
4. In Supabase Auth → Users → Add user → create your admin email + password
5. In Supabase Storage → New bucket → name: `product-images` → Public: ON

### 4. Set up Cloudinary
1. Create a free account at cloudinary.com
2. Find your Cloud Name in the dashboard
3. Go to Settings → Upload → Upload presets → Add preset
4. Set signing mode to Unsigned → save → copy the preset name

### 5. Add your credentials
Copy `.env.example` to `.env` and fill in all four values:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-preset-name
```

### 6. Run locally
```bash
ng serve
```
Open http://localhost:4200

Visit http://localhost:4200/backstage to log in with your Supabase admin user.

### 7. Deploy to Vercel
1. Push to GitHub
2. Connect repo at vercel.com
3. Build command: `ng build --configuration production`
4. Output directory: `dist/daily-array/browser`
5. Add all 4 environment variables in Vercel → Settings → Environment Variables
6. Connect your domain: `dailyarrayshop.com`

---

## Project structure

```
src/app/
├── app.component.ts             # Root shell — just <router-outlet>
├── app.config.ts                # Zoneless + router providers
├── app.routes.ts                # All routes — public + /backstage
├── models/
│   ├── index.ts                 # All TypeScript interfaces
│   └── app-config.ts            # AppConfig interface
├── services/
│   ├── supabase.service.ts      # Public DB queries + tracking
│   ├── auth.service.ts          # Signal-based auth state
│   ├── admin.service.ts         # All CRUD for backstage
│   └── cloudinary.service.ts    # Image upload via fetch
├── backstage/
│   ├── guards/
│   │   └── auth.guard.ts        # authGuard + publicGuard
│   ├── auth/
│   │   └── login.component.ts   # /backstage login page
│   ├── shell/
│   │   └── shell.component.ts   # Sidebar layout for all admin pages
│   ├── dashboard/
│   │   └── dashboard.component.ts
│   ├── products/
│   │   ├── product-list.component.ts
│   │   └── product-form.component.ts  # Add/edit with Quill + Cloudinary
│   ├── categories/
│   │   └── categories.component.ts
│   └── analytics/
│       └── analytics.component.ts     # Chart.js charts
└── components/                  # Public navbar, footer, product-card, etc.
```

---

## Angular 21 features used

| Feature | Where |
|---|---|
| `signal()`, `.set()`, `.update()` | Every component |
| `computed()` | Product list filter |
| `input.required<T>()` | Public product/category cards |
| `inject()` | All services |
| `afterNextRender()` | Quill init, Chart.js init |
| `viewChild()` | Canvas refs for Chart.js, Quill editor ref |
| `provideExperimentalZonelessChangeDetection()` | app.config.ts |
| `ChangeDetectionStrategy.OnPush` | Every component |
| `@if` / `@for` | All templates |
| `withViewTransitions()` | Router config |
| `withComponentInputBinding()` | Router config |
| `CanActivateFn` | Auth guard (functional guard) |

---

## Libraries loaded globally via angular.json

| Library | Purpose |
|---|---|
| Bootstrap 5.3 | Grid, utilities, components |
| Bootstrap Icons 1.11 | All icons via `bi-*` classes |
| Chart.js 4.4 | Line charts + doughnut chart in analytics |
| Quill 2.0 | Rich text editor for product descriptions |
