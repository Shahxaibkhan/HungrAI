# Hungrai Frontend Widget

A lightweight, embeddable React widget for restaurant websites that provides AI-powered food ordering capabilities.

## Features

- 🎯 Single-file React component
- 🎨 Customizable styling
- 📱 Mobile-responsive
- 🔄 Real-time chat
- 🛒 Cart management
- 📋 Order tracking

## Quick Integration

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Restaurant</title>
</head>
<body>
  <!-- Your restaurant website content -->

  <!-- Hungrai Widget -->
  <div id="hungrai-widget"></div>

  <script src="https://your-domain.com/widget.js"></script>
  <script>
    HungraiWidget.init({
      restaurant: 'your-restaurant-slug',
      apiBase: 'https://your-api-domain.com',
      container: '#hungrai-widget'
    });
  </script>
</body>
</html>
```

### Advanced Configuration

```javascript
HungraiWidget.init({
  restaurant: 'demo-burger-bistro',
  apiBase: 'https://api.hungrai.com',
  container: '#hungrai-widget',

  // Styling options
  theme: {
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    backgroundColor: '#000000'
  },

  // Behavior options
  autoOpen: false,
  position: 'bottom-right', // or 'bottom-left'

  // Callbacks
  onOrderPlaced: (orderId) => {
    console.log('Order placed:', orderId);
    // Track conversion, redirect to payment, etc.
  },

  onChatMessage: (message) => {
    console.log('New message:', message);
    // Analytics, etc.
  }
});
```

## Widget API

### Methods

#### `init(config)`
Initialize the widget with configuration options.

#### `open()`
Programmatically open the chat widget.

#### `close()`
Programmatically close the chat widget.

#### `sendMessage(message)`
Send a message to the AI assistant.

#### `getCart()`
Get current cart contents.

#### `clearCart()`
Clear the shopping cart.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `restaurant` | string | required | Restaurant slug identifier |
| `apiBase` | string | required | API base URL |
| `container` | string | `'#hungrai-widget'` | DOM selector for widget container |
| `theme` | object | `{}` | Theme customization options |
| `autoOpen` | boolean | `false` | Auto-open chat on page load |
| `position` | string | `'bottom-right'` | Widget position |
| `onOrderPlaced` | function | `null` | Order placement callback |
| `onChatMessage` | function | `null` | Message callback |

## Styling

The widget comes with default dark theme styling but can be customized:

```css
/* Override widget styles */
#hungrai-widget .hungrai-chat-bubble {
  background: #your-color;
}

#hungrai-widget .hungrai-chat-window {
  border-radius: 16px;
}
```

## Development

### Building the Widget

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build
```

### File Structure

```
frontend-widget/
├── widget.js          # Main widget component
├── widget.min.js      # Minified production build
├── styles.css         # Widget styles
└── README.md          # This file
```

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## License

MIT License
