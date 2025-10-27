// Dialogflow Client Scaffold (Detect Intent)
// Supports Dialogflow ES initially; can be extended for CX.
// Expects env vars:
//   DIALOGFLOW_PROJECT_ID
//   DIALOGFLOW_LANGUAGE_CODE
//   DIALOGFLOW_SERVICE_ACCOUNT_JSON (raw JSON or base64-encoded)
// If not configured, will return a fallback response indicating unavailable.

const { v4: uuidv4 } = require('uuid');

function loadServiceAccount() {
  const raw = process.env.DIALOGFLOW_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    // Allow base64 encoding
    const maybeJson = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(maybeJson);
  } catch (e) {
    console.error('[DIALOGFLOW] Failed to parse service account JSON:', e.message);
    return null;
  }
}

// Lazy initialization pattern
let dialogflowClient = null;
function getDialogflowClient() {
  if (dialogflowClient) return dialogflowClient;
  const sa = loadServiceAccount();
  if (!sa) {
    console.warn('[DIALOGFLOW] Service account missing - Dialogflow disabled');
    return null;
  }
  try {
    // Dynamically require to avoid failing if library not installed yet
    const dialogflow = require('@google-cloud/dialogflow');
    dialogflowClient = new dialogflow.SessionsClient({
      credentials: {
        client_email: sa.client_email,
        private_key: sa.private_key
      }
    });
    return dialogflowClient;
  } catch (e) {
    console.error('[DIALOGFLOW] Module load error:', e.message);
    return null;
  }
}

/**
 * detectIntent - calls Dialogflow if configured, else returns null.
 * @param {Object} params
 * @param {String} params.text - user input
 * @param {String} params.sessionId - session identifier
 * @returns {Promise<{intent:string, confidence:number, fulfillmentText:string, raw:any}|null>}
 */
async function detectIntent({ text, sessionId }) {
  const projectId = process.env.DIALOGFLOW_PROJECT_ID;
  const languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'en';
  if (!projectId) {
    return { disabled: true, reason: 'PROJECT_ID missing' };
  }
  const client = getDialogflowClient();
  if (!client) {
    return { disabled: true, reason: 'Client not initialized' };
  }
  const sessionPath = client.projectAgentSessionPath(projectId, sessionId || uuidv4());

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text,
        languageCode
      }
    }
  };
  try {
    const responses = await client.detectIntent(request);
    const result = responses[0].queryResult;
    return {
      intent: result.intent?.displayName || 'unknown',
      confidence: result.intentDetectionConfidence || 0,
      fulfillmentText: result.fulfillmentText || '',
      raw: result
    };
  } catch (e) {
    console.error('[DIALOGFLOW] detectIntent error:', e.message);
    return { error: true, message: e.message };
  }
}

module.exports = { detectIntent };
