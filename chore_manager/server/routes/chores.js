const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All chore routes require authentication
router.use(authenticateToken);

// GET /api/chores - Get all chores
router.get('/', (req, res) => {
  try {
    const { assigneeId, status, startDate, endDate } = req.query;

    let filteredChores = [...db.chores];

    // Filter by assignee
    if (assigneeId) {
      filteredChores = filteredChores.filter((c) => c.assigneeId === assigneeId);
    }

    // Filter by status
    if (status) {
      filteredChores = filteredChores.filter((c) => c.status === status);
    }

    // Filter by date range
    if (startDate && endDate) {
      filteredChores = filteredChores.filter((c) => {
        return c.date >= startDate && c.date <= endDate;
      });
    }

    res.json({
      count: filteredChores.length,
      chores: filteredChores,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/chores/:id - Get single chore by ID
router.get('/:id', (req, res) => {
  try {
    const chore = db.chores.find((c) => c.id === req.params.id);

    if (!chore) {
      return res.status(404).json({
        error: 'Chore not found',
        message: `No chore found with id: ${req.params.id}`,
      });
    }

    res.json(chore);
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// POST /api/chores - Create new chore
router.post('/', (req, res) => {
  try {
    const { title, description, date, assigneeId, recurring, recurrenceRule, color } = req.body;

    // Validation
    if (!title || !date) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title and date are required',
      });
    }

    // Verify assignee exists if provided
    if (assigneeId) {
      const assignee = db.teamMembers.find((m) => m.id === assigneeId);
      if (!assignee) {
        return res.status(400).json({
          error: 'Invalid Assignee',
          message: 'Team member not found',
        });
      }
    }

    const newChore = {
      id: uuidv4(),
      title,
      description: description || '',
      date,
      assigneeId: assigneeId || null,
      recurring: recurring || false,
      recurrenceRule: recurrenceRule || null,
      status: 'pending',
      color: color || '#ff9800',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.id,
    };

    db.chores.push(newChore);

    res.status(201).json({
      message: 'Chore created successfully',
      chore: newChore,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// PUT /api/chores/:id - Update chore
router.put('/:id', (req, res) => {
  try {
    const choreIndex = db.chores.findIndex((c) => c.id === req.params.id);

    if (choreIndex === -1) {
      return res.status(404).json({
        error: 'Chore not found',
        message: `No chore found with id: ${req.params.id}`,
      });
    }

    const { title, description, date, assigneeId, recurring, recurrenceRule, status, color } =
      req.body;

    // Verify assignee exists if provided
    if (assigneeId) {
      const assignee = db.teamMembers.find((m) => m.id === assigneeId);
      if (!assignee) {
        return res.status(400).json({
          error: 'Invalid Assignee',
          message: 'Team member not found',
        });
      }
    }

    // Update chore
    const updatedChore = {
      ...db.chores[choreIndex],
      title: title !== undefined ? title : db.chores[choreIndex].title,
      description: description !== undefined ? description : db.chores[choreIndex].description,
      date: date !== undefined ? date : db.chores[choreIndex].date,
      assigneeId: assigneeId !== undefined ? assigneeId : db.chores[choreIndex].assigneeId,
      recurring: recurring !== undefined ? recurring : db.chores[choreIndex].recurring,
      recurrenceRule:
        recurrenceRule !== undefined ? recurrenceRule : db.chores[choreIndex].recurrenceRule,
      status: status !== undefined ? status : db.chores[choreIndex].status,
      color: color !== undefined ? color : db.chores[choreIndex].color,
      updatedAt: new Date().toISOString(),
    };

    db.chores[choreIndex] = updatedChore;

    res.json({
      message: 'Chore updated successfully',
      chore: updatedChore,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// PATCH /api/chores/:id/status - Update chore status
router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid status is required (pending, in-progress, completed, cancelled)',
      });
    }

    const choreIndex = db.chores.findIndex((c) => c.id === req.params.id);

    if (choreIndex === -1) {
      return res.status(404).json({
        error: 'Chore not found',
        message: `No chore found with id: ${req.params.id}`,
      });
    }

    db.chores[choreIndex].status = status;
    db.chores[choreIndex].updatedAt = new Date().toISOString();

    res.json({
      message: 'Chore status updated successfully',
      chore: db.chores[choreIndex],
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// DELETE /api/chores/:id - Delete chore
router.delete('/:id', (req, res) => {
  try {
    const choreIndex = db.chores.findIndex((c) => c.id === req.params.id);

    if (choreIndex === -1) {
      return res.status(404).json({
        error: 'Chore not found',
        message: `No chore found with id: ${req.params.id}`,
      });
    }

    const deletedChore = db.chores.splice(choreIndex, 1)[0];

    res.json({
      message: 'Chore deleted successfully',
      chore: deletedChore,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/chores/stats/summary - Get chore statistics
router.get('/stats/summary', (req, res) => {
  try {
    const stats = {
      total: db.chores.length,
      pending: db.chores.filter((c) => c.status === 'pending').length,
      inProgress: db.chores.filter((c) => c.status === 'in-progress').length,
      completed: db.chores.filter((c) => c.status === 'completed').length,
      cancelled: db.chores.filter((c) => c.status === 'cancelled').length,
      recurring: db.chores.filter((c) => c.recurring).length,
      assigned: db.chores.filter((c) => c.assigneeId).length,
      unassigned: db.chores.filter((c) => !c.assigneeId).length,
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
