# Hungrai: Restaurant AI Ordering System

Hungrai is a conversational AI ordering system for restaurants, allowing users to chat with an AI to place food orders naturally.

## Features

- Conversational ordering with natural language understanding
- Cart management and order tracking
- AI response evaluation and quality control pipeline
- Multiple restaurant support with customized menus

## Project Structure

```
hungrai/
├── backend/             # Node.js backend server
│   ├── server.js        # Server entry point
│   ├── package.json     # Backend dependencies
│   ├── seed/            # Database seeding scripts
│   └── src/             # Source code
│       ├── lib/         # Core libraries
│       ├── models/      # Database models
│       ├── routes/      # API routes
│       └── utils/       # Utility functions
├── frontend/            # Customer-facing web frontend
│   ├── app.js           # Main application code
│   ├── index.html       # HTML structure
│   └── style.css        # CSS styling
└── frontend-widget/     # Embeddable website widget
```

## Development

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

Open `frontend/index.html` in a browser or use a simple HTTP server.

### Developer Tools

- **Debug Mode**: Press `Ctrl+Alt+D` to toggle debug mode, which shows AI evaluation metrics
- **Response Quality Control**: The system automatically evaluates AI responses and regenerates them if needed

## Tech Stack

- **Frontend**: Vanilla JavaScript, CSS, HTML
- **Backend**: Node.js, Express
- **AI**: OpenAI API with response quality evaluation pipeline
- **Database**: MongoDB (for restaurant menus and orders)
