const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cafe");

const Order = require('./models/Order');

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Order status processing function
const processOrder = async (order) => {
  try {
    // Update to brewing status
    await Order.findByIdAndUpdate(
      order._id, 
      { status: 'brewing', statusMessage: 'Your coffee is being prepared!' }
    );
    io.emit('status-update', { 
      orderId: order._id, 
      status: 'brewing', 
      statusMessage: 'Your coffee is being prepared!',
      name: order.name,
      coffeeType: order.coffeeType
    });
    
    // Randomly decide if chaos monkey will attack (25% chance)
    const chaosProbability = Math.random();
    
    if (chaosProbability < 0.25) {
      // Wait 3-8 seconds before chaos
      const chaosTime = Math.floor(Math.random() * 5000) + 3000;
      setTimeout(async () => {
        await Order.findByIdAndUpdate(
          order._id, 
          { status: 'chaos', statusMessage: 'Oops! Chaos Monkey knocked over your coffee!' }
        );
        io.emit('status-update', { 
          orderId: order._id, 
          status: 'chaos', 
          statusMessage: 'Oops! Chaos Monkey knocked over your coffee!',
          chaosType: Math.random() > 0.5 ? 'spill' : 'network',
          name: order.name,
          coffeeType: order.coffeeType
        });
      }, chaosTime);
    } else {
      // Normal order flow - wait 5-15 seconds before ready
      const readyTime = Math.floor(Math.random() * 10000) + 5000;
      setTimeout(async () => {
        await Order.findByIdAndUpdate(
          order._id, 
          { status: 'ready', statusMessage: 'Your coffee is ready for pickup!' }
        );
        io.emit('status-update', { 
          orderId: order._id, 
          status: 'ready', 
          statusMessage: 'Your coffee is ready for pickup!',
          name: order.name,
          coffeeType: order.coffeeType
        });
      }, readyTime);
    }
  } catch (error) {
    console.error('Error processing order:', error);
  }
};

// API endpoints
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    
    // Start processing the order
    processOrder(order);
    
    res.status(201).json({ message: 'Order placed!', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    // Get the latest order with each status
    const brewing = await Order.findOne({ status: 'brewing' }).sort({ createdAt: -1 });
    const ready = await Order.findOne({ status: 'ready' }).sort({ createdAt: -1 });
    const chaos = await Order.findOne({ status: 'chaos' }).sort({ createdAt: -1 });
    
    res.json({ brewing, ready, chaos });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch status updates', error });
  }
});

app.get('/health', (req, res) => res.send("OK"));

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
