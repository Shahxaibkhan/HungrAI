# 🚀 WhatsApp AI Restaurant Ordering System - Deployment Guide

## Overview
Complete WhatsApp automation system with hybrid Dialogflow + GPT architecture, multi-tenant support, and full business logic for restaurant ordering.

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] `.env` / Netlify dashboard variables configured (use placeholders, never commit real secrets):
  ```
  MONGODB_URI=<your_mongodb_uri>
  OPENAI_API_KEY=<your_openai_api_key>
  DIALOGFLOW_PROJECT_ID=<your_dialogflow_project_id>
  WHATSAPP_ACCESS_TOKEN=<your_whatsapp_access_token>
  WHATSAPP_PHONE_NUMBER_ID=817693608099449
  WHATSAPP_BUSINESS_ID=<your_whatsapp_business_id>
  WHATSAPP_VERIFY_TOKEN=hungerai_secret_2025
  AI_MODE=hybrid
  AI_FALLBACK_MODEL=gpt-4o-mini
  ```

### 2. Database Setup
- [ ] MongoDB Atlas cluster running
- [ ] Database connection tested
- [ ] Sample restaurant data created (see `api/sampleRestaurant.js`)

### 3. Dialogflow Setup  
- [ ] Dialogflow CX project created
- [ ] Intent files imported (22 individual `.json` files)
- [ ] Agent configured and tested
- [ ] Service account key generated

### 4. WhatsApp Business Setup
- [ ] WhatsApp Business Account created
- [ ] Phone number verified and configured
- [ ] Long-lived access token generated (System User)
- [ ] Webhook URL configured: `https://<your-site>.netlify.app/.netlify/functions/whatsapp-webhook`

## 🏗️ System Architecture

### Core Components
1. **WhatsApp Webhook** (`api/whatsapp-webhook.js`)
   - Message verification and processing
   - Complete business logic (greeting → menu → cart → checkout)
   - Hybrid Dialogflow + GPT routing

2. **Session Management** (`api/whatsappSessionManager.js`)
   - File-based session storage with 10-minute TTL
   - Cart operations and user state persistence
   - Automatic cleanup of expired sessions

3. **Restaurant Lookup** (`api/restaurantLookup.js`)
   - Multi-tenant support via phoneNumberId mapping
   - Menu retrieval with 5-minute caching
   - Fuzzy item matching with aliases

4. **GPT Integration** (`api/promptOrchestrator.js`)
   - Menu item extraction with structured JSON output
   - Contextual response generation
   - Fallback handling for unrecognized intents

5. **WhatsApp Messenger** (`api/whatsappMessenger.js`)
   - Message sending utility with multiple formats
   - Menu formatting and order confirmations
   - Typing indicators for better UX

## 🌐 Deployment Options

### Netlify Deployment (Primary)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Local dev (functions + proxy)
netlify dev

# Production deploy (manual trigger)
netlify deploy --prod
```

`netlify.toml` excerpt:
```
[build]
  publish = "frontend"
  functions = "netlify/functions"
