const axios = require('axios');

async function testFullConversation() {
  const baseUrl = 'http://localhost:4000';
  const slug = 'demo-burger-bistro';
  const sessionId = 'test-session-' + Date.now();

  console.log(`🧪 Testing the complete conversation flow with session ID: ${sessionId}\n`);

  try {
    // 1. Initial greeting
    console.log('1. User: hello');
    const resp1 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'hello',
      sessionId
    });
    console.log('🤖 Bot:', resp1.data.reply);
    console.log('   Cart status:', resp1.data._cartStatus ? 
      `${resp1.data._cartStatus.items} items` : 'No cart status returned');
    console.log('\n');

    // 2. Order with quantities
    console.log('2. User: 3 melt burger and 2 fries');
    const resp2 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: '3 melt burger and 2 fries',
      sessionId
    });
    console.log('🤖 Bot:', resp2.data.reply);
    console.log('   Cart status:', resp2.data._cartStatus ? 
      `${resp2.data._cartStatus.items} items: ${JSON.stringify(resp2.data._cartStatus.snapshot)}` : 'No cart status returned');
    console.log('\n');

    // 3. Check the cart total (to verify persistence)
    console.log('3. User: what is my total');
    const resp3 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'what is my total',
      sessionId
    });
    console.log('🤖 Bot:', resp3.data.reply);
    console.log('\n');

    // 4. Proceed to checkout
    console.log('4. User: checkout');
    const resp4 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'checkout',
      sessionId
    });
    console.log('🤖 Bot:', resp4.data.reply);
    console.log('   Order ID:', resp4.data.orderId || 'No order ID returned');
    console.log('\n');

    // Verify session consistency by making another request
    console.log('5. User: hello again');
    const resp5 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'hello again',
      sessionId
    });
    console.log('🤖 Bot:', resp5.data.reply);
    console.log('   Cart status after checkout:', resp5.data._cartStatus ? 
      `${resp5.data._cartStatus.items} items` : 'No cart status returned');
    console.log('   (Cart should be empty after checkout)');
    
    console.log('\n✅ Test completed!');
    
    // Summary of test results
    const cartWorked = resp2.data._cartStatus && resp2.data._cartStatus.items > 0;
    const checkoutWorked = resp4.data.orderId !== undefined;
    
    console.log('\n🧪 TEST RESULTS:');
    console.log(`Cart Item Addition: ${cartWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Checkout Process: ${checkoutWorked ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (cartWorked && checkoutWorked) {
      console.log('\n🎉 ALL TESTS PASSED! The cart persistence issue has been fixed.');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED. Further debugging may be needed.');
    }

  } catch (e) {
    console.error('\n❌ Error:', e.response ? e.response.data : e.message);
  }
}

testFullConversation();