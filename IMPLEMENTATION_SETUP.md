# Complete Implementation Setup Guide

## 📋 Overview

This guide covers setting up all the services needed for the Saathi Health Insurance platform to be production-ready.

**Phase 1: Payment (Razorpay)** ✅ DONE  
**Phase 2: Data Integrations** ✅ IN PROGRESS  
**Phase 3: Infrastructure** ✅ IN PROGRESS  
**Phase 4: Compliance & Testing** ⏳ PENDING  

---

## Environment Variables Setup

Create a `.env.local` file in the project root with:

```env
# ============ FIREBASE (Already configured) ============
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# ============ RAZORPAY (Payment) ============
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX     # From dashboard.razorpay.com/app/keys
VITE_RAZORPAY_WEBHOOK_SECRET=whsec_XXXXX      # From webhook settings

# ============ RESEND (Email Notifications) ============
VITE_RESEND_API_KEY=re_XXXXXXXXXXXXX           # From resend.com/api-keys

# ============ TWILIO (SMS Notifications) ============
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx     # From console.twilio.com
VITE_TWILIO_AUTH_TOKEN=your_auth_token         # From console.twilio.com
VITE_TWILIO_FROM_PHONE=+91XXXXXXXXXX           # Your Twilio phone number

# ============ SUPABASE (Database) ============
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
```

---

## Service Setup Checklist

### 1. Razorpay Setup (Payment Processing)

**Status:** ✅ Integrated in code  
**Steps:**
- [ ] Create account at https://razorpay.com
- [ ] Get test keys from dashboard
- [ ] Copy `Key ID` to `VITE_RAZORPAY_KEY_ID`
- [ ] Set up webhook at: Settings → Webhooks → Add URL
  - Webhook URL: `https://your-project-id.supabase.co/functions/v1/razorpay-webhook`
  - Events: `payment.authorized`, `payment.captured`, `payment.failed`
  - Copy webhook secret to `VITE_RAZORPAY_WEBHOOK_SECRET`
- [ ] Deploy Supabase Edge Function: `supabase functions deploy razorpay`
- [ ] Test with sample payment (card: `4111 1111 1111 1111`)

**Files Modified:**
- `src/lib/razorpay/config.ts` - Configuration
- `src/lib/razorpay/service.ts` - Frontend integration
- `supabase/functions/razorpay/index.ts` - Backend function
- `src/hooks/useRazorpayPayment.ts` - React hook
- `src/components/buy-insurance/StepReview.tsx` - UI integration
- `supabase/migrations/20260318_payment_tracking.sql` - Database schema

---

### 2. Resend Email Setup (Transactional Emails)

**Status:** ✅ Integrated in code  
**Steps:**
- [ ] Create account at https://resend.com
- [ ] Verify domain (use built-in `resend.dev` for testing)
- [ ] Get API key from https://resend.com/api-keys
- [ ] Add to `.env.local`: `VITE_RESEND_API_KEY=re_XXXXX`
- [ ] Test with sample email

**Emails Configured:**
- Policy confirmation
- Claim submission
- Claim approval/rejection
- Policy renewal reminders

**Files Created:**
- `src/lib/notifications/email.ts` - Email service with templates

**Usage Example:**
```typescript
import { getPolicyConfirmationEmail, sendEmail } from "@/lib/notifications/email";

const template = getPolicyConfirmationEmail({
  userName: "John Doe",
  policyNumber: "SAA-123456",
  planName: "Gold Plan",
  premium: 500,
  coverageAmount: 500000,
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  email: "john@example.com",
});

await sendEmail(template);
```

---

### 3. Twilio SMS Setup (SMS Notifications)

**Status:** ✅ Integrated in code  
**Steps:**
- [ ] Create account at https://www.twilio.com
- [ ] Get free $15 credit (covers ~1000 SMS in India)
- [ ] Get Account SID, Auth Token from https://console.twilio.com
- [ ] Add to `.env.local`:
  ```env
  VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxx
  VITE_TWILIO_AUTH_TOKEN=your_token
  VITE_TWILIO_FROM_PHONE=+18xx-xxxx-xxxx
  ```
- [ ] Verify recipient phone numbers (trial account limitation)
- [ ] Test with sample SMS

**SMS Configured:**
- Policy confirmation
- Claim status updates
- Renewal reminders
- OTP verification

**Files Created:**
- `src/lib/notifications/sms.ts` - SMS service with templates

**Usage Example:**
```typescript
import { getPolicyConfirmationSMS, sendSMS } from "@/lib/notifications/sms";

const template = getPolicyConfirmationSMS({
  userName: "John",
  policyNumber: "SAA-123456",
  planName: "Gold",
  phone: "+919876543210",
});

await sendSMS(template);
```

---

### 4. Hospital Networks Database

**Status:** ✅ Schema created, seed data needed  
**Steps:**
- [ ] Deploy migration: `supabase db push`
- [ ] Seed hospital data (see below)
- [ ] Test hospital search API

**Seed Hospital Data:**

Run this to add sample hospitals:
```sql
-- Insert sample hospitals
INSERT INTO hospital_networks (name, city, state, latitude, longitude, specialties, cashless_available, emergency_24_7) VALUES
('Apollo Hospital', 'Mumbai', 'Maharashtra', 19.0176, 72.8479, ARRAY['Cardiology', 'Orthopedics', 'Neurology'], true, true),
('Fortis Hospital', 'Delhi', 'Delhi', 28.5244, 77.1045, ARRAY['Cardiology', 'Oncology', 'Neurosurgery'], true, true),
('Max Healthcare', 'Bangalore', 'Karnataka', 12.9716, 77.5946, ARRAY['Orthopedics', 'General Surgery', 'Pediatrics'], true, true);
-- Add more hospitals as needed
```

