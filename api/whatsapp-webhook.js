// WhatsApp Cloud API Webhook handler (initial scaffold)
// Handles verification (GET) and incoming messages (POST)
// Uses environment variables:
//   WHATSAPP_VERIFY_TOKEN - webhook verification token
//   (future) WHATSAPP_ACCESS_TOKEN - for sending replies

const { createNetlifyHandler } = require('./netlify-adapter');
const Restaurant = require('./Restaurant');
const crypto = require('crypto');

// Normalize inbound WhatsApp message structure
function normalizeMessage(entry) {
  try {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};
      const messages = value.messages || [];
      if (!messages.length) continue;
      return messages.map(m => ({
        from: m.from,
        id: m.id,
        timestamp: m.timestamp,
        type: m.type,
        text: m.text?.body || '',
        raw: m,
        whatsappBusinessAccountId: value.metadata?.display_phone_number,
        phoneNumberId: value.metadata?.phone_number_id
      }));
    }
  } catch (e) {
    console.error('[WHATSAPP] normalize error', e.message);
  }
  return [];
}

async function handler(event, context) {
  try {
    if (event.httpMethod === 'GET') {
      // Verification challenge
      const params = event.queryStringParameters || {};
      const mode = params['hub.mode'];
      const token = params['hub.verify_token'];
      const challenge = params['hub.challenge'];
      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('[WHATSAPP] Webhook verified');
        return { statusCode: 200, body: challenge };
      }
      return { statusCode: 403, body: 'Forbidden' };
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = JSON.parse(event.body || '{}');
    const entry = body.entry || [];

    const allMessages = [];
    for (const ent of entry) {
      const msgs = normalizeMessage(ent);
      allMessages.push(...msgs);
    }

    if (!allMessages.length) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, messages: 0 }) };
    }

    // TODO: map phoneNumberId to restaurant record
    // For now just log
    for (const msg of allMessages) {
      console.log(`[WHATSAPP INBOUND] from=${msg.from} type=${msg.type} text="${msg.text}"`);
    }

    // Basic echo response placeholder
    // (Actual send requires calling WhatsApp Cloud API with access token)

    return {
      statusCode: 200,
      body: JSON.stringify({ received: allMessages.length })
    };
  } catch (err) {
    console.error('[WHATSAPP] Handler error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

module.exports.handler = createNetlifyHandler(handler);
