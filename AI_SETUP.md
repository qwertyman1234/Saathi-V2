# Free AI API Setup Guide

This application uses free-tier AI APIs for intelligent features. **No credit card required** for any of these services.

## Quick Start (Choose Any One)

### Option 1: Hugging Face ⭐ (Recommended - Easiest)
**Best for**: Getting started quickly, no signup complexity

1. Go to [huggingface.co](https://huggingface.co)
2. Sign up (free, instant)
3. Go to Account → Access Tokens → Create New Token (read access)
4. Copy the token
5. Add to `.env.local`:
```env
VITE_HUGGINGFACE_API_KEY=hf_your_token_here
```

**Free Tier**: 32,000 tokens/month (enough for ~100 API calls)

---

### Option 2: Mistral AI
**Best for**: Best model quality with free access

1. Go to [console.mistral.ai](https://console.mistral.ai)
2. Sign up (free, instant)
3. Copy your API key from Profile → API Keys
4. Add to `.env.local`:
```env
VITE_MISTRAL_API_KEY=your_mistral_key_here
```

**Free Tier**: Unlimited requests (rate limited)

---

### Option 3: Groq ⚡ (Fastest)
**Best for**: Ultra-fast inference, best performance

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, instant)
3. Create API key in Settings
4. Add to `.env.local`:
```env
VITE_GROQ_API_KEY=gsk_your_key_here
```

**Free Tier**: Unlimited requests with rate limiting

---

### Option 4: Together AI
**Best for**: Multiple model options

1. Go to [together.ai](https://www.together.ai)
2. Sign up (free, instant)
3. Generate API key in dashboard
4. Add to `.env.local`:
```env
VITE_TOGETHER_API_KEY=your_together_key_here
```

**Free Tier**: $5 credits monthly (plenty for testing)

---

## Setup Instructions

### Step 1: Create `.env.local` file
In the project root (`c:\Users\Admin\Desktop\saathihealthinsurance-main\`), create a file named `.env.local`:

```env
# Choose at least ONE of the following:

# Hugging Face (RECOMMENDED - EASIEST)
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxx

# Mistral AI
VITE_MISTRAL_API_KEY=xxxxxxxxxxxx

# Groq
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Together AI
VITE_TOGETHER_API_KEY=xxxxxxxxxxxx
```

### Step 2: Restart Development Server
```bash
# Press Ctrl+C in your bun terminal to stop the server
# Then run:
bun run dev
```

### Step 3: Done! ✅
The app will now use AI for all features with automatic fallback between providers.

---

## Features Using AI

| Feature | Uses AI For | Free Provider |
|---------|-----------|---------------|
| **Claims Tracker** | Suggest required documents for claims | Hugging Face / Mistral |
| **Explain Policy** | Explain insurance terms in simple language | Hugging Face / Mistral |
| **Gap Analysis** | Identify coverage gaps personalized to you | Hugging Face / Groq |
| **Cost Estimator** | Optimize your insurance costs | Hugging Face / Together |
| **Compare Policies** | AI-powered policy comparison | Groq / Mistral |
| **Chat Assistant** | Conversational insurance guidance | Hugging Face / Groq |
| **Dashboard** | Generate personalized health insights | Mistral / Together |
| **Admin Analytics** | AI-powered insights for admins | Hugging Face / Groq |

---

## How It Works

1. **Automatic Fallback**: If one API fails, it automatically tries the next
2. **No Outage**: With 2+ APIs configured, you'll never lose AI features
3. **Free Forever**: All tiers are genuinely free with no hidden costs
4. **Privacy**: All APIs are legitimate, established companies

---

## API Performance Comparison

| Provider | Speed | Quality | Free Limit | Setup Time |
|----------|-------|---------|-----------|-----------|
| Hugging Face | Medium | Excellent | 32k tokens/month | 2 min ⭐ |
| Mistral | Fast | Excellent | Unlimited | 3 min |
| Groq | ⚡ Ultra-fast | Very Good | Unlimited | 3 min |
| Together | Fast | Very Good | $5/month | 4 min |

---

## Troubleshooting

### "AI service temporarily unavailable"
- Check that `.env.local` has at least ONE API key
- Verify the API key is correct (no extra spaces)
- Restart the dev server: `bun run dev`

### "API rate limit reached"
- Switch to a different provider (automatically happens)
- Or wait a few minutes before retrying

### "Invalid API key"
- Double-check the key from the provider's dashboard
- Make sure it's `VITE_` prefix (this makes it available to browser)

---

## Next Steps

1. **Pick your favorite provider** from the options above
2. **Sign up** (30 seconds, no credit card)
3. **Copy API key** to `.env.local`
4. **Restart server** and enjoy AI features! 🎉

**Recommended**: Start with Hugging Face for easiest setup, then optionally add Groq for faster responses.
