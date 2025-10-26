# Hungrai - AI Restaurant Ordering System 🍔🤖

Hungrai is a conversational AI system for restaurant ordering that uses GPT-4o-mini to provide a natural language ordering experience. Users can chat with the AI to explore menus, get recommendations, add items to their cart, and check out.

## ✨ Features

- 💬 **Natural Language Ordering** - Chat naturally with AI to place orders
- 🛒 **Smart Cart Management** - AI tracks your order with quantity and total awareness
- 🎯 **Clarification Detection** - Prevents duplicate additions when asking about existing orders
- 📦 **Session Persistence** - Cart and conversation state maintained across interactions
- 🚀 **Serverless Architecture** - Scalable deployment on Netlify
- 🎨 **Professional UI** - Clean, light theme with responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- OpenAI API key
- Netlify account (optional, for deployment)

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
# MONGO_URI=your_mongodb_connection_string
# OPENAI_API_KEY=your_openai_api_key
# JWT_SECRET=your_jwt_secret

# Seed database with demo data
node seedDatabase.js

# Run development server (Netlify Dev)
netlify dev

# Or serve frontend only
cd frontend
npx http-server -p 8080

# Visit http://localhost:8080 (or port shown by netlify dev)
```

## 📁 Project Structure

```
hungrai/
├── api/                  # 🖥️  Serverless Functions (Netlify)
│   ├── chat.js           # Main chat endpoint with AI logic
│   ├── orders.js         # Order status and management
│   ├── test.js           # Health check endpoint
│   ├── promptOrchestrator.js  # LLM prompt construction & evaluation
│   ├── netlify-adapter.js     # Express-to-serverless adapter
│   └── *.js              # Mongoose models (Restaurant, MenuItem, Order, User)
├── frontend/             # 🎨 Main web application
│   ├── index.html        # Main app interface
│   ├── app.js            # Frontend logic
│   └── style.css         # Light theme styling
├── frontend-widget/      # 🔌 Embeddable chat widget (legacy)
├── demos/                # 🎯 Demo implementations
├── docs/                 # 📚 Documentation
├── seedDatabase.js       # Database seeding script
├── netlify.toml          # Netlify configuration
└── package.json          # Dependencies
```

## 🎯 Architecture

### Serverless Functions (`api/`)
Modern serverless architecture deployed on Netlify for scalability and performance.

**Key Features:**
- File-based session management (stored in `/tmp` for serverless compatibility)
- MongoDB connection pooling with single-connection guard
- Express-like adapter for seamless migration from traditional backend
- Evaluation loop for LLM response quality (disabled in production for performance)

### Chat Flow
1. User sends message to `/api/chat?slug=restaurant-slug`
2. Session loaded/created with cart state
3. AI analyzes intent and menu context
4. Response generated with cart awareness
5. Cart updated if items added/removed
6. Session persisted for next interaction

### Frontend (`frontend/`)
Single-page application with vanilla JavaScript.

## 🔧 Development

### API Endpoints
- **Base URL (Production)**: `https://your-site.netlify.app/api`
- **Base URL (Local)**: `http://localhost:8888/api` (via `netlify dev`)

### Key Endpoints
- `POST /api/chat?slug=restaurant-slug` - Send chat message
  - Body: `{ message: string, sessionId: string }`
- `GET /api/orders?orderId=xxx` - Get order status
- `POST /api/orders` - Update order status (internal)
- `GET /api/test` - Health check

### Environment Variables
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/hungrai
OPENAI_API_KEY=sk-...
JWT_SECRET=your_random_secret_key
SKIP_EVALUATION=true  # Disable LLM evaluation loop in production
```

**Note:** In production (Netlify), set these in the Netlify dashboard under Site Settings → Environment Variables.

## 🧪 Testing

### Database Seeding
```bash
# Ensure .env file is configured
node seedDatabase.js
```

### Manual Testing Flow
1. Visit your deployed site or run `netlify dev`
2. Select "Demo Burger Bistro"
3. Test conversation:
   - "Show me the menu"
   - "I want 2 burgers and fries"
   - "What's in my cart?"
   - "What's my total?"
   - "Checkout"
4. Track your order status

### Key Test Scenarios
- ✅ Menu browsing
- ✅ Adding items with quantities
- ✅ Cart inquiry without duplication
- ✅ Total calculation
- ✅ Checkout flow
- ✅ Order tracking

## 🚀 Deployment

### Netlify Deployment (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
netlify deploy --prod
```

### Configuration Steps:
1. Connect your GitHub repository to Netlify
2. Set build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `frontend`
   - **Functions directory**: `api`
3. Add environment variables in Netlify dashboard
4. Deploy!

### Post-Deployment:
- Seed your production database: `node seedDatabase.js` (with production MONGO_URI)
- Test the `/api/test` endpoint for health check
- Monitor function logs in Netlify dashboard

## 🔒 Production Optimization

- ✅ Evaluation loop disabled (`SKIP_EVALUATION=true`) to prevent 30s timeouts
- ✅ Session storage in `/tmp` for serverless compatibility
- ✅ MongoDB connection reuse with singleton pattern
- ✅ Clarification detection to prevent cart duplication
- ✅ Cart state awareness in system prompts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 🐛 Known Issues & Solutions

### Cart Duplication
**Fixed:** Added clarification detection to prevent re-adding items when user asks "what's in my cart?" or similar questions.

### Evaluation Timeout
**Fixed:** Disabled evaluation loop in production via `SKIP_EVALUATION=true` environment variable.

### Session Persistence in Serverless
**Fixed:** Moved session storage from project directory to `/tmp` directory for serverless write access.

## 📚 Documentation

- `/docs/DEPLOYMENT.md` - Detailed deployment guide
- `/docs/test-cases.md` - Comprehensive test scenarios
- `/docs/ENHANCED-README.md` - Extended documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Shahxaibkhan/HungrAI/issues)
- **Repository**: [GitHub](https://github.com/Shahxaibkhan/HungrAI)

---

Built with ❤️ using Node.js, OpenAI GPT-4o-mini, MongoDB, and Netlify
