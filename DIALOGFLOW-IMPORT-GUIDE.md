# Dialogflow Bulk Import Guide

This file contains a complete Dialogflow ES agent configuration with 14 intents and menu item entities ready for restaurant ordering.

## What's Included

### Intents (14 total):
1. **greeting** - Welcome messages, conversation starters
2. **show_menu** - Display menu, categories, items
3. **add_item** - Add items to cart with quantity (parameters: item_name, quantity)
4. **remove_item** - Remove items from cart (parameters: item_name)
5. **change_quantity** - Modify item quantities (parameters: item_name, quantity)
6. **cart_status** - Show current cart contents
7. **checkout_start** - Begin checkout process
8. **confirm_checkout** - Confirm order placement
9. **cancel_order** - Clear cart, cancel order
10. **order_status** - Check order status (parameters: order_id)
11. **help** - Instructions and guidance
12. **thanks** - Acknowledge gratitude
13. **goodbye** - End conversation
14. **Default Fallback Intent** - Handles unrecognized input (auto-created)

### Entity Types:
- **@menu_item** - All menu items with synonyms and variations

### Training Phrases:
- 10-15 diverse examples per intent
- Covers formal/informal language
- Includes quantity variations
- Multi-item scenarios

### Response Templates:
- 2-3 variations per intent for natural conversation
- Uses parameter substitution ($item_name, $quantity)
- Designed for backend fulfillment integration

## How to Import

### Method 1: Dialogflow Console (Recommended)
1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Create new agent or select existing one
3. Go to **Settings** ⚙️ → **Export and Import**
4. Click **Import From ZIP**
5. Create a ZIP file containing only `dialogflow-bulk-import.json`
6. Upload and import
7. Train the agent

### Method 2: Using ZIP File
1. Create a folder named `dialogflow-export`
2. Copy `dialogflow-bulk-import.json` into it
3. Rename the JSON file to `agent.json`
4. ZIP the folder
5. Import via Dialogflow Console

### Method 3: Google Cloud CLI (Advanced)
```bash
# Install gcloud CLI and authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Import using REST API (requires formatting)
# This method needs additional setup - use Console method instead
```

## Post-Import Steps

### 1. Verify Entity Mapping
- Check that @menu_item entity was created
- Add any missing menu items specific to your restaurant
- Update synonyms to match local language/slang

### 2. Test Intent Recognition
Try these sample phrases in the simulator:
- "hi" → should trigger greeting
- "show menu" → should trigger show_menu
- "add 2 zinger burgers" → should trigger add_item with item_name=Zinger Burger, quantity=2
- "what's in my cart" → should trigger cart_status
- "checkout" → should trigger checkout_start

### 3. Configure Fulfillment (Required)
Enable webhook fulfillment for dynamic responses:
1. Go to **Fulfillment** in Dialogflow
2. Enable **Webhook**
3. Set webhook URL to: `https://your-domain.netlify.app/.netlify/functions/whatsapp-webhook`
4. Enable webhook for relevant intents

### 4. Customize Responses
The included responses are templates. You'll likely want to:
- Replace static responses with webhook calls
- Add dynamic menu content
- Implement cart management
- Add order confirmation logic

## Integration with Your Backend

### Expected Webhook Request Format:
```json
{
  "queryResult": {
    "intent": {
      "displayName": "add_item"
    },
    "parameters": {
      "item_name": "Zinger Burger",
      "quantity": 2
    },
    "queryText": "add 2 zinger burgers"
  },
  "session": "projects/PROJECT_ID/agent/sessions/SESSION_ID"
}
```

### Expected Response Format:
```json
{
  "fulfillmentText": "Added 2 Zinger Burgers to cart. Anything else?",
  "fulfillmentMessages": [
    {
      "text": {
        "text": ["Added 2 Zinger Burgers to cart. Anything else?"]
      }
    }
  ]
}
```

## Confidence Threshold Tuning

Start with default settings, then adjust based on logs:
- Too many fallbacks → Lower confidence threshold
- Wrong intent classifications → Raise confidence threshold
- Monitor via Dialogflow Analytics

## Multi-Item Handling

Some phrases like "add zinger and fries" may only extract one item. Handle these in your webhook:
1. Check if query text contains multiple known items
2. Extract additional items using string matching
3. Return appropriate response

## Testing Checklist

After import, verify:
- [ ] All 14 intents imported successfully
- [ ] @menu_item entity has all items
- [ ] Parameter extraction works for add_item
- [ ] Fallback intent handles unknown phrases
- [ ] Webhook URL configured (if using)
- [ ] Agent responds appropriately in simulator

## Common Issues

### Import Fails
- Ensure JSON is valid (check syntax)
- File must be named `agent.json` inside ZIP
- Check project permissions

### Poor Intent Recognition
- Add more diverse training phrases
- Use more synonyms in entities
- Avoid overly similar phrases across intents
- Train agent after changes

### Parameter Extraction Issues
- Verify entity values match exactly
- Check parameter configuration
- Add more training phrases with parameter examples

## Next Steps

1. Import this configuration
2. Test basic intent recognition
3. Set up webhook fulfillment
4. Integrate with your WhatsApp backend
5. Add restaurant-specific customizations
6. Monitor and improve based on real usage

## Support

If you encounter issues:
1. Check Dialogflow documentation
2. Use the Dialogflow simulator for testing
3. Monitor logs in Cloud Console
4. Test with simple phrases first, then add complexity

This configuration provides a solid foundation for restaurant ordering via WhatsApp with Dialogflow + GPT fallback architecture.