// Session management for WhatsApp users
const fs = require('fs').promises;
const path = require('path');

class WhatsAppSessionManager {
  constructor() {
    this.sessionsDir = path.join(__dirname, '../sessions');
    this.sessionTTL = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.ensureSessionsDir();
  }

  async ensureSessionsDir() {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating sessions directory:', error);
    }
  }

  /**
   * Generate session key for a user
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @returns {string} Session key
   */
  getSessionKey(restaurantSlug, whatsappNumber) {
    return `${restaurantSlug}_${whatsappNumber.replace(/[^0-9]/g, '')}`;
  }

  /**
   * Get session file path
   * @param {string} sessionKey - Session identifier
   * @returns {string} File path
   */
  getSessionFilePath(sessionKey) {
    return path.join(this.sessionsDir, `${sessionKey}.json`);
  }

  /**
   * Get user session data
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @returns {Promise<Object|null>} Session data or null if expired/not found
   */
  async getSession(restaurantSlug, whatsappNumber) {
    try {
      const sessionKey = this.getSessionKey(restaurantSlug, whatsappNumber);
      const filePath = this.getSessionFilePath(sessionKey);
      
      const data = await fs.readFile(filePath, 'utf8');
      const session = JSON.parse(data);
      
      // Check if session is expired
      if (Date.now() - session.lastActivity > this.sessionTTL) {
        await this.deleteSession(restaurantSlug, whatsappNumber);
        return null;
      }
      
      return session;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading session:', error);
      }
      return null;
    }
  }

  /**
   * Save user session data
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @param {Object} sessionData - Session data to save
   * @returns {Promise<void>}
   */
  async saveSession(restaurantSlug, whatsappNumber, sessionData) {
    try {
      const sessionKey = this.getSessionKey(restaurantSlug, whatsappNumber);
      const filePath = this.getSessionFilePath(sessionKey);
      
      const session = {
        restaurantSlug,
        whatsappNumber,
        lastActivity: Date.now(),
        ...sessionData
      };
      
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Update session with new data
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>} Updated session
   */
  async updateSession(restaurantSlug, whatsappNumber, updates) {
    const existingSession = await this.getSession(restaurantSlug, whatsappNumber) || {};
    const newSession = { ...existingSession, ...updates };
    await this.saveSession(restaurantSlug, whatsappNumber, newSession);
    return newSession;
  }

  /**
   * Delete user session
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @returns {Promise<void>}
   */
  async deleteSession(restaurantSlug, whatsappNumber) {
    try {
      const sessionKey = this.getSessionKey(restaurantSlug, whatsappNumber);
      const filePath = this.getSessionFilePath(sessionKey);
      await fs.unlink(filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error deleting session:', error);
      }
    }
  }

  /**
   * Get or create cart for user
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @returns {Promise<Object>} User's cart
   */
  async getCart(restaurantSlug, whatsappNumber) {
    const session = await this.getSession(restaurantSlug, whatsappNumber);
    return session?.cart || { items: [], total: 0 };
  }

  /**
   * Add item to user's cart
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @param {Object} item - Item to add {name, price, quantity}
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(restaurantSlug, whatsappNumber, item) {
    const session = await this.getSession(restaurantSlug, whatsappNumber) || {};
    const cart = session.cart || { items: [], total: 0 };
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(i => i.name === item.name);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += item.quantity || 1;
    } else {
      // Add new item
      cart.items.push({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1
      });
    }
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, cartItem) => 
      sum + (cartItem.price * cartItem.quantity), 0
    );
    
    await this.updateSession(restaurantSlug, whatsappNumber, { cart });
    return cart;
  }

  /**
   * Remove item from cart
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @param {string} itemName - Name of item to remove
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(restaurantSlug, whatsappNumber, itemName) {
    const session = await this.getSession(restaurantSlug, whatsappNumber);
    if (!session?.cart) return { items: [], total: 0 };
    
    const cart = session.cart;
    cart.items = cart.items.filter(item => item.name !== itemName);
    
    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    await this.updateSession(restaurantSlug, whatsappNumber, { cart });
    return cart;
  }

  /**
   * Clear user's cart
   * @param {string} restaurantSlug - Restaurant identifier
   * @param {string} whatsappNumber - User's WhatsApp number
   * @returns {Promise<void>}
   */
  async clearCart(restaurantSlug, whatsappNumber) {
    await this.updateSession(restaurantSlug, whatsappNumber, { 
      cart: { items: [], total: 0 } 
    });
  }

  /**
   * Clean up expired sessions (run periodically)
   * @returns {Promise<number>} Number of sessions cleaned
   */
  async cleanupExpiredSessions() {
    try {
      const files = await fs.readdir(this.sessionsDir);
      let cleaned = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(this.sessionsDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > this.sessionTTL) {
          await fs.unlink(filePath);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }
      
      return cleaned;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }
}

module.exports = WhatsAppSessionManager;