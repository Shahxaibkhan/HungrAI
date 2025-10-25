# 🚀 Hungrai Deployment Guide

## Free Hosting Options

### Recommended: Render (Best for Full-Stack)
- ✅ **Free tier**: 750 hours/month, static sites free
- ✅ **Node.js support**: Perfect for your backend
- ✅ **MongoDB support**: Works with MongoDB Atlas
- ✅ **Custom domains**: Free with Render
- ✅ **Auto-deploy**: From GitHub

### Alternative Options:
- **Railway**: Similar to Render, good free tier
- **Fly.io**: Excellent for Node.js, generous free tier
- **Vercel + Railway**: Frontend on Vercel, backend on Railway

## Step-by-Step Deployment

### 1. Set up MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account → "Deploy a free cluster"
3. Choose "Free" tier → Create cluster
4. Go to "Database" → "Connect" → "Connect your application"
5. Copy the connection string (it looks like: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)

### 2. Set up Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for auto-deploy)
3. Connect your GitHub repository

### 3. Deploy Backend to Render

1. **New → Web Service**
2. **Connect GitHub repo**: `yourusername/hungrai`
3. **Configure service**:
   - **Name**: `hungrai-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

4. **Environment Variables**:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_random_jwt_secret
   NODE_ENV=production
   PORT=10000
   ```

5. **Deploy** → Wait for build to complete

### 4. Deploy Frontend to Render

1. **New → Static Site**
2. **Connect same GitHub repo**
3. **Configure**:
   - **Name**: `hungrai-frontend`
   - **Build Command**: (leave empty)
   - **Publish Directory**: `frontend`
   - **Root Directory**: `frontend`

4. **Environment Variables** (if needed):
   ```
   API_BASE_URL=https://hungrai-backend.onrender.com
   ```

5. **Deploy**

### 5. Update Frontend API URL

After backend deploys, update `frontend/app.js`:

```javascript
// Change this line:
const apiBase = "http://localhost:4000";

// To this (replace with your Render URL):
const apiBase = "https://hungrai-backend.onrender.com";
```

### 6. Test Your Demo

1. **Backend URL**: `https://hungrai-backend.onrender.com`
2. **Frontend URL**: `https://hungrai-frontend.onrender.com`
3. **API Test**: `https://hungrai-backend.onrender.com/`

## Troubleshooting

### Common Issues:

**Build Fails:**
- Check that all dependencies are in `backend/package.json`
- Ensure `.env.example` variables are set in Render

**Database Connection:**
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0 for testing)
- Check connection string format

**Frontend API Calls:**
- Update `apiBase` URL in `frontend/app.js`
- Check CORS settings in backend

**Cold Starts:**
- Free tier has cold starts (10-30 seconds)
- First request after inactivity will be slow

## Cost Optimization

**Free Tier Limits:**
- Render: 750 hours/month (~$0)
- MongoDB Atlas: 512MB storage free
- OpenAI: Pay per token used

**Upgrade Path:**
- Render: $7/month for 10x more resources
- MongoDB: $9/month for 2GB storage
- OpenAI: Usage-based pricing

## Custom Domain (Optional)

1. Go to Render dashboard
2. Select your service → Settings → Custom Domain
3. Add your domain (free with Render)

## Monitoring

- **Render Logs**: View in dashboard
- **MongoDB**: Monitor in Atlas dashboard
- **Uptime**: Render provides basic monitoring

---

**🎉 Your Hungrai demo will be live at:** `https://hungrai-frontend.onrender.com`