```

Post-deploy build verification:
```bash
curl https://<your-site>.netlify.app/.netlify/functions/version
```
Expect JSON with current `build` value (e.g. `v2025-10-28-3`).

## 🧪 Testing Flow

### 1. Basic Webhook Verification
```bash
curl "https://<your-site>.netlify.app/.netlify/functions/whatsapp-webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=hungerai_secret_2025"
# Expected: test123
```

### 2. Manual Message Testing
Send these messages to your WhatsApp Business number:

1. **"Hi"** → Should get welcome message
2. **"menu"** → Should show restaurant menu  
3. **"I want a burger"** → Should add burger to cart
4. **"cart"** → Should show cart contents
5. **"checkout"** → Should start checkout process

### 3. Sample Restaurant Setup
```javascript
// Run this in your MongoDB or via API endpoint
const { createSampleRestaurant } = require('./api/sampleRestaurant');
await createSampleRestaurant();
```

## 📊 System Features

### Business Logic
- ✅ Welcome message with restaurant info
- ✅ Menu display with categories and prices
- ✅ Natural language item recognition
- ✅ Cart management (add/remove/view)
- ✅ Checkout flow with order summary
- ✅ Order submission to restaurant

### AI Integration
- ✅ Hybrid Dialogflow + GPT routing
- ✅ Intent classification with confidence scoring
- ✅ Menu item extraction with quantities
- ✅ Contextual response generation
- ✅ Graceful fallback handling

### Multi-Tenant Support
- ✅ Restaurant lookup by WhatsApp phone number ID
- ✅ Menu and branding per restaurant
- ✅ Isolated cart sessions per restaurant
- ✅ Custom AI prompts per restaurant

### Session Management
- ✅ File-based session storage
- ✅ 10-minute TTL with automatic cleanup
- ✅ Cart persistence across conversations
- ✅ User state tracking

## 🔧 Configuration

### WhatsApp Webhook URL
After deployment, configure your webhook URL in WhatsApp Business Manager:

**Webhook Configuration:**
```
Webhook URL: https://<your-site>.netlify.app/.netlify/functions/whatsapp-webhook
Verify Token: hungerai_secret_2025
Events: messages
```

### Dialogflow Integration
Ensure your Dialogflow agent is configured with:
- All 22 intent files imported
- Default language set to English
- Webhook enabled (if using CX)

### Database Schema
Restaurant documents should include:
```javascript
{
  name: "Restaurant Name",
  slug: "restaurant-slug", 
  whatsapp: {
    phoneNumberId: "123456789", // Critical for multi-tenant routing
    isActive: true
  },
  menu: [
    {
      name: "Item Name",
      price: 12.99,
      aliases: ["alternate", "names"]
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues
1. **Webhook verification fails**: Token mismatch; confirm `WHATSAPP_VERIFY_TOKEN`.
2. **Stale function code**: Missing `[BOOT]` log; clear Netlify cache & redeploy.
3. **Restaurant not found**: Missing document with `phoneNumberId`.
4. **401 Unauthorized**: Expired `WHATSAPP_ACCESS_TOKEN`; rotate via System User.
5. **Dialogflow not responding**: Wrong project ID or missing credentials JSON.
6. **GPT not working**: Invalid OpenAI key / quota exhausted.
7. **Sessions not persisting**: Check storage mechanism (consider DB vs temp files).

### Debug Mode
Add to `.env` for detailed logging:
```
DEBUG=true
LOG_LEVEL=debug
```

### Test Endpoints
Create test endpoints for debugging:
```javascript
// GET /api/test/restaurant/:phoneNumberId
// GET /api/test/session/:sessionId  
// POST /api/test/gpt (body: { message, context })
```

## 📈 Next Steps

### Phase 2 Enhancements
- [ ] Payment integration (Stripe/PayPal)
- [ ] Real-time order tracking
- [ ] Multi-language support
- [ ] Voice message handling
- [ ] Image menu recognition
- [ ] Analytics dashboard
- [ ] Restaurant management portal

### Scaling Considerations
- [ ] Move to database-based sessions (Redis)
- [ ] Implement rate limiting
- [ ] Add monitoring (DataDog/New Relic)
- [ ] Set up CI/CD pipeline
- [ ] Load testing and optimization

## 🎯 Success Metrics
- ✅ Webhook responds within 5 seconds
- ✅ 95%+ intent recognition accuracy  
- ✅ Complete order flow from greeting to checkout
- ✅ Multi-restaurant support working
- ✅ Session persistence across interactions
- ✅ Graceful error handling and recovery

---

**Status: ✅ Netlify Deployment Ready**

Core ordering + intent routing active. Validate with:
1. Version endpoint returns current build.
2. First WhatsApp message logs `[BOOT]` and `🎯 Message routing`.
3. Fast-path intents respond ("menu", "hi").