// =============================================
// server.js - The MAIN entry point of our backend
// =============================================

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

const authRoutes   = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const adminRoutes  = require('./routes/Admin');

dotenv.config();

const app = express();

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded images as static files
// e.g. GET http://localhost:5000/uploads/recipes/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/admin',   adminRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Recipe Finder API is running! 🍕' });
});

// ── Connect to MongoDB, then start server ────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(' Connected to MongoDB!');
    app.listen(PORT, () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(' MongoDB connection failed:', error.message);
  });