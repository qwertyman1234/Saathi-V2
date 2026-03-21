# Razorpay Payment Integration Setup

## Environment Variables

Add the following variables to `.env.local` in your project root:

```env
# Razorpay Configuration (get from https://dashboard.razorpay.com/app/keys)
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
VITE_RAZORPAY_KEY_SECRET=XXXXXXXXXXXXX     # Only for backend/.env.supabase
VITE_RAZORPAY_WEBHOOK_SECRET=whsec_XXXXX  # For webhook verification

# Firebase Configuration (already set)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Supabase Edge Function Setup

The Razorpay Edge Function requires environment variables. Set them up:

```bash
# Login to Supabase CLI
supabase login

# Set environment variables for the edge function
supabase secrets set RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
supabase secrets set RAZORPAY_KEY_SECRET=XXXXXXXXXXXXX
supabase secrets set RAZORPAY_WEBHOOK_SECRET=whsec_XXXXX

# Deploy the function
supabase functions deploy razorpay
```

## Razorpay Account Setup

1. **Create Account**: Sign up at https://razorpay.com
2. **Get Test Keys**: 
   - Go to https://dashboard.razorpay.com/app/keys
   - Copy "Key ID" and "Key Secret" (test mode)
3. **Enable Webhooks**:
   - Go to Settings → Webhooks
   - Add URL: `https://your-project-id.supabase.co/functions/v1/razorpay-webhook`
   - Events to subscribe: `payment.authorized`, `payment.captured`, `payment.failed`
   - Accept signature header: Checked
   - Copy webhook secret

## Testing Razorpay Integration

### Use Test Credentials:
- **Test Card Numbers**:
  - Visa: `4111 1111 1111 1111`
  - Mastercard: `5555 5555 5555 4444`
  - Any expiry and CVV

- **Test UPI**: `success@razorpay` (will succeed), `failure@razorpay` (will fail)

### Test Payment Flow:

1. Start dev server: `bun run dev`
2. Go to Buy Insurance → Select Plan → Click "Buy Now"
3. Enter test card details in Razorpay modal
4. Verify payment shows success message

## Webhook Configuration

Razorpay will send webhook events to your Supabase function. Handle these events in the function to:

1. Verify webhook signature
2. Update payment status in database
3. Send confirmation emails
4. Trigger policy document generation

## Troubleshooting

### "Razorpay is not loaded"
- Check Razorpay script loads: `curl https://checkout.razorpay.com/v1/checkout.js`
- Check browser console for CORS errors

### Payment verification fails
- Ensure webhook secret matches RAZORPAY_WEBHOOK_SECRET environment variable
- Check Supabase function logs: `supabase functions list`

### Orders not created
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Supabase secrets
- Check function deployment: `supabase functions describe razorpay`

## Next Steps

1. ✅ Update `.env.local` with Razorpay keys
2. ✅ Deploy Supabase migration: `supabase db push`
3. ✅ Deploy Edge Function: `supabase functions deploy razorpay`
4. ✅ Test with sample payment
5. ⏳ Deploy to production (get live keys from Razorpay)
6. ⏳ Configure live webhook and switch API keys
