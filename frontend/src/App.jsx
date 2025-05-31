import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ customerName: '', coffeeType: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/orders', {
        timeout: 5000
      });
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const orderData = {
        name: form.customerName,
        coffeeType: form.coffeeType
      };
      
      const res = await axios.post('http://localhost:5001/api/orders', orderData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      setMessage(res.data.message);
      setForm({ customerName: '', coffeeType: '' });
      fetchOrders();
    } catch (error) {
      setMessage(`Error placing order: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo">🐵</div>
        <div className="header-content">
          <h1>Chaos Monkey Café</h1>
          <p className="tagline">
            Where resilience meets caffeine! Test your system's ability to handle chaos while enjoying virtual coffee.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Introduction Section */}
        <section className="intro-section">
          <h2>Welcome to the Chaos Monkey Café!</h2>
          <p>
            This is a self-destructing coffee ordering system designed to teach resilience engineering concepts. 
            As you place orders, our Chaos Monkey will randomly disrupt services to test your system's ability to recover.
          </p>
          <p><strong>How it works:</strong></p>
          <ul>
            <li>Place coffee orders like a normal café</li>
            <li>Chaos Monkey randomly kills services in the background</li>
            <li>Your job is to implement self-healing mechanisms</li>
            <li>Monitor your resilience score in Grafana</li>
          </ul>
          <p>The more resilient your system, the more coffee orders you can successfully process!</p>
        </section>

        {/* Order Section */}
        <section className="order-section">
          <h2>Place Your Order ☕</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Customer Name:</label>
              <input
                type="text"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label>Coffee Type:</label>
              <input
                type="text"
                name="coffeeType"
                value={form.coffeeType}
                onChange={handleChange}
                required
                placeholder="e.g. Espresso, Latte"
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <h2>Recent Orders</h2>
          {orders.length === 0 ? (
            <p>No orders yet. Be the first to order!</p>
          ) : (
            <ul className="order-list">
              {orders.map((order) => (
                <li key={order._id}>
                  <strong>{order.name}</strong> ordered <em>{order.coffeeType}</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Chaos Monkey Café - A Resilience Engineering Demonstration</p>
        <p className="footer-subtext">Built with React, Node.js, Kubernetes, and Chaos Mesh</p>
      </footer>
    </div>
  );
}