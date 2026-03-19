const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ token: signToken(user._id), user });
});

// POST /api/auth/register  (protected – first admin can create more staff)
router.post('/register', protect, async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password, role });
  res.status(201).json({ token: signToken(user._id), user });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json(req.user));

// POST /api/auth/seed  – creates default admin if none exists
router.post('/seed', async (req, res) => {
  const exists = await User.findOne({ email: 'admin@facetrack.com' });
  if (exists) return res.json({ message: 'Admin already exists' });
  await User.create({
    name: 'Admin',
    email: 'admin@facetrack.com',
    password: 'Admin@123',
    role: 'admin',
  });
  res.json({ message: 'Default admin created', email: 'admin@facetrack.com', password: 'Admin@123' });
});

module.exports = router;
