# Hungrai Starter — Fullstack Scaffold

This single-file scaffold contains a runnable **starter backend** (Node.js + Express + Mongoose) and a lightweight **React widget** (single-file) you can embed in restaurant pages. Use this as a starting point — it's designed to let you boot an MVP quickly and iterate.

---

## Project structure (recommended)

```
hungrai-starter/
├─ backend/
│  ├─ package.json
│  ├─ server.js
│  ├─ .env
│  ├─ src/
│  │  ├─ models/Restaurant.js
│  │  ├─ models/MenuItem.js
│  │  ├─ models/User.js
│  │  ├─ models/Order.js
│  │  ├─ routes/auth.js
│  │  ├─ routes/restaurants.js
│  │  ├─ routes/chat.js
│  │  ├─ lib/promptOrchestrator.js
│  │  └─ utils/sendOrder.js
│  └─ README.md
├─ frontend-widget/
│  ├─ widget.js  (single-file React widget to embed)
│  └─ README.md
└─ README.md
```

---

## Backend: package.json (backend/package.json)

```json
{
  "name": "hungrai-backend",
  "version": "0.1.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "openai": "^4.0.0",
    "axios": "^1.4.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "bullmq": "^1.79.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

---

## Backend: server.js (backend/server.js)

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./src/routes/auth');
const restaurantRoutes = require('./src/routes/restaurants');
const chatRoutes = require('./src/routes/chat');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req,res)=> res.send('Hungrai Backend running'));

app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
```

Place a `.env` file in backend/ with:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/hungrai
OPENAI_API_KEY=your_openai_key_here
JWT_SECRET=change_this_secret
```

---

## Backend: Models (Mongoose)

### src/models/Restaurant.js
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RestaurantSchema = new Schema({
  name: String,
  slug: {type:String, unique:true, index:true},
  logo: String,
  brandColor: String,
  contactNumber: String,
  menu: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
  channels: { websiteWidget: {type:Boolean, default:true}, whatsapp:false, instagram:false },
  createdAt: {type:Date, default:Date.now}
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
```

### src/models/MenuItem.js
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MenuItemSchema = new Schema({
  restaurant: {type: Schema.Types.ObjectId, ref: 'Restaurant'},
  title: String,
  description: String,
  price: Number, // PKR
  tags: [String],
  image: String,
  inventoryCount: {type:Number, default:1000},
  isLowSelling: {type:Boolean, default:false}
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);
```

### src/models/User.js
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  phone: {type:String, unique:true, index:true},
  email: {type:String, index:true},
  name: String,
  preferences: {spicePref: String, dietary: [String], favorites: [String]},
  consentCrossRestaurant: {type:Boolean, default:false},
  createdAt: {type:Date, default:Date.now}
});

module.exports = mongoose.model('User', UserSchema);
```

### src/models/Order.js
```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  restaurant: {type: Schema.Types.ObjectId, ref: 'Restaurant'},
  user: {type: Schema.Types.ObjectId, ref: 'User'},
  items: [{ itemId: {type: Schema.Types.ObjectId, ref: 'MenuItem'}, title:String, qty:Number, notes:String, price:Number }],
  totalEstimate: Number,
  status: {type:String, default:'received'},
  deliveryType: {type:String, enum:['pickup','delivery'], default:'pickup'},
  customerContact: String,
  createdAt: {type:Date, default:Date.now}
});

module.exports = mongoose.model('Order', OrderSchema);
```

---

## Backend: Routes (examples)

### src/routes/restaurants.js
```javascript
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// Create restaurant (admin)
router.post('/', async (req,res)=>{
  try{
    const r = new Restaurant(req.body);
    await r.save();
    res.json(r);
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Add menu item
router.post('/:slug/menu', async (req,res)=>{
  try{
    const r = await Restaurant.findOne({slug: req.params.slug});
    if(!r) return res.status(404).json({error:'Rest not found'});
    const item = new MenuItem({ ...req.body, restaurant: r._id });
    await item.save();
    r.menu.push(item._id);
    await r.save();
    res.json(item);
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Get restaurant with menu
router.get('/:slug', async (req,res)=>{
  const r = await Restaurant.findOne({slug:req.params.slug}).populate('menu');
  if(!r) return res.status(404).json({error:'Not found'});
  res.json(r);
});

module.exports = router;
```

### src/routes/chat.js
```javascript
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { buildPromptAndCallLLM } = require('../lib/promptOrchestrator');

// POST /api/chat/:slug/message
// body: { message: string, userPhone?: string }
router.post('/:slug/message', async (req,res)=>{
  try{
    const { message, userPhone } = req.body;
    const slug = req.params.slug;
    const restaurant = await Restaurant.findOne({slug}).populate('menu');
    if(!restaurant) return res.status(404).json({error:'Restaurant not found'});

    // build prompt with restaurant.menu and send to LLM (helper below)
    const llmResp = await buildPromptAndCallLLM({restaurant, message, userPhone});

    // If llmResp indicates an order intent, create order record
    if(llmResp.intent === 'place_order' && llmResp.orderItems){
      const order = new Order({
        restaurant: restaurant._id,
        items: llmResp.orderItems.map(i=>({ itemId: i.itemId, title:i.title, qty:i.qty, price:i.price })),
        totalEstimate: llmResp.totalEstimate,
        customerContact: userPhone || 'guest',
        status: 'received'
      });
      await order.save();

      // TODO: push to restaurant via WhatsApp/email (sendOrder util)
      res.json({ reply: llmResp.reply_text, orderId: order._id });
      return;
    }

    res.json({ reply: llmResp.reply_text });

  }catch(e){ console.error(e); res.status(500).json({error:e.message}); }
});

module.exports = router;
```

---

## Backend: Prompt orchestrator (src/lib/promptOrchestrator.js)

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Very simple prompt builder. For production, move to templates & system messages.
async function buildPromptAndCallLLM({restaurant, message, userPhone}){
  const menuSnippet = restaurant.menu.map(m => `${m._id}|${m.title}|${m.price}|${m.tags.join(',')}`).join('\n');

  const system = `You are Hungrai — a helpful smart waiter for ${restaurant.name}. Use the restaurant menu below to answer user questions. Return JSON only when user is placing an order with keys: reply_text, intent, orderItems (array), totalEstimate.`;

  const prompt = `${system}\n\nMENU:\n${menuSnippet}\n\nUser: ${message}`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ],
    max_tokens: 600
  });

  const text = resp.choices?.[0]?.message?.content || '';

  // Try to parse JSON if LLM returned JSON else use text fallback
  try{
    const parsed = JSON.parse(text);
    return parsed;
  }catch(e){
    return { reply_text: text, intent: 'unknown' };
  }
}

