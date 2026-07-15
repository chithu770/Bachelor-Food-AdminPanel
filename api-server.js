const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'bachelor-foods.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = `${Date.now()}_${req.file.originalname}`;
    const blob = bucket.file(`images/${filename}`);
    
    await blob.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype
      }
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
    res.json({ url: publicUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hotels', async (req, res) => {
  try {
    const snapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get();
    const hotels = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('foodCategories').orderBy('createdAt', 'desc').get();
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const docRef = await db.collection('foodCategories').add({
      name,
      description,
      image: image || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    await db.collection('foodCategories').doc(req.params.id).update({
      name,
      description,
      image: image || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.collection('foodCategories').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Users / Customers ────────────────────────────────────────────────────────
app.get('/api/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return res.status(400).json({ error: 'customerId is required.' });
    const doc = await db.collection('users').doc(customerId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Customer not found.' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    await db.collection('users').doc(customerId).set(req.body, { merge: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Orders ───────────────────────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending' // Initial status
    };
    const docRef = await db.collection('orders').add(orderData);
    res.json({ id: docRef.id, ...orderData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/user/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const snapshot = await db.collection('orders')
      .where('customerId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Delivery Partner APIs ────────────────────────────────────────────────────
app.get('/api/delivery/orders/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const snapshot = await db.collection('orders')
      .where('deliveryPartnerId', '==', partnerId)
      .where('status', 'in', ['out_for_delivery', 'accepted', 'processing']) // Active orders
      .get();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPartnerId } = req.body;
    const updateData = { status, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (deliveryPartnerId) updateData.deliveryPartnerId = deliveryPartnerId;
    
    await db.collection('orders').doc(orderId).update(updateData);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/delivery/:partnerId/location', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { latitude, longitude } = req.body;
    await db.collection('users').doc(partnerId).set({
      location: { latitude, longitude, updatedAt: admin.firestore.FieldValue.serverTimestamp() }
    }, { merge: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});