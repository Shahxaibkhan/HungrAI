# Hungrai Test Cases

## Basic Interaction Tests
1. ✅ **Greeting**: System should welcome user and introduce itself
2. ✅ **Menu Display**: System should display menu items when asked
3. ✅ **Item Recommendation**: System should recommend items when asked

## Cart Management Tests
4. ✅ **Add Single Item**: System should add a specific item when requested
5. ✅ **Add Multiple Items**: System should add multiple specified items
6. ✅ **Add All Items**: System should add all menu items when requested
7. ✅ **Cart State Awareness**: System should maintain correct cart state between messages
8. ✅ **Cart Contents Display**: System should display current cart contents correctly when asked

## Confirmation Flow Tests
9. ✅ **Simple Confirmation**: System should confirm order when explicitly requested
10. ✅ **Yes to Checkout**: System should process checkout when user says "yes" after checkout suggestion
11. ✅ **No More Items**: System should recognize when user doesn't want more items
12. ⚠️ **Empty Cart Warning**: System should warn if user tries to checkout with empty cart

## Intent Recognition Tests
13. ✅ **Yes after Recommendation**: System should add items when user says "yes" after a recommendation
14. ✅ **Yes after Checkout Question**: System should NOT add items again when user says "yes" to checkout
15. ✅ **Keywords in Response**: System should identify relevant menu items from user keywords
16. ✅ **Context-Aware Yes**: System should understand "yes" differently based on conversation context

## Edge Case Tests
17. ✅ **Ambiguous Response**: System should ask for clarification on ambiguous user inputs
18. ⚠️ **Correction of Cart Errors**: System should never claim cart is empty when it has items
19. ✅ **Prevent Duplicate Additions**: System should not add same items repeatedly
20. ✅ **Session Persistence**: Cart should persist across multiple messages in same session

## Evaluation Pipeline Tests
21. ✅ **Response Quality**: System should evaluate response quality before showing to user
22. ✅ **Response Improvement**: System should improve responses that fail evaluation
23. ✅ **No Evaluation Text Leakage**: System should never show evaluation text to users
24. ✅ **Debug Mode**: Debug mode should show evaluation information when enabled

## Self-Learning Tests
25. ✅ **Cart State Learning**: System should improve cart awareness over time
26. ✅ **Error Pattern Recognition**: System should recognize and learn from common errors
27. ✅ **Conversation State Tracking**: System should track and use conversation state for context
28. ✅ **Adaptive Prompting**: System should adapt prompts based on learning history

## Test Scenarios

### Test Scenario 1: Basic Ordering Flow
```
User: Hi
Bot: Hi! I'm Hungrai for Demo Burger Bistro. What would you like to order today?
User: Show me the menu
Bot: [Shows menu with all items]
User: I'll take the burger
Bot: [Adds Truffle Melt Burger to cart]
User: Add fries too
Bot: [Adds Loaded Fries to cart]
User: What's in my cart?
Bot: [Shows Truffle Melt Burger and Loaded Fries with correct prices]
User: Checkout
Bot: [Confirms order with correct items and total]
```

### Test Scenario 2: "Yes" Context Awareness
```
User: What do you recommend?
Bot: [Recommends an item]
User: Yes
Bot: [Adds recommended item to cart]
User: What's my total?
Bot: [Shows correct total with items]
User: Would you like to checkout?
User: Yes
Bot: [Proceeds to checkout without adding items again]
```

### Test Scenario 3: "Order All" Test
```
User: I want to order all items on the menu
Bot: [Confirms all items]
User: Yes
Bot: [Adds all items to cart once]
User: checkout
Bot: [Proceeds to checkout with all items, correct total]
```

### Test Scenario 4: Empty Cart Test
```
User: Hi
Bot: [Greeting]
User: Checkout
Bot: [Warning about empty cart]
```

### Test Scenario 5: Cart Persistence Test
```
User: Add burger
Bot: [Adds burger to cart]
User: What else is good?
Bot: [Recommendations]
User: What's in my cart now?
Bot: [Shows burger in cart]
```

### Test Scenario 6: Self-Learning Test
```
User: Add fries
Bot: [Adds fries to cart]
User: What is my total?
Bot: [Shows fries with correct price]
User: I want to check out
Bot: [Confirms checkout with correct items]
```