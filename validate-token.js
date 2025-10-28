// Simple WhatsApp access token validator
// Usage: node validate-token.js <ACCESS_TOKEN> <PHONE_NUMBER_ID>
// PHONE_NUMBER_ID optional; will default to env WHATSAPP_PHONE_NUMBER_ID.

const https = require('https');

function validate(token, phoneId) {
  return new Promise((resolve, reject) => {
    const id = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token) return reject(new Error('Missing token arg'));
    if (!id) return reject(new Error('Missing phone number ID (arg or env WHATSAPP_PHONE_NUMBER_ID)'));
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v18.0/${id}/messages?limit=1`,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const token = process.argv[2];
  const phoneId = process.argv[3];
  try {
    const result = await validate(token, phoneId);
    console.log('Validation result:', result);
    if (result.status === 401) {
      console.error('Token invalid or expired.');
      process.exit(1);
    }
    console.log('Token appears valid (status', result.status, ').');
  } catch (e) {
    console.error('Validation error:', e.message);
    process.exit(1);
  }
})();
