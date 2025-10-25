export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userPhone = "guest", sessionId } = req.body;
    const { slug } = req.query;

    // Simple test response
    const menuItems = [
      { title: 'Truffle Melt Burger', price: 1850 },
      { title: 'Smoky BBQ Chicken', price: 1550 },
      { title: 'Loaded Fries', price: 690 }
    ];

    if (message.toLowerCase().includes('menu') || message.toLowerCase().includes('show')) {
      const menuText = menuItems.map(item => `• ${item.title} - Rs.${item.price}`).join('\n');
      return res.json({
        reply: `Here's our menu:\n${menuText}\n\nWhat would you like to order?`,
        _cartStatus: { items: 0, snapshot: [] },
        sessionKey: `test-${Date.now()}`
      });
    }

    return res.json({
      reply: `Hello! I'm Hungrai for ${slug}. You said: "${message}". Try saying "show menu" to see our options!`,
      _cartStatus: { items: 0, snapshot: [] },
      sessionKey: `test-${Date.now()}`
    });

  } catch (e) {
    console.error("Chat route error:", e);
    res.status(500).json({ error: e.message });
  }
}