// Health function alternative to version.js to avoid any collision
const BUILD = 'v2025-10-28-6';
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'healthy', build: BUILD, timestamp: Date.now() })
  };
};