module.exports = { buildPromptAndCallLLM };
```

> NOTE: adapt model name & OpenAI client usage to your SDK version. The code above uses a generic pattern — update to match installed SDK.

---

## Frontend widget (single-file React) — frontend-widget/widget.js

```javascript
/*
  Usage: host this file on CDN and embed snippet below on restaurant pages.
  It uses React via CDN for quickest MVP. For production, build using bundler.
*/

(function(){
  const script = document.currentScript;
  const config = script.getAttribute('data-config') ? JSON.parse(script.getAttribute('data-config')) : { slug: 'demo-bistro', apiBase: 'https://your-backend.com' };

  // Simple CSS
  const css = `
  .hungrai-widget{position:fixed;right:20px;bottom:20px;width:360px;max-width:90vw;background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.12);font-family:Inter,Arial;padding:12px;z-index:99999}
  .hungrai-header{font-weight:600;margin-bottom:8px}
  .hungrai-messages{height:300px;overflow:auto;border-top:1px solid #eee;padding-top:8px}
  .hungrai-input{display:flex;gap:8px;margin-top:8px}
  .hungrai-input input{flex:1;padding:8px;border:1px solid #ddd;border-radius:8px}
  `;
  const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);

  const root = document.createElement('div'); root.className='hungrai-widget';
  root.innerHTML = `
    <div class="hungrai-header">🍽 Hungrai — Smart Waiter</div>
    <div class="hungrai-messages" id="hungrai_msgs"></div>
    <div class="hungrai-input">
      <input id="hungrai_input" placeholder="Ask about menu or type order..." />
      <button id="hungrai_send">Send</button>
    </div>`;
  document.body.appendChild(root);

  const msgs = document.getElementById('hungrai_msgs');
  const input = document.getElementById('hungrai_input');
  const btn = document.getElementById('hungrai_send');

  function append(user, text){
    const d = document.createElement('div'); d.style.marginBottom='8px';
    d.innerHTML = user ? `<div style="text-align:right"><b>You:</b> ${text}</div>` : `<div><b>Hungrai:</b> ${text}</div>`;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendMessage(){
    const message = input.value.trim(); if(!message) return;
    append(true, message); input.value='';
    append(false, '...');

    try{
      const res = await fetch(`${config.apiBase}/api/chat/${config.slug}/message`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message })
      });
      const j = await res.json();
      msgs.lastChild.innerHTML = `<div><b>Hungrai:</b> ${j.reply || j.reply_text}</div>`;
      if(j.orderId) append(false, `Order placed — ID: ${j.orderId}`);
    }catch(e){ msgs.lastChild.innerHTML = `<div><b>Hungrai:</b> Sorry, something went wrong.</div>` }
  }

  btn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') sendMessage(); });

  // initial greeting fetch restaurant name
  (async ()=>{
    try{
      const r = await fetch(`${config.apiBase}/api/restaurants/${config.slug}`);
      const rr = await r.json();
      append(false, `Welcome to ${rr.name}! Ask me about specials or type "menu".`);
    }catch(e){ append(false, 'Welcome! Ask me about menu.'); }
  })();

})();
```

Embed snippet for restaurant pages (place before </body>):

```html
<script src="https://cdn.yoursite.com/widget.js" data-config='{"slug":"burger-bistro","apiBase":"https://api.hungrai.com"}'></script>
```

---

## Next steps (development cadence)
1. Clone starter structure. Create backend folder, paste the above files. `npm install`.
2. Boot server with `npm run dev` and seed 2–3 demo restaurants + menu items (use Postman or seeds).
3. Host widget.js on a simple static host (Vercel/Netlify) and embed into demo landing page.
4. Tweak prompt templates in `promptOrchestrator.js` to improve order extraction and reduce hallucination.
5. Add order push (sendOrder util) using Twilio WhatsApp or email to restaurant.

---

If you want, I can now:
- generate **actual files** for you (one-by-one) so you can download them, or
- create a GitHub-ready repo structure with the code filled in, or
- start by creating the `backend/server.js` and `src/lib/promptOrchestrator.js` files now in separate messages.

Tell me which next action you want and I will produce the exact files instantly.