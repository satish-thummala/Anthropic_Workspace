const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/users - Get all users (admin only in production)
router.get('/', (req, res) => {
  try {
    // Remove passwords from response
    const usersWithoutPasswords = db.users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      count: usersWithoutPasswords.length,
      users: usersWithoutPasswords,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/users/:id - Get single user by ID
router.get('/:id', (req, res) => {
  try {
    const user = db.users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with id: ${req.params.id}`,
      });
    }

    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// PUT /api/users/:id - Update user profile
router.put('/:id', (req, res) => {
  try {
    // Users can only update their own profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    const userIndex = db.users.findIndex((u) => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with id: ${req.params.id}`,
      });
    }

    const { name, email } = req.body;

    // Check if email is being changed and already exists
    if (email && email !== db.users[userIndex].email) {
      const existingUser = db.users.find((u) => u.email === email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A user with this email already exists',
        });
      }
    }

    // Update user
    const updatedUser = {
      ...db.users[userIndex],
      name: name !== undefined ? name : db.users[userIndex].name,
      email: email !== undefined ? email : db.users[userIndex].email,
      updatedAt: new Date().toISOString(),
    };

    db.users[userIndex] = updatedUser;

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'User profile updated successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', (req, res) => {
  try {
    // Only admin can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can delete users',
      });
    }

    const userIndex = db.users.findIndex((u) => u.id === req.params.id);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with id: ${req.params.id}`,
      });
    }

    const deletedUser = db.users.splice(userIndex, 1)[0];
    const { password, ...userWithoutPassword } = deletedUser;

    res.json({
      message: 'User deleted successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
