const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // Validation
    if (!username || !password || !name || !email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'All fields are required',
      });
    }

    // Check if user already exists
    const existingUser = db.users.find((u) => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Username or email already taken',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      name,
      email,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and password are required',
      });
    }

    // Find user
    const user = db.users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful',
  });
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Current password and new password are required',
      });
    }

    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid Password',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.updatedAt = new Date().toISOString();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
