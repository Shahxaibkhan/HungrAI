exports.handler = async function (event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: "API is working!",
      timestamp: new Date().toISOString(),
      restaurant: "demo-burger-bistro"
    })
  };
}