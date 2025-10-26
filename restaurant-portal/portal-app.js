// API Base URL
const apiBase = window.API_BASE_URL !== undefined ? window.API_BASE_URL : "";

// Current user session
let currentUser = JSON.parse(localStorage.getItem('restaurantUser')) || null;
let currentRestaurant = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (currentUser) {
    loadDashboard();
  }
});

// Tab switching
function showTab(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.auth-form');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  forms.forEach(form => form.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(tabName + 'Form').classList.add('active');
}

// Handle Registration
async function handleRegister(event) {
  event.preventDefault();
  
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  
  const restaurantData = {
    name: document.getElementById('restaurantName').value,
    slug: generateSlug(document.getElementById('restaurantName').value),
    ownerName: document.getElementById('ownerName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    description: document.getElementById('description').value,
    cuisine: document.getElementById('cuisine').value,
    logo: document.getElementById('logo').value || '🍽️',
    password: password,
    isActive: true
  };
  
  try {
    const response = await fetch(`${apiBase}/api/restaurant-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...restaurantData, action: 'register' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('Registration successful! Please log in.');
      showTab('login');
      document.getElementById('loginEmail').value = restaurantData.email;
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Failed to register. Please try again.');
  }
}

// Handle Login
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${apiBase}/api/restaurant-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, action: 'login' })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      localStorage.setItem('restaurantUser', JSON.stringify(currentUser));
      localStorage.setItem('restaurantToken', data.token);
      loadDashboard();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to login. Please try again.');
  }
}

// Handle Logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    currentUser = null;
    currentRestaurant = null;
    localStorage.removeItem('restaurantUser');
    localStorage.removeItem('restaurantToken');
    
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('authContainer').classList.remove('hidden');
  }
}

// Load Dashboard
async function loadDashboard() {
  document.getElementById('authContainer').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  
  await loadRestaurantData();
  await loadMenuItems();
  await loadOrders();
  updateStats();
}

// Load Restaurant Data
async function loadRestaurantData() {
  try {
    const token = localStorage.getItem('restaurantToken');
    const response = await fetch(`${apiBase}/api/restaurant-data?restaurantId=${currentUser.restaurantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentRestaurant = data.restaurant;
      document.getElementById('dashboardRestaurantName').textContent = currentRestaurant.name;
      
      // Populate settings form
      document.getElementById('settingsName').value = currentRestaurant.name;
      document.getElementById('settingsDescription').value = currentRestaurant.description || '';
      document.getElementById('settingsPhone').value = currentRestaurant.phone || '';
      document.getElementById('settingsAddress').value = currentRestaurant.address || '';
      document.getElementById('settingsIsActive').checked = currentRestaurant.isActive;
    }
  } catch (error) {
    console.error('Error loading restaurant data:', error);
  }
}

// Load Menu Items
async function loadMenuItems() {
  try {
    const response = await fetch(`${apiBase}/api/menu-management?restaurantId=${currentUser.restaurantId}`);
    const data = await response.json();
    
    if (response.ok) {
      displayMenuItems(data.menuItems);
    }
  } catch (error) {
    console.error('Error loading menu items:', error);
  }
}

// Display Menu Items
function displayMenuItems(items) {
  const container = document.getElementById('menuItemsList');
  
  if (!items || items.length === 0) {
    container.innerHTML = '<p class="no-data">No menu items yet. Click "Add Item" to get started!</p>';
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="menu-item-card">
      <div class="menu-item-header">
        <div class="menu-item-icon">${item.imageUrl || '🍽️'}</div>
        <div class="menu-item-actions">
          <button class="icon-btn" onclick="editMenuItem('${item._id}')" title="Edit">✏️</button>
          <button class="icon-btn" onclick="deleteMenuItem('${item._id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="menu-item-category">${item.category || 'Uncategorized'}</div>
      <div class="menu-item-title">${item.title}</div>
      <div class="menu-item-description">${item.description || ''}</div>
      <div class="menu-item-footer">
        <div class="menu-item-price">$${item.price.toFixed(2)}</div>
        <span class="availability-badge ${item.isAvailable ? 'available' : 'unavailable'}">
          ${item.isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
    </div>
  `).join('');
}

// Show Add MenuItem Modal
function showAddMenuItem() {
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('menuItemForm').reset();
  document.getElementById('menuItemId').value = '';
  document.getElementById('menuItemModal').classList.remove('hidden');
}

// Edit Menu Item
async function editMenuItem(itemId) {
  try {
    const response = await fetch(`${apiBase}/api/menu-management?id=${itemId}`);
    const data = await response.json();
    
    if (response.ok) {
      const item = data.menuItem;
      document.getElementById('modalTitle').textContent = 'Edit Menu Item';
      document.getElementById('menuItemId').value = item._id;
      document.getElementById('itemTitle').value = item.title;
      document.getElementById('itemDescription').value = item.description || '';
      document.getElementById('itemPrice').value = item.price;
      document.getElementById('itemCategory').value = item.category;
      document.getElementById('itemImage').value = item.imageUrl || '';
      document.getElementById('itemAvailable').checked = item.isAvailable;
      
      document.getElementById('menuItemModal').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading menu item:', error);
  }
}

// Handle Save MenuItem
async function handleSaveMenuItem(event) {
  event.preventDefault();
  
  const itemId = document.getElementById('menuItemId').value;
  const itemData = {
    restaurantId: currentUser.restaurantId,
    title: document.getElementById('itemTitle').value,
    description: document.getElementById('itemDescription').value,
    price: parseFloat(document.getElementById('itemPrice').value),
    category: document.getElementById('itemCategory').value,
    imageUrl: document.getElementById('itemImage').value || '🍽️',
    isAvailable: document.getElementById('itemAvailable').checked
  };
  
  try {
    const token = localStorage.getItem('restaurantToken');
    const url = itemId 
      ? `${apiBase}/api/menu-management?id=${itemId}`
      : `${apiBase}/api/menu-management`;
    const method = itemId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itemData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert(itemId ? 'Menu item updated!' : 'Menu item added!');
      closeMenuItemModal();
      await loadMenuItems();
      updateStats();
    } else {
      alert(data.error || 'Failed to save menu item');
    }
  } catch (error) {
    console.error('Error saving menu item:', error);
    alert('Failed to save menu item. Please try again.');
  }
}

// Delete Menu Item
async function deleteMenuItem(itemId) {
  if (!confirm('Are you sure you want to delete this menu item?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('restaurantToken');
    const response = await fetch(`${apiBase}/api/menu-management?id=${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      alert('Menu item deleted!');
      await loadMenuItems();
      updateStats();
    } else {
      alert('Failed to delete menu item');
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    alert('Failed to delete menu item. Please try again.');
  }
}

// Close Modal
function closeMenuItemModal() {
  document.getElementById('menuItemModal').classList.add('hidden');
}

// Load Orders
async function loadOrders() {
  try {
    const token = localStorage.getItem('restaurantToken');
    const response = await fetch(`${apiBase}/api/restaurant-data/orders?restaurantId=${currentUser.restaurantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayOrders(data.orders);
    }
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Display Orders
function displayOrders(orders) {
  const container = document.getElementById('ordersList');
  
  if (!orders || orders.length === 0) {
    container.innerHTML = '<p class="no-data">No orders yet</p>';
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-card" style="background: white; border: 2px solid #e9ecef; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>Order #${order._id.substring(0, 8)}</strong>
          <p>${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <span style="padding: 6px 12px; border-radius: 20px; background: #667eea; color: white; font-weight: 600;">
            ${order.status}
          </span>
        </div>
      </div>
      <div style="margin-top: 15px;">
        <strong>Items:</strong>
        <ul style="margin-left: 20px;">
          ${order.items.map(item => `<li>${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
        </ul>
        <strong style="display: block; margin-top: 10px;">Total: $${order.total.toFixed(2)}</strong>
      </div>
    </div>
  `).join('');
}

// Update Stats
async function updateStats() {
  try {
    const token = localStorage.getItem('restaurantToken');
    const response = await fetch(`${apiBase}/api/restaurant-data/stats?restaurantId=${currentUser.restaurantId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('totalOrders').textContent = data.totalOrders || 0;
      document.getElementById('totalRevenue').textContent = `$${(data.totalRevenue || 0).toFixed(2)}`;
      document.getElementById('totalMenuItems').textContent = data.totalMenuItems || 0;
      document.getElementById('avgRating').textContent = (data.avgRating || 5.0).toFixed(1);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Handle Update Settings
async function handleUpdateSettings(event) {
  event.preventDefault();
  
  const settingsData = {
    name: document.getElementById('settingsName').value,
    description: document.getElementById('settingsDescription').value,
    phone: document.getElementById('settingsPhone').value,
    address: document.getElementById('settingsAddress').value,
    isActive: document.getElementById('settingsIsActive').checked
  };
  
  try {
    const token = localStorage.getItem('restaurantToken');
    const response = await fetch(`${apiBase}/api/restaurant-data?restaurantId=${currentUser.restaurantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settingsData)
    });
    
    if (response.ok) {
      alert('Settings updated successfully!');
      await loadRestaurantData();
    } else {
      alert('Failed to update settings');
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    alert('Failed to update settings. Please try again.');
  }
}

// Dashboard Section Navigation
function showDashboardSection(sectionName) {
  const sections = document.querySelectorAll('.dashboard-section');
  const buttons = document.querySelectorAll('.nav-btn');
  
  sections.forEach(section => section.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(sectionName + 'Section').classList.add('active');
  event.target.classList.add('active');
  
  // Reload data if needed
  if (sectionName === 'menu') {
    loadMenuItems();
  } else if (sectionName === 'orders') {
    loadOrders();
  }
}

// Utility: Generate Slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
