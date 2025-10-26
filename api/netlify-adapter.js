// Adapter to make Express-style handlers work with Netlify Functions

function createNetlifyHandler(expressHandler) {
  return async (event, context) => {
    console.log('[ADAPTER] Event:', JSON.stringify({ httpMethod: event.httpMethod, path: event.path, queryStringParameters: event.queryStringParameters }));

    // Create Express-like req object
    const req = {
      method: event.httpMethod,
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {},
      headers: event.headers || {},
      path: event.path
    };

    // Create Express-like res object
    let statusCode = 200;
    let responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    let responseBody = null;
    let hasResponded = false;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        hasResponded = true;
        responseBody = {
          statusCode,
          headers: responseHeaders,
          body: JSON.stringify(data)
        };
        return responseBody;
      },
      setHeader: (key, value) => {
        responseHeaders[key] = value;
      }
    };

    try {
      // Call the Express-style handler
      const result = await expressHandler(req, res);
      
      // If we got a response body from json(), use it
      if (hasResponded && responseBody) {
        return responseBody;
      }

      // If handler returned a value, use it
      if (result) {
        return result;
      }

      // Otherwise, return a default response
      return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ message: 'Success' })
      };
    } catch (error) {
      console.error('Handler error:', error);
      console.error('Error stack:', error.stack);
      return {
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({ 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        })
      };
    }
  };
}

module.exports = { createNetlifyHandler };
