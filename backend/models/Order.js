const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  name: String,
  coffeeType: String,
  sugarLevel: String,
  size: String,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Order', OrderSchema);
