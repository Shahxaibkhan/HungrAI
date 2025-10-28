# 🚀 Netlify Deployment & Testing Guide

## ✅ Your WhatsApp AI System is Ready for Netlify!

Since you're already using Netlify, here's the complete testing and deployment workflow:

## 🧪 **Testing Steps**

### 1. Quick System Check
```bash
# Verify all files are in place
npm run verify
```

### 2. Test Netlify Functions Locally
```bash
# Start Netlify dev server
netlify dev

# Your webhook will be available at:
# http://localhost:8888/.netlify/functions/whatsapp-webhook
```

### 3. Test Webhook Verification
Open another terminal and test:
```bash
# Test webhook verification (what WhatsApp calls)
curl "http://localhost:8888/.netlify/functions/whatsapp-webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=hungerai_secret_2025"

# Expected response: test123
```

## 🚀 **Deployment Steps**

### 1. Deploy to Netlify
```bash
# Deploy to production
npm run deploy

# Or manually:
netlify deploy --prod
```

### 2. Configure Environment Variables
In your Netlify dashboard, add these environment variables (DO NOT hardcode real secrets in version control; use the Netlify UI or encrypted secret storage):

```
MONGODB_URI=<your_mongodb_uri>
OPENAI_API_KEY=<your_openai_api_key>
WHATSAPP_ACCESS_TOKEN=<your_whatsapp_access_token>
WHATSAPP_PHONE_NUMBER_ID=817693608099449
WHATSAPP_BUSINESS_ID=25041923335439169
WHATSAPP_VERIFY_TOKEN=hungerai_secret_2025
DIALOGFLOW_PROJECT_ID=valued-torch-220213
DIALOGFLOW_SERVICE_ACCOUNT_JSON={...your service account JSON...}
AI_MODE=hybrid
AI_FALLBACK_MODEL=gpt-4o-mini
```

### 3. Set Up WhatsApp Webhook
In WhatsApp Business Manager:

1. Go to **App Settings > Webhooks**
2. Set **Webhook URL**: `https://your-site.netlify.app/.netlify/functions/whatsapp-webhook`
3. Set **Verify Token**: `hungerai_secret_2025`
4. Subscribe to **messages** events

### 4. Create Sample Restaurant Data
```bash
# After deployment, create sample restaurant
npm run setup
```

## 📱 **Testing the Live System**

### 1. Test Webhook Verification
```bash
curl "https://your-site.netlify.app/.netlify/functions/whatsapp-webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=hungerai_secret_2025"
# Should return: test123
```

### 2. Test with WhatsApp Messages
Send these messages to your WhatsApp Business number:

1. **"Hi"** → Should get welcome message
2. **"menu"** → Should show restaurant menu
3. **"I want a burger"** → Should add burger to cart
4. **"cart"** → Should show cart contents
5. **"checkout"** → Should start checkout process

## 🔧 **Current Configuration Status**

✅ **Environment Variables**: All configured in your `.env`
✅ **Netlify Config**: `netlify.toml` already set up
✅ **WhatsApp Credentials**: Valid tokens provided
✅ **Dialogflow**: Service account configured
✅ **MongoDB**: Connection string ready
✅ **OpenAI**: API key configured

## 🎯 **What Happens When You Deploy**

1. **Netlify Functions**: Your `api/` folder becomes serverless functions
2. **WhatsApp Webhook**: Available at `/.netlify/functions/whatsapp-webhook`
3. **AI Processing**: Hybrid Dialogflow + GPT responses
4. **Session Management**: File-based cart storage
5. **Multi-tenant**: Restaurant lookup by phone number ID

## 🚨 **Troubleshooting**

### Function Logs
```bash
# View function logs
netlify logs --function=whatsapp-webhook
```

### Common Issues
1. **Webhook verification fails**: Check verify token
2. **Function timeout**: Functions have 10s limit on Netlify
3. **Environment vars**: Ensure all vars are set in Netlify dashboard
4. **Database connection**: Check MongoDB URI

## 📊 **Expected Flow**

```
Customer WhatsApp Message
        ↓
WhatsApp Cloud API
        ↓
Netlify Function: whatsapp-webhook
        ↓
1. Restaurant Lookup (by phone ID)
2. Session Management (cart state)
3. AI Processing (Dialogflow + GPT)
4. Response Generation
        ↓
WhatsApp Cloud API Response
        ↓
Customer receives reply
```

## 🎉 **Ready to Deploy!**

Your system is **complete** and **configured** for Netlify. Just run:

```bash
netlify deploy --prod
```

Then configure the webhook URL in WhatsApp Business Manager and start testing!

---

**🔥 Key Advantage**: You're using Netlify Functions, which are perfect for WhatsApp webhooks - they handle the serverless scaling automatically and have great cold start performance.