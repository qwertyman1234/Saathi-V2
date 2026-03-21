# 🔥 Firebase Setup Guide for Saathi Health Insurance

## Step 1 — Create a Firebase Project (FREE)

1. Go to https://console.firebase.google.com
2. Click **"Create a project"**
3. Name it: `saathi-health-insurance`
4. Disable Google Analytics (optional) → **Create project**

---

## Step 2 — Add a Web App

1. In your project, click the **`</>`** (Web) icon
2. App nickname: `saathi-web`
3. Click **Register app**
4. Copy the config object — you'll need it for `.env`

---

## Step 3 — Fill in your `.env` file

Open `.env` and replace the placeholder values:

```
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="saathi-health-insurance.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="saathi-health-insurance"
VITE_FIREBASE_STORAGE_BUCKET="saathi-health-insurance.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"
VITE_ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Step 4 — Enable Authentication

1. Go to **Authentication → Sign-in method**
2. Enable **Email/Password** → Save
3. Enable **Google** → enter your support email → Save

---

## Step 5 — Set up Firestore Database

1. Go to **Firestore Database → Create database**
2. Choose **"Start in production mode"**
3. Select region: `asia-south1` (Mumbai) for best Indian performance
4. Click **Enable**
5. Go to **Rules** tab → paste the contents of `firestore.rules` → **Publish**

---

## Step 6 — Set up Storage

1. Go to **Storage → Get started**
2. Choose **"Start in production mode"**
3. Select same region as Firestore
4. Click **Done**
5. Go to **Rules** tab → paste the contents of `storage.rules` → **Publish**

---

## Step 7 — Install Firebase & run the app

```bash
cd "C:\Users\Admin\Desktop\saathihealthinsurance-main"
bun install
bun run dev
```

Open http://localhost:5173 — you'll see the Login page!

---

## Free Tier Limits (very generous)

| Feature | Free Limit |
|---------|-----------|
| Authentication | Unlimited users |
| Firestore reads | 50,000/day |
| Firestore writes | 20,000/day |
| Storage | 5 GB |
| Hosting | 10 GB/month |

You won't hit these limits until you have thousands of daily active users.

---

## Deploying to production (free)

```bash
bun run build
```

Then deploy to **Vercel** (free):
1. Push code to GitHub
2. Go to vercel.com → Import project
3. Add all VITE_ environment variables
4. Deploy!
