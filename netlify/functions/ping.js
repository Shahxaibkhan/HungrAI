// Simple ping function to verify functions directory routing
const BUILD = 'v2025-10-28-6';
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, build: BUILD, time: Date.now() })
  };
};
