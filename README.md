# Merrachi Virtual Try-On App (Next.js)

This is a custom Shopify App built with **Next.js (App Router)** that adds a Virtual Try-On feature to your store using "Nano Banana2" AI.

## Features

- **Theme App Extension**: Adds a "Try On" button to product pages without modifying theme code.
- **Supabase Storage**: Securely stores user photos.
- **Prisma Database**: Links user photos to their customer ID.
- **AI Integration**: Connects to your hosted AI model for generating try-on images.
- **Next.js App Router**: Modern, server-side rendering and API routes.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=your_app_url
SCOPES=write_products,read_products,read_customers

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase Storage
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="your_anon_key"

# AI Service
AI_API_URL="https://api.banana.dev/..."
AI_API_KEY="your_ai_api_key"
```

### 3. Setup Supabase & Prisma

1.  Create a new Supabase project.
2.  Create a **Storage Bucket** named `user-photos` (Public Read).
3.  Run the Prisma migration:
    ```bash
    npx prisma migrate dev --name init
    ```

### 4. Configure App Proxy

1.  Go to your Shopify Partner Dashboard > App Setup.
2.  Scroll down to **App Proxy**.
3.  Set **Subpath prefix** to `apps`.
4.  Set **Subpath** to `try-on`.
5.  Set **Proxy URL** to `https://your-app-url.com/api/try-on`.

### 5. Run the App

```bash
npm run dev
```

### 6. Deploy Theme Extension

```bash
npm run deploy
```