**Files Created:**
- `supabase/migrations/20260318_hospital_networks.sql` - Database schema
- `src/lib/hospitals/search.ts` - Search service
- `src/hooks/useHospitalSearch.ts` - React hook

**Usage Example:**
```typescript
import { useHospitalSearch } from "@/hooks/useHospitalSearch";

export function HospitalSearchComponent() {
  const { hospitals, filterByCity, isSearching } = useHospitalSearch({
    initialCity: "Mumbai",
    autoSearch: true,
  });

  return (
    <div>
      <input onChange={(e) => filterByCity(e.target.value)} />
      {hospitals.map(hospital => <HospitalCard key={hospital.id} hospital={hospital} />)}
    </div>
  );
}
```

---

### 5. Firebase Storage (Document Management)

**Status:** ⏳ TODO  
**Steps:**
- [ ] Enable Firebase Storage in Firebase Console
- [ ] Configure security rules for claim documents
- [ ] Update ClaimsTracker to use Firebase Storage instead of base64
- [ ] Create `src/lib/storage/documents.ts` service

**Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /claims/{userId}/{document} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId && 
                      request.resource.size < 10 * 1024 * 1024; // 10MB max
    }
    match /policies/{userId}/{document} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

---

### 6. Audit Logging (Compliance)

**Status:** ⏳ TODO  
**Steps:**
- [ ] Create `audit_logs` table in Supabase
- [ ] Add logging middleware to sensitive operations
- [ ] Create admin dashboard for audit trail
- [ ] Implement log retention policy (7 years)

---

## Database Migrations

Run these migrations in order:

```bash
# 1. Payment tracking schema
supabase migration up

# 2. Hospital networks
supabase migration up

# 3. Verify migration status
supabase migration list
```

---

## Supabase Functions Deployment

```bash
# Deploy Razorpay function
supabase functions deploy razorpay

# Set secrets
supabase secrets set RAZORPAY_KEY_ID=rzp_test_...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set RAZORPAY_WEBHOOK_SECRET=...

# Verify deployment
supabase functions list
```

---

## Testing Checklist

### Phase 1: Payment
- [ ] Test order creation → Razorpay modal opens
- [ ] Test successful payment → Policy created in Firestore
- [ ] Test payment failure → Error message displayed
- [ ] Test webhook → Payment status updated after payment

### Phase 2: Data
- [ ] Query hospitals by city → Returns correct results
- [ ] Query hospitals by specialty → Returns correct hospitals
- [ ] Get nearest hospitals → Returns location-based results
- [ ] Hospital stats → Shows correct counts

### Phase 3: Notifications
- [ ] Send policy confirmation email → Email received
- [ ] Send claim status SMS → SMS received
- [ ] Send renewal reminder → Notification sent at correct time

### Phase 4: Compliance
- [ ] Audit log created for claim approval
- [ ] Sensitive data encrypted (if stored)
- [ ] Data access logs available
- [ ] Retention policy enforced

---

## Monitoring & Debugging

### Supabase
- Dashboard: https://app.supabase.com
- Logs: View → Logs
- Database: View → SQL Editor

### Razorpay
- Dashboard: https://dashboard.razorpay.com
- Webhooks: Settings → Webhooks
- Test payments: Use test card numbers

### Firebase
- Console: https://console.firebase.google.com
- Logs: View → Logs
- Storage: Storage tab

### Resend
- Dashboard: https://resend.com/emails
- Tests: API reference → Interactive

---

## Deployment Steps

### Development → Staging
1. Test all features locally with `.env.local`
2. Deploy to Vercel staging
3. Run full test suite
4. Get team approval

### Staging → Production
1. Get live API keys from each service
2. Update `.env.production`
3. Deploy Supabase functions
4. Run smoke tests
5. Monitor for 24 hours

---

## Cost Estimates (Monthly)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Razorpay | No | 1000 orders/mo | $0 (2% fee) |
| Resend | Free email domain | 1000 emails/mo | $0 |
| Twilio | $15 free | 1000 SMS/mo | $5-10 |
| Firebase | ~125K reads/day free | Data sync | $0-10 |
| Supabase | 2GB storage free | Small DB | $0-5 |
| **Total** | | | **$5-25/mo** |

---

## Next Steps

1. **Immediate (This Week)**
   - [ ] Set up Razorpay + Resend + Twilio accounts
   - [ ] Add environment variables
   - [ ] Deploy Edge Functions
   - [ ] Test payment flow

2. **Short-term (Next 2 Weeks)**
   - [ ] Seed hospital data (500+ hospitals)
   - [ ] Implement Firebase Storage
   - [ ] Test email + SMS notifications
   - [ ] Setup audit logging

3. **Medium-term (1 Month)**
   - [ ] IRDA compliance audit
   - [ ] Load testing
   - [ ] Security hardening
   - [ ] CI/CD pipeline setup

4. **Long-term (2 Months)**
   - [ ] Real insurance provider integration
   - [ ] Mobile app development
   - [ ] Advanced analytics

---

**Questions?** Refer to individual service documentation or see `.md` files in project root.
