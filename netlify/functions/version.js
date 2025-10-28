// Health/version endpoint for deployment verification
const BUILD_VERSION = 'v2025-10-28-3';
exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ build: BUILD_VERSION, timestamp: Date.now() })
  };
};
