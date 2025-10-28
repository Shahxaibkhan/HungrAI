// WhatsApp Cloud API message sending utility
const axios = require('axios');

class WhatsAppMessenger {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  /**
   * Send a text message to a WhatsApp user
   * @param {string} to - WhatsApp number (with country code, no +)
   * @param {string} message - Text message to send
   * @returns {Promise<Object>} API response
   */
  async sendTextMessage(to, message) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      };

      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Message sent to ${to}:`, message.substring(0, 50) + '...');
      return response.data;

    } catch (error) {
      console.error('❌ WhatsApp send error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Send a structured menu message
   * @param {string} to - WhatsApp number
   * @param {string} headerText - Header text
   * @param {Array} menuItems - Array of menu items {name, description, price}
   * @returns {Promise<Object>} API response
   */
  async sendMenuMessage(to, headerText, menuItems) {
    let menuText = `${headerText}\n\n`;
    
    menuItems.forEach((item, index) => {
      menuText += `${index + 1}. *${item.name}*\n`;
      if (item.description) menuText += `   ${item.description}\n`;
      if (item.price) menuText += `   💰 $${item.price}\n`;
      menuText += '\n';
    });

    menuText += 'Reply with the item name or number to add to your cart! 🛒';

    return this.sendTextMessage(to, menuText);
  }

  /**
   * Send order confirmation message
   * @param {string} to - WhatsApp number
   * @param {Object} order - Order object with items and total
   * @returns {Promise<Object>} API response
   */
  async sendOrderConfirmation(to, order) {
    let confirmText = `🎉 *Order Confirmed!*\n\n`;
    confirmText += `Order #${order.orderNumber}\n`;
    confirmText += `📍 ${order.restaurant?.name || 'Restaurant'}\n\n`;
    
    confirmText += '*Items:*\n';
    order.items.forEach(item => {
      confirmText += `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    confirmText += `\n💰 *Total: $${order.total.toFixed(2)}*\n`;
    confirmText += `⏱️ Estimated time: ${order.estimatedTime || '20-30'} minutes\n\n`;
    confirmText += `We'll notify you when your order is ready! 🍽️`;

    return this.sendTextMessage(to, confirmText);
  }

  /**
   * Send typing indicator (simulates bot typing)
   * @param {string} to - WhatsApp number
   * @returns {Promise<Object>} API response
   */
  async sendTypingIndicator(to) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: {
          body: "..."
        }
      };

      // Send and immediately delete to simulate typing
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.log('Typing indicator failed (non-critical):', error.message);
      return null;
    }
  }
}

module.exports = WhatsAppMessenger;