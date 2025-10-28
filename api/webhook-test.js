// Simple webhook test without authentication
async function handler(event, context) {
  console.log('=== WEBHOOK TEST ===');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Query:', JSON.stringify(event.queryStringParameters, null, 2));
  console.log('Body:', event.body);
  console.log('===================');

  if (event.httpMethod === 'GET') {
    // Verification challenge
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];
    
    console.log('Verification request:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('Verification successful');
      return { statusCode: 200, body: challenge };
    }
    console.log('Verification failed');
    return { statusCode: 403, body: 'Forbidden' };
  }

  if (event.httpMethod === 'POST') {
    try {
      console.log('Processing POST request...');
      const body = JSON.parse(event.body || '{}');
      console.log('Parsed body:', JSON.stringify(body, null, 2));
      
      return { 
        statusCode: 200, 
        body: JSON.stringify({ 
          received: true,
          timestamp: new Date().toISOString(),
          message: "Test webhook received message successfully"
        })
      };
    } catch (error) {
      console.error('Error processing POST:', error);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
}

module.exports.handler = handler;