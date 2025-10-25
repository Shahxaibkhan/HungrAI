# Hungrai - AI Restaurant Ordering System

Hungrai is a conversational AI system for restaurant ordering that uses GPT-4.1-mini to provide a natural language ordering experience. Users can chat with the AI to explore menus, get recommendations, add items to their cart, and check out.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)
- OpenAI API key

### Setup
```bash
# Backend setup
cd backend
npm install
cp .env.example .env  # Add your API keys
npm run seed          # Populate demo data
npm start

# Frontend (in another terminal)
cd ../frontend
npx http-server -p 8080 -c-1

# Visit http://localhost:8080
```

## 📁 Project Structure

```
hungrai/
├── backend/              # 🖥️  Node.js/Express API server
│   ├── src/
│   │   ├── models/       # Database schemas
│   │   ├── routes/       # API endpoints
│   │   ├── lib/          # Core AI logic
│   │   └── utils/        # Helper functions
│   ├── seed/             # Database seeding
│   └── package.json
├── frontend/             # 🎨 Main web application
│   ├── index.html        # Main app interface
│   ├── app.js            # Frontend logic
│   └── style.css         # Dark theme styling
├── frontend-widget/      # 🔌 Embeddable chat widget
│   ├── widget.js         # Single-file React widget
│   └── README.md
├── demos/                # 🎯 Demo implementations
│   └── index.html        # Simple embedded widget demo
└── docs/                 # 📚 Documentation
    ├── test-cases.md     # Comprehensive test scenarios
    └── scaffold.js       # Original project scaffold
```

## 🎯 Applications

### Main Application (`frontend/`)
Full-featured web app with restaurant selection, chat interface, and order tracking.

### Widget (`frontend-widget/`)
Embeddable React component for restaurant websites.

### Demo (`demos/`)
Simple HTML page demonstrating widget integration.

## 🔧 Development

### Backend API
- **Base URL**: `http://localhost:4000`
- **Auth**: JWT-based authentication
- **Database**: MongoDB with Mongoose ODM
- **AI**: OpenAI GPT-4.1-mini integration

### Key Endpoints
- `POST /api/chat/:restaurant/message` - Send chat message
- `GET /api/orders/:id` - Get order status
- `GET /api/restaurants` - List restaurants

### Environment Variables
```env
MONGO_URI=mongodb://localhost:27017/hungrai
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret
PORT=4000
```

## 🧪 Testing

```bash
# Run test script
node test-script.js

# View detailed test cases
cat docs/test-cases.md
```

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
Static hosting (Vercel, Netlify, etc.)

### Database
MongoDB Atlas or self-hosted MongoDB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/hungrai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/hungrai/discussions)
- **Documentation**: Check the `docs/` directory
