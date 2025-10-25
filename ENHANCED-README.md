# Hungrai - AI Restaurant Ordering System

Hungrai is a conversational AI system for restaurant ordering that uses GPT-4.1-mini to provide a natural language ordering experience. Users can chat with the AI to explore menus, get recommendations, add items to their cart, and check out.

## Key Features

- 💬 Natural conversational ordering experience
- 🛒 Intelligent cart management
- 🧠 Self-learning and self-improving AI
- 🔄 Response quality evaluation pipeline
- 🔍 Debug mode for developers (Ctrl+Alt+D)

## Project Architecture

### Frontend
- Vanilla JavaScript chat interface
- Clean, responsive design
- Real-time typing indicators
- Debug mode for developers

### Backend
- Node.js with Express
- MongoDB for data storage
- Session-based cart management
- OpenAI API integration with GPT-4.1-mini

## Self-Learning Capabilities

The system includes multiple self-improvement mechanisms:

1. **Evaluation Pipeline**: Every AI response is evaluated for quality before being shown to users
2. **Learning Store**: The system tracks common errors and successful patterns
3. **Conversation State Machine**: Maintains context awareness across messages
4. **Cart State Validation**: Prevents incorrect cart information from reaching users
5. **Pattern Recognition**: Learns from successful interactions to improve future responses

## Setup Instructions

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the `backend` directory with:
   ```
   MONGO_URI=your_mongodb_connection_string
   OPENAI_API_KEY=your_openai_api_key
   PORT=4000
   ```

3. Seed the database:
   ```
   node seed/seedDemo.js
   ```

4. Start the server:
   ```
   node server.js
   ```

5. Open the frontend:
   - Navigate to the `frontend` directory
   - Open `index.html` in your browser

## Testing

Run the test script to validate functionality:
```
node test-script.js
```

For detailed test cases, see `test-cases.md`.

## Debugging

Press `Ctrl+Alt+D` while using the application to toggle debug mode, which shows evaluation information for each response.

## Recent Improvements

### Cart State Awareness
- Enhanced state tracking to maintain consistent cart information
- Added validation to prevent incorrect "empty cart" messages
- Implemented cart verification before checkout

### Intent Recognition
- Improved context-aware interpretation of user responses
- Added state machine to track conversation flow
- Enhanced detection of checkout intent vs. addition intent

### Self-Evolution System
- Implemented learning store to track and learn from interactions
- Added pattern recognition for successful response structures
- Enhanced evaluation criteria based on common error patterns

### Safety Measures
- Added multiple validation layers to prevent incorrect responses
- Implemented thorough text cleaning to prevent evaluation text leakage
- Added fallback mechanisms for handling edge cases

## Limitations and Future Work

- Add support for more complex orders (modifiers, quantity changes)
- Implement user authentication for order history
- Add multi-language support
- Expand restaurant management features
- Implement proper database storage for learning data