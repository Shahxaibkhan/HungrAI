// Restaurant lookup utility for WhatsApp integration
const mongoose = require('mongoose');

class RestaurantLookup {
  constructor() {
    // Map of phone number IDs to restaurant slugs (could be stored in database)
    this.phoneNumberMapping = new Map();
    this.restaurantCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Find restaurant by WhatsApp phone number ID
   * @param {string} phoneNumberId - WhatsApp phone number ID from webhook
   * @returns {Promise<Object|null>} Restaurant object or null
   */
  async findRestaurantByPhoneNumberId(phoneNumberId) {
    try {
      // First check cache
      const cacheKey = `phone_${phoneNumberId}`;
      const cached = this.restaurantCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.restaurant;
      }

      // Import Restaurant model dynamically to avoid circular dependencies
      const Restaurant = require('./Restaurant');
      
      // Retry logic for database queries with shorter timeout
      let restaurant = null;
      const maxRetries = 2;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Looking up restaurant for phone ID: ${phoneNumberId} (attempt ${attempt}/${maxRetries})`);
          
          // Look up restaurant by WhatsApp phone number ID with timeout
          restaurant = await Restaurant.findOne({
            'whatsapp.phoneNumberId': phoneNumberId
          }).maxTimeMS(8000); // 8 second timeout (less than function timeout)

          if (restaurant) break; // Success, exit retry loop
          
        } catch (queryError) {
          console.error(`❌ Query attempt ${attempt} failed:`, queryError.message);
          
          if (attempt === maxRetries) {
            throw queryError; // Re-throw on last attempt
          }
          
          // Brief delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (restaurant) {
        // Cache the result
        this.restaurantCache.set(cacheKey, {
          restaurant: restaurant.toObject(),
          timestamp: Date.now()
        });
        
        console.log(`✅ Found restaurant: ${restaurant.name} for phone ID: ${phoneNumberId}`);
        return restaurant.toObject();
      }

      console.warn(`⚠️ No restaurant found for phone number ID: ${phoneNumberId}`);
      return null;

    } catch (error) {
      console.error('Error finding restaurant by phone number ID:', error);
      return null;
    }
  }

  /**
   * Find restaurant by slug (backup method)
   * @param {string} slug - Restaurant slug
   * @returns {Promise<Object|null>} Restaurant object or null
   */
  async findRestaurantBySlug(slug) {
    try {
      const cacheKey = `slug_${slug}`;
      const cached = this.restaurantCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.restaurant;
      }

      const Restaurant = require('./Restaurant');
      const restaurant = await Restaurant.findOne({ slug });

      if (restaurant) {
        this.restaurantCache.set(cacheKey, {
          restaurant: restaurant.toObject(),
          timestamp: Date.now()
        });
        return restaurant.toObject();
      }

      return null;
    } catch (error) {
      console.error('Error finding restaurant by slug:', error);
      return null;
    }
  }

  /**
   * Get restaurant menu items
   * @param {Object} restaurant - Restaurant object
   * @returns {Promise<Array>} Array of menu items
   */
  async getRestaurantMenu(restaurant) {
    try {
      if (!restaurant) return [];

      // If menu is embedded in restaurant document
      if (restaurant.menu && Array.isArray(restaurant.menu)) {
        return restaurant.menu;
      }

      // If menu items are in separate collection, fetch them
      const MenuItem = require('./MenuItem');
      const menuItems = await MenuItem.find({ 
        restaurantId: restaurant._id 
      }).sort({ category: 1, name: 1 });

      return menuItems.map(item => item.toObject());

    } catch (error) {
      console.error('Error fetching restaurant menu:', error);
      return [];
    }
  }

  /**
   * Find menu item by name (fuzzy matching)
   * @param {Array} menu - Array of menu items
   * @param {string} itemName - Item name to search for
   * @returns {Object|null} Found menu item or null
   */
  findMenuItem(menu, itemName) {
    if (!menu || !itemName) return null;

    const searchTerm = itemName.toLowerCase().trim();
    
    // Exact match first
    let item = menu.find(item => 
      item.name.toLowerCase() === searchTerm
    );
    
    if (item) return item;

    // Partial match
    item = menu.find(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      searchTerm.includes(item.name.toLowerCase())
    );
    
    if (item) return item;

    // Check aliases or keywords if available
    item = menu.find(item => {
      if (item.aliases && Array.isArray(item.aliases)) {
        return item.aliases.some(alias => 
          alias.toLowerCase().includes(searchTerm) ||
          searchTerm.includes(alias.toLowerCase())
        );
      }
      return false;
    });

    return item || null;
  }

  /**
   * Register phone number mapping (for multi-tenant setup)
   * @param {string} phoneNumberId - WhatsApp phone number ID
   * @param {string} restaurantSlug - Restaurant slug
   */
  registerPhoneNumberMapping(phoneNumberId, restaurantSlug) {
    this.phoneNumberMapping.set(phoneNumberId, restaurantSlug);
    console.log(`📞 Registered phone mapping: ${phoneNumberId} -> ${restaurantSlug}`);
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.restaurantCache.clear();
    console.log('🧹 Restaurant cache cleared');
  }

  /**
   * Get cache stats (for monitoring)
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.restaurantCache.size,
      mappings: this.phoneNumberMapping.size,
      entries: Array.from(this.restaurantCache.keys())
    };
  }
}

// Export singleton instance
module.exports = new RestaurantLookup();