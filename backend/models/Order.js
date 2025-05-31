const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  name: String,
  coffeeType: String,
  sugarLevel: String,
  size: String,
  status: {
    type: String,
    enum: ['pending', 'brewing', 'ready', 'chaos'],
    default: 'pending'
  },
  statusMessage: {
    type: String,
    default: 'Order received'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Order', OrderSchema);
