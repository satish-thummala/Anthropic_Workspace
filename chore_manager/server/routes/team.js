const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All team routes require authentication
router.use(authenticateToken);

// GET /api/team - Get all team members
router.get('/', (req, res) => {
  try {
    res.json({
      count: db.teamMembers.length,
      members: db.teamMembers,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/team/:id - Get single team member by ID
router.get('/:id', (req, res) => {
  try {
    const member = db.teamMembers.find((m) => m.id === req.params.id);

    if (!member) {
      return res.status(404).json({
        error: 'Team member not found',
        message: `No team member found with id: ${req.params.id}`,
      });
    }

    // Get chores assigned to this member
    const assignedChores = db.chores.filter((c) => c.assigneeId === member.id);

    res.json({
      ...member,
      assignedChores: assignedChores.length,
      chores: assignedChores,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// POST /api/team - Create new team member
router.post('/', (req, res) => {
  try {
    const { name, email, role, color } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Name is required',
      });
    }

    // Check if email already exists
    if (email) {
      const existingMember = db.teamMembers.find((m) => m.email === email);
      if (existingMember) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A team member with this email already exists',
        });
      }
    }

    const newMember = {
      id: uuidv4(),
      name,
      email: email || null,
      role: role || 'Team Member',
      color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.id,
    };

    db.teamMembers.push(newMember);

    res.status(201).json({
      message: 'Team member created successfully',
      member: newMember,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// PUT /api/team/:id - Update team member
router.put('/:id', (req, res) => {
  try {
    const memberIndex = db.teamMembers.findIndex((m) => m.id === req.params.id);

    if (memberIndex === -1) {
      return res.status(404).json({
        error: 'Team member not found',
        message: `No team member found with id: ${req.params.id}`,
      });
    }

    const { name, email, role, color } = req.body;

    // Check if email is being changed and already exists
    if (email && email !== db.teamMembers[memberIndex].email) {
      const existingMember = db.teamMembers.find((m) => m.email === email);
      if (existingMember) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A team member with this email already exists',
        });
      }
    }

    // Update member
    const updatedMember = {
      ...db.teamMembers[memberIndex],
      name: name !== undefined ? name : db.teamMembers[memberIndex].name,
      email: email !== undefined ? email : db.teamMembers[memberIndex].email,
      role: role !== undefined ? role : db.teamMembers[memberIndex].role,
      color: color !== undefined ? color : db.teamMembers[memberIndex].color,
      updatedAt: new Date().toISOString(),
    };

    db.teamMembers[memberIndex] = updatedMember;

    res.json({
      message: 'Team member updated successfully',
      member: updatedMember,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// DELETE /api/team/:id - Delete team member
router.delete('/:id', (req, res) => {
  try {
    const memberIndex = db.teamMembers.findIndex((m) => m.id === req.params.id);

    if (memberIndex === -1) {
      return res.status(404).json({
        error: 'Team member not found',
        message: `No team member found with id: ${req.params.id}`,
      });
    }

    const deletedMember = db.teamMembers.splice(memberIndex, 1)[0];

    // Unassign all chores from this member
    db.chores.forEach((chore) => {
      if (chore.assigneeId === deletedMember.id) {
        chore.assigneeId = null;
        chore.updatedAt = new Date().toISOString();
      }
    });

    res.json({
      message: 'Team member deleted successfully',
      member: deletedMember,
      unassignedChores: db.chores.filter((c) => c.assigneeId === null).length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/team/:id/chores - Get chores assigned to a team member
router.get('/:id/chores', (req, res) => {
  try {
    const member = db.teamMembers.find((m) => m.id === req.params.id);

    if (!member) {
      return res.status(404).json({
        error: 'Team member not found',
        message: `No team member found with id: ${req.params.id}`,
      });
    }

    const assignedChores = db.chores.filter((c) => c.assigneeId === req.params.id);

    res.json({
      member: member.name,
      count: assignedChores.length,
      chores: assignedChores,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

// GET /api/team/stats/workload - Get workload statistics for all members
router.get('/stats/workload', (req, res) => {
  try {
    const workload = db.teamMembers.map((member) => {
      const assignedChores = db.chores.filter((c) => c.assigneeId === member.id);
      const pending = assignedChores.filter((c) => c.status === 'pending').length;
      const completed = assignedChores.filter((c) => c.status === 'completed').length;

      return {
        memberId: member.id,
        memberName: member.name,
        totalChores: assignedChores.length,
        pending,
        completed,
        completionRate: assignedChores.length > 0 ? (completed / assignedChores.length) * 100 : 0,
      };
    });

    res.json({
      workload,
      unassignedChores: db.chores.filter((c) => !c.assigneeId).length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server Error',
      message: error.message,
    });
  }
});

module.exports = router;
