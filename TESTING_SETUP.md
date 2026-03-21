# Testing Dependencies

Add these to your `package.json` scripts and devDependencies:

## Install Commands

```bash
# Testing libraries
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @playwright/test
npm install -D crypto-js

# Performance & Monitoring
npm install web-vitals
npm install @sentry/react @sentry/tracing

# Load testing (global)
npm install -g k6

# Analytics
npm install @google-analytics/data

# Type definitions
npm install -D @types/crypto-js
```

## Package.json Updates

Add these to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:load": "k6 run load-test.js",
    "test:lighthouse": "lighthouse-ci autorun",
    "test:all": "npm run lint && npm run test && npm run test:e2e"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@sentry/react": "^7.80.0",
    "@sentry/tracing": "^7.80.0",
    "@types/crypto-js": "^4.1.1",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "crypto-js": "^4.1.1",
    "vitest": "^1.0.0",
    "web-vitals": "^3.5.0"
  }
}
```

## Environment Variables

Add to `.env.local`:

```env
# Sentry Error Tracking
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Google Analytics
VITE_GA_ID=G-XXXXXXXXXX

# Analytics Endpoint
VITE_ANALYTICS_ENDPOINT=https://your-api.com/analytics

# Performance monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## CI/CD Secrets (GitHub)

Set these in GitHub Settings → Secrets:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VERCEL_PROJECT_ID_STAGING
SUPABASE_PROJECT_ID
SUPABASE_PROJECT_ID_STAGING
SUPABASE_ACCESS_TOKEN
SUPABASE_PASSWORD
SNYK_TOKEN
SLACK_WEBHOOK
```
