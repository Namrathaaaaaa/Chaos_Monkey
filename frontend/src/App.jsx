import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

export default function App() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ customerName: '', coffeeType: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [latestStatuses, setLatestStatuses] = useState({
    brewing: null,
    ready: null,
    chaos: null
  });
  const [systemStatus, setSystemStatus] = useState({
    message: 'System currently stable. No chaos detected.',
    hasIssue: false
  });
  
  const socket = useRef(null);

  // Connect to WebSocket and fetch initial data on component mount
  useEffect(() => {
    fetchOrders();
    fetchStatusUpdates();
    
    // Setup socket connection
    socket.current = io('http://localhost:5002');
    
    socket.current.on('connect', () => {
      console.log('Connected to server');
    });
    
    socket.current.on('status-update', (data) => {
      console.log('Status update received:', data);
      updateOrderStatus(data);
      fetchOrders(); // Refresh orders to show latest status
    });
    
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/orders', {
        timeout: 5000
      });
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch latest status updates for each category
  const fetchStatusUpdates = async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/status', {
        timeout: 5000
      });
      setLatestStatuses({
        brewing: res.data.brewing,
        ready: res.data.ready,
        chaos: res.data.chaos
      });
      
      // Update system status message if there's chaos
      if (res.data.chaos) {
        setSystemStatus({
          message: 'ALERT: Chaos Monkey has caused a disruption!',
          hasIssue: true
        });
      }
    } catch (error) {
      console.error('Error fetching status updates:', error);
    }
  };
  
  // Update order status based on websocket data
  const updateOrderStatus = (data) => {
    const { orderId, status, statusMessage, chaosType, name, coffeeType } = data;
    
    // Update the latest status for the appropriate category
    setLatestStatuses(prev => ({
      ...prev,
      [status]: { 
        _id: orderId, 
        status, 
        statusMessage,
        chaosType,
        name,
        coffeeType
      }
    }));
    
    // Special handling for chaos events
    if (status === 'chaos') {
      setSystemStatus({
        message: `ALERT: Chaos Monkey attack detected! ${statusMessage}`,
        hasIssue: true
      });
      
      // Reset system status after 10 seconds
      setTimeout(() => {
        setSystemStatus({
          message: 'System stabilized. Monitoring for further disruptions.',
          hasIssue: false
        });
      }, 10000);
      
      // Add visual chaos effect
      const chaosEffect = document.createElement('div');
      chaosEffect.className = 'chaos-animation';
      document.querySelector('.app-container').appendChild(chaosEffect);
      
      setTimeout(() => {
        document.querySelector('.chaos-animation').remove();
      }, 500);
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
      
      const res = await axios.post('http://localhost:5002/api/orders', orderData, {
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
              <select
                name="coffeeType"
                value={form.coffeeType}
                onChange={handleChange}
                required
                className="coffee-select"
              >
                <option value="" disabled>Select your coffee</option>
                <option value="Espresso">☕ Espresso</option>
                <option value="Iced Latte">🧋 Iced Latte</option>
                <option value="Mocha">🍫 Mocha</option>
                <option value="Smoothie">🧃 Smoothie</option>
              </select>
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

        {/* Order Status Updates Section */}
        <section className="status-updates-section">
          <h2>Order Status Updates</h2>
          <div className="status-cards">
            <div className={`status-card ${latestStatuses.brewing ? 'active' : ''}`}>
              <div className="status-icon brewing">🕒</div>
              <h3>Brewing...</h3>
              {latestStatuses.brewing ? (
                <>
                  <p>{latestStatuses.brewing.statusMessage}</p>
                  <p>For: <strong>{latestStatuses.brewing.name}</strong></p>
                  <p>Type: <em>{latestStatuses.brewing.coffeeType}</em></p>
                </>
              ) : (
                <p>No orders currently brewing</p>
              )}
            </div>
            
            <div className={`status-card ${latestStatuses.ready ? 'active' : ''}`}>
              <div className="status-icon ready">✅</div>
              <h3>Ready for Pickup!</h3>
              {latestStatuses.ready ? (
                <>
                  <p>{latestStatuses.ready.statusMessage}</p>
                  <p>For: <strong>{latestStatuses.ready.name}</strong></p>
                  <p>Type: <em>{latestStatuses.ready.coffeeType}</em></p>
                </>
              ) : (
                <p>No orders ready for pickup</p>
              )}
            </div>
            
            <div className={`status-card ${latestStatuses.chaos ? 'active' : ''}`}>
              <div className="status-icon chaos">💥</div>
              <h3>Chaos Monkey Attack!</h3>
              {latestStatuses.chaos ? (
                <>
                  <p>{latestStatuses.chaos.statusMessage}</p>
                  <p>For: <strong>{latestStatuses.chaos.name}</strong></p>
                  <p>Type: <em>{latestStatuses.chaos.coffeeType}</em></p>
                </>
              ) : (
                <p>No chaos incidents reported...yet</p>
              )}
            </div>
          </div>
          
          <div className="status-message">
            <p>Watch this area for real-time updates on your coffee order!</p>
            <p className={`blink-text ${systemStatus.hasIssue ? 'error' : ''}`}>
              {systemStatus.message}
            </p>
          </div>
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