const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// DB setup
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'db.json');
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '{}');
const adapter = new FileSync(dbPath);
const db = low(adapter);
db.defaults({ menu: [], orders: [], nextOrderId: 1 }).write();

// Seed menu if empty
if (db.get('menu').size().value() === 0) {
  db.get('menu').push(
    { id: 1, category: 'Hot Drinks', name: 'Espresso', desc: 'Double shot, rich & bold', price: 120 },
    { id: 2, category: 'Hot Drinks', name: 'Cappuccino', desc: 'Espresso, steamed milk & foam', price: 180 },
    { id: 3, category: 'Hot Drinks', name: 'Masala Chai', desc: 'Spiced Indian tea with milk', price: 100 },
    { id: 4, category: 'Hot Drinks', name: 'Filter Coffee', desc: 'South Indian style, decoction', price: 90 },
    { id: 5, category: 'Cold Drinks', name: 'Cold Brew', desc: '18-hour steeped, smooth finish', price: 220 },
    { id: 6, category: 'Cold Drinks', name: 'Mango Smoothie', desc: 'Alphonso mango, yogurt blend', price: 200 },
    { id: 7, category: 'Food', name: 'Butter Croissant', desc: 'Freshly baked, flaky layers', price: 150 },
    { id: 8, category: 'Food', name: 'Veg Sandwich', desc: 'Grilled with cheese & veggies', price: 200 },
    { id: 9, category: 'Food', name: 'Banana Bread', desc: 'Moist slice, walnuts & honey', price: 130 },
    { id: 10, category: 'Food', name: 'Avocado Toast', desc: 'Multigrain, chilli flakes', price: 250 }
  ).write();
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ROUTES ---

// Get menu
app.get('/api/menu', (req, res) => {
  res.json(db.get('menu').value());
});

// Place order
app.post('/api/orders', (req, res) => {
  const { table, items, type } = req.body;
  if (!table) return res.status(400).json({ error: 'Table number required' });
  const id = db.get('nextOrderId').value();
  const order = {
    id,
    table,
    items: items || [],
    total: (items || []).reduce((s, i) => s + i.price * i.qty, 0),
    type: type || 'order',
    status: type === 'waiter' ? 'waiter' : 'new',
    time: new Date().toISOString()
  };
  db.get('orders').push(order).write();
  db.set('nextOrderId', id + 1).write();
  res.json({ success: true, order });
});

// Get all orders (dashboard)
app.get('/api/orders', (req, res) => {
  const orders = db.get('orders').value().slice().reverse();
  res.json(orders);
});

// Update order status
app.patch('/api/orders/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  db.get('orders').find({ id }).assign({ status }).write();
  res.json({ success: true });
});

// Delete/clear order
app.delete('/api/orders/:id', (req, res) => {
  db.get('orders').remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true });
});

// Update menu item
app.patch('/api/menu/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('menu').find({ id }).assign(req.body).write();
  res.json({ success: true });
});

// Add menu item
app.post('/api/menu', (req, res) => {
  const items = db.get('menu').value();
  const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  const item = { id: newId, ...req.body };
  db.get('menu').push(item).write();
  res.json({ success: true, item });
});

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
  db.get('menu').remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true });
});

// Generate QR codes for all tables
app.get('/api/qrcodes', async (req, res) => {
  const { tables = 25, baseUrl = `http://localhost:${PORT}` } = req.query;
  const qrs = [];
  for (let i = 1; i <= parseInt(tables); i++) {
    const url = `${baseUrl}/menu?table=${i}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 1 });
    qrs.push({ table: i, url, qr: dataUrl });
  }
  res.json(qrs);
});

// Serve page routes
app.get('/menu', (req, res) => res.sendFile(path.join(__dirname, 'public/menu.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/qrcodes', (req, res) => res.sendFile(path.join(__dirname, 'public/qrcodes.html')));

app.listen(PORT, () => {
  console.log(`\n☕ The Brewtique is running at http://localhost:${PORT}`);
  console.log(`   Menu:      http://localhost:${PORT}/menu?table=1`);
  console.log(`   Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   Admin:     http://localhost:${PORT}/admin`);
  console.log(`   QR Codes:  http://localhost:${PORT}/qrcodes\n`);
});
