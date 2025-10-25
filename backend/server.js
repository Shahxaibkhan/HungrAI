require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const authRoutes = require('./src/routes/auth');
const restaurantRoutes = require('./src/routes/restaurants');
const chatRoutes = require('./src/routes/chat');
const orderRoutes = require('./src/routes/orders');


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
app.use('/api/orders', orderRoutes);


app.get('/', (req,res)=> res.send('Hungrai Backend running'));


app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));