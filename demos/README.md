# Hungrai Demo

Simple demonstration of the Hungrai AI ordering system with an embedded chat widget.

## What This Demo Shows

- **Embedded Widget**: How the chat widget appears on a restaurant website
- **Basic Integration**: Minimal setup required for integration
- **Real-time Chat**: Live AI conversation with order placement
- **Order Tracking**: Complete order lifecycle demonstration

## Running the Demo

### Prerequisites
- Backend server running on `http://localhost:4000`
- Demo restaurant data seeded in database

### Start Demo
```bash
# From project root
cd demos
# Open index.html in browser or serve with HTTP server
npx http-server -p 3000
# Visit http://localhost:3000
```

## Demo Features

### Chat Widget
- Floating chat bubble in bottom-right corner
- Expandable chat window
- Real-time messaging with AI assistant
- Order placement and confirmation

### Sample Interactions
```
User: Hi, what's on the menu?
AI: Shows available items with descriptions and prices

User: I'll take the burger and fries
AI: Adds items to cart, shows updated total

User: Checkout please
AI: Processes order, provides order ID and tracking
```

## Integration Code

The demo uses this simple integration:

```html
<script>
  // Embedded widget code (from index.html)
  const restaurant = "demo-burger-bistro";
  const apiBase = "http://localhost:4000";
  // ... widget initialization
</script>
```

## Testing the Demo

1. **Click the chat bubble** to open the widget
2. **Try natural language ordering**:
   - "Show me the menu"
   - "I want a burger"
   - "Add fries too"
   - "What's my total?"
   - "Checkout"
3. **Observe order tracking** after checkout
4. **Test multiple conversations** (each gets unique session)

## Demo vs Full App

| Feature | Demo Widget | Full App (`frontend/`) |
|---------|-------------|----------------------|
| UI | Minimal embedded | Full restaurant selection |
| Setup | Single restaurant | Multi-restaurant support |
| Styling | Basic inline | Professional dark theme |
| Features | Core chat + orders | Advanced UI + tracking |

## Customization

### Styling
Modify the inline styles in `index.html` to match your brand:

```javascript
Object.assign(bubble.style, {
  background: "#your-brand-color",
  // ... other styles
});
```

### Restaurant
Change the `restaurant` variable to test different restaurants:

```javascript
const restaurant = "your-restaurant-slug";
```

## Troubleshooting

### Widget Not Loading
- Ensure backend is running on port 4000
- Check browser console for errors
- Verify restaurant slug exists in database

### Chat Not Responding
- Check network tab for API calls
- Verify OpenAI API key is configured
- Check backend logs for errors

### Orders Not Placing
- Ensure database is seeded with menu items
- Check session persistence
- Verify order model is properly configured

## Next Steps

After testing the demo, try the full application:

```bash
cd ../frontend
npx http-server -p 8080
# Visit http://localhost:8080
```

This provides the complete Hungrai experience with restaurant browsing, advanced chat features, and comprehensive order tracking.