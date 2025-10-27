// Intent Router Scaffold
// Decides whether to fast-path, Dialogflow, or LLM fallback.
// Exports classifyMessage() returning routing decision.

// Fast path regex patterns (cheap intents)
const FAST_PATTERNS = [
  { intent: 'greeting', patterns: [/^(hi|hello|hey)$/i] },
  { intent: 'show_menu', patterns: [/menu|show (me )?your menu|list items/i] },
  { intent: 'cart_status', patterns: [/cart|my order|what(\'|)s in cart/i] },
  { intent: 'checkout', patterns: [/checkout|place order|confirm order/i] },
  { intent: 'help', patterns: [/help|support|how does/i] }
];

function fastPathIntent(text) {
  for (const fp of FAST_PATTERNS) {
    if (fp.patterns.some(rx => rx.test(text))) return fp.intent;
  }
  return null;
}

/**
 * classifyMessage
 * @param {Object} params
 * @param {String} params.text - normalized user text
 * @param {Object} params.restaurant - restaurant record
 * @returns {Object} routing decision
 */
function classifyMessage({ text, restaurant }) {
  const normalized = (text || '').trim();
  if (!normalized) return { route: 'ignore', reason: 'empty' };

  // 1. Fast path
  const fpIntent = fastPathIntent(normalized.toLowerCase());
  if (fpIntent) {
    return { route: 'fast', intent: fpIntent, reason: 'fast-pattern-match' };
  }

  // 2. Dialogflow-first when enabled
  const mode = restaurant?.ai?.mode || 'hybrid';
  if (mode === 'dialogflow-first' || mode === 'hybrid') {
    return { route: 'dialogflow', reason: 'dialogflow-enabled' };
  }

  // 3. Fallback LLM only
  return { route: 'llm', reason: 'llm-only-mode' };
}

module.exports = { classifyMessage };
