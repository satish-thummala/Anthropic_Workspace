const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All chore routes require authentication
router.use(authenticateToken);

// GET /api/chores - Get all chores (with optional filters)
router.get('/', (req, res) => {
  try {
    const { assigneeId, startDate, endDate } = req.query;
    let filtered = [...db.chores];

    if (assigneeId) filtered = filtered.filter((c) => c.assigneeId === assigneeId);
    if (startDate && endDate) {
      filtered = filtered.filter((c) => c.date >= startDate && c.date <= endDate);
    }

    res.json({ count: filtered.length, chores: filtered });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/chores/stats/summary
router.get('/stats/summary', (req, res) => {
  try {
    res.json({
      total: db.chores.length,
      recurring: db.chores.filter((c) => c.recurrence?.type !== 'none').length,
      assigned: db.chores.filter((c) => c.assigneeId).length,
      unassigned: db.chores.filter((c) => !c.assigneeId).length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// GET /api/chores/:id
router.get('/:id', (req, res) => {
  try {
    const chore = db.chores.find((c) => c.id === req.params.id);
    if (!chore) return res.status(404).json({ error: 'Chore not found' });
    res.json(chore);
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// POST /api/chores - Create chore
// Expects client shape: { title, date, assigneeId, recurrence, notes }
router.post('/', (req, res) => {
  try {
    const { title, date, assigneeId, recurrence, notes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Validation Error', message: 'Title and date are required' });
    }

    // Verify assignee exists if provided
    if (assigneeId) {
      const assignee = db.teamMembers.find((m) => m.id === assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Invalid Assignee', message: 'Team member not found' });
    }

    const newChore = {
      id: uuidv4(),
      title,
      notes: notes || '',
      date,
      assigneeId: assigneeId || null,
      // Default recurrence to { type: 'none' } if not provided
      recurrence: recurrence || { type: 'none' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.id,
    };

    db.chores.push(newChore);
    res.status(201).json({ message: 'Chore created successfully', chore: newChore });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// PUT /api/chores/:id - Update chore
router.put('/:id', (req, res) => {
  try {
    const idx = db.chores.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Chore not found' });

    const { title, date, assigneeId, recurrence, notes } = req.body;

    if (assigneeId) {
      const assignee = db.teamMembers.find((m) => m.id === assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Invalid Assignee', message: 'Team member not found' });
    }

    const updated = {
      ...db.chores[idx],
      ...(title !== undefined && { title }),
      ...(date !== undefined && { date }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(recurrence !== undefined && { recurrence }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };

    db.chores[idx] = updated;
    res.json({ message: 'Chore updated successfully', chore: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// DELETE /api/chores/:id
router.delete('/:id', (req, res) => {
  try {
    const idx = db.chores.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Chore not found' });

    const deleted = db.chores.splice(idx, 1)[0];
    res.json({ message: 'Chore deleted successfully', chore: deleted });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

module.exports = router;
