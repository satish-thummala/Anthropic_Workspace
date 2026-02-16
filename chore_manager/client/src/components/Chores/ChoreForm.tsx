import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
} from '@mui/material';
import type { Chore, RecurrenceRule } from '../../types/chore.types';
import { useTeam } from '../../contexts/TeamContext';
import { RecurrenceSelector } from './RecurrenceSelector';
import { getTodayISOString } from '../../utils/dateUtils';

interface ChoreFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (chore: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingChore?: Chore | null;
}

export function ChoreForm({ open, onClose, onSubmit, editingChore }: ChoreFormProps) {
  const { members } = useTeam();

  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    assigneeId: string;
    recurrence: RecurrenceRule;
    notes: string;
  }>({
    title: '',
    date: getTodayISOString(),
    assigneeId: '',
    recurrence: { type: 'none' },
    notes: '',
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Populate form when editing
  useEffect(() => {
    if (editingChore) {
      setFormData({
        title: editingChore.title,
        date: editingChore.date,
        assigneeId: editingChore.assigneeId,
        recurrence: editingChore.recurrence,
        notes: editingChore.notes || '',
      });
    } else {
      setFormData({
        title: '',
        date: getTodayISOString(),
        assigneeId: members.length > 0 ? members[0].id : '',
        recurrence: { type: 'none' },
        notes: '',
      });
    }
    setErrors([]);
  }, [editingChore, open, members]);

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Title is required');
    }

    if (!formData.date) {
      newErrors.push('Date is required');
    }

    if (!formData.assigneeId) {
      newErrors.push('Assignee is required');
    }

    if (formData.recurrence.type === 'weekly') {
      if (!formData.recurrence.daysOfWeek || formData.recurrence.daysOfWeek.length === 0) {
        newErrors.push('Select at least one day for weekly recurrence');
      }
    }

    if (formData.recurrence.type === 'monthly') {
      if (!formData.recurrence.dayOfMonth) {
        newErrors.push('Day of month is required for monthly recurrence');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onSubmit({
      title: formData.title,
      date: formData.date,
      assigneeId: formData.assigneeId,
      recurrence: formData.recurrence,
      notes: formData.notes || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      date: getTodayISOString(),
      assigneeId: '',
      recurrence: { type: 'none' },
      notes: '',
    });
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editingChore ? 'Edit Chore' : 'Add Chore'}</DialogTitle>
      <DialogContent>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {members.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please add team members first before creating chores.
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Title"
          type="text"
          fullWidth
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Date"
          type="date"
          fullWidth
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Assignee</InputLabel>
          <Select
            value={formData.assigneeId}
            label="Assignee"
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          >
            {members.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: member.color,
                      mr: 1,
                      border: '1px solid #ccc',
                    }}
                  />
                  {member.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <RecurrenceSelector
          value={formData.recurrence}
          onChange={(recurrence) => setFormData({ ...formData, recurrence })}
        />

        <TextField
          margin="dense"
          label="Notes (Optional)"
          type="text"
          fullWidth
          multiline
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={members.length === 0}>
          {editingChore ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
