# 📱 WhatsApp Testing Guide

## Test Messages to Send

Send these messages to your WhatsApp Business number (**+817693608099449** or your configured number):

### 1. **Welcome Test**
```
Hi
```
**Expected**: Welcome message with restaurant info

### 2. **Menu Request**
```
menu
```
**Expected**: Full restaurant menu with categories and prices

### 3. **Natural Order**
```
I want a cheeseburger
```
**Expected**: Confirms burger added to cart

### 4. **Multiple Items**
```
I'd like 2 pizzas and some fries
```
**Expected**: Adds both items to cart

### 5. **Check Cart**
```
cart
```
**Expected**: Shows current cart contents and total

### 6. **Modify Order**
```
remove burger
```
**Expected**: Removes burger from cart

### 7. **Checkout**
```
checkout
```
**Expected**: Shows order summary and checkout process

## 🔍 Monitoring

### View Function Logs
```bash
netlify logs --function=whatsapp-webhook --live
```

### Check for Errors
- If messages aren't being received, check webhook configuration
- If responses seem slow, check function timeout settings
- If AI responses are odd, check OpenAI API quota

## 🎯 Expected Flow

```
Customer sends "Hi" 
    ↓
WhatsApp → Your Webhook → AI Processing → Response
    ↓
Customer receives: "Welcome to HungerAI Demo! 🍽️ I can help you order delicious food. Say 'menu' to get started!"
```

## 🚨 Troubleshooting

### Common Issues:
1. **No response**: Check webhook URL and verify token
2. **Error responses**: Check function logs for details
3. **Wrong menu**: Verify restaurant phone number ID matches
4. **Cart not working**: Check MongoDB connection

### Success Indicators:
- ✅ Webhook verification returns challenge
- ✅ Messages trigger function execution
- ✅ Responses arrive within 5 seconds
- ✅ Cart persists across conversations
- ✅ AI understands natural language orders