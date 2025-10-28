// Health/version endpoint for deployment verification
const BUILD_VERSION = 'v2025-10-28-6';
console.log(`[BOOT] version function loaded build=${BUILD_VERSION}`);
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ build: BUILD_VERSION, timestamp: Date.now() })
  };
};
