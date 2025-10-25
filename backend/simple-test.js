const axios = require('axios');

async function testConversation() {
  const baseUrl = 'http://localhost:4000';
  const slug = 'demo-burger-bistro';
  const sessionId = 'test-session-' + Date.now();

  console.log('🧪 Testing the fixed quantity and total calculation logic...\n');

  try {
    // Simulate the conversation from the user's example
    console.log('1. User: can i order 2 fires and 1 burger each');
    const resp1 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'can i order 2 fires and 1 burger each',
      sessionId
    });
    console.log('🤖 Bot:', resp1.data.reply);

    console.log('\n2. User: what is the final total?');
    const resp2 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'what is the final total?',
      sessionId
    });
    console.log('🤖 Bot:', resp2.data.reply);

    console.log('\n3. User: yes');
    const resp3 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'yes',
      sessionId
    });
    console.log('🤖 Bot:', resp3.data.reply);

    console.log('\n4. User: confirm my order');
    const resp4 = await axios.post(`${baseUrl}/api/chat/${slug}/message`, {
      message: 'confirm my order',
      sessionId
    });
    console.log('🤖 Bot:', resp4.data.reply);

    console.log('\n✅ Test completed!');

  } catch (e) {
    console.error('❌ Error:', e.response ? e.response.data : e.message);
  }
}

testConversation();