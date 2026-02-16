import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RepeatIcon from '@mui/icons-material/Repeat';
import { useChores } from '../../contexts/ChoreContext';
import { useTeam } from '../../contexts/TeamContext';
import { ChoreForm } from './ChoreForm';
import type { Chore } from '../../types/chore.types';
import { format } from 'date-fns';
import { fromISODateString } from '../../utils/dateUtils';

export function ChoreList() {
  const { chores, addChore, updateChore, deleteChore } = useChores();
  const { getMemberById } = useTeam();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const handleOpenDialog = (chore?: Chore) => {
    if (chore) {
      setEditingChore(chore);
    } else {
      setEditingChore(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingChore(null);
  };

  const handleSubmit = (choreData: Omit<Chore, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingChore) {
      updateChore(editingChore.id, choreData);
    } else {
      addChore(choreData);
    }
  };

  const handleDelete = (chore: Chore) => {
    const recurrenceText = chore.recurrence.type !== 'none' ? ' and all its recurring instances' : '';
    if (window.confirm(`Are you sure you want to delete "${chore.title}"${recurrenceText}?`)) {
      deleteChore(chore.id);
    }
  };

  const getRecurrenceLabel = (chore: Chore): string => {
    if (chore.recurrence.type === 'none') {
      return 'One-time';
    }

    if (chore.recurrence.type === 'weekly') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayLabels = (chore.recurrence.daysOfWeek || [])
        .map((d) => days[d])
        .join(', ');
      return `Weekly: ${dayLabels}`;
    }

    if (chore.recurrence.type === 'monthly') {
      return `Monthly: Day ${chore.recurrence.dayOfMonth}`;
    }

    return '';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Chores List</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Chore
        </Button>
      </Stack>

      {chores.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No chores yet. Add your first chore to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {chores.map((chore) => {
            const member = getMemberById(chore.assigneeId);
            const dateObj = fromISODateString(chore.date);
            const formattedDate = format(dateObj, 'MMM d, yyyy');

            return (
              <Card key={chore.id} sx={{ mb: 2 }}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleOpenDialog(chore)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDelete(chore)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h6">{chore.title}</Typography>
                        {chore.recurrence.type !== 'none' && (
                          <RepeatIcon color="action" fontSize="small" />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Chip
                            icon={<CalendarTodayIcon />}
                            label={formattedDate}
                            size="small"
                            variant="outlined"
                          />
                          {member && (
                            <Chip
                              label={member.name}
                              size="small"
                              sx={{
                                backgroundColor: member.color,
                                color: '#fff',
                                fontWeight: 'bold',
                              }}
                            />
                          )}
                          <Chip
                            label={getRecurrenceLabel(chore)}
                            size="small"
                            variant="outlined"
                            color={chore.recurrence.type !== 'none' ? 'primary' : 'default'}
                          />
                        </Stack>
                        {chore.notes && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, fontStyle: 'italic' }}
                          >
                            {chore.notes}
                          </Typography>
                        )}
                        {chore.recurrence.endDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Ends: {format(fromISODateString(chore.recurrence.endDate), 'MMM d, yyyy')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Card>
            );
          })}
        </List>
      )}

      <ChoreForm
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingChore={editingChore}
      />
    </Box>
  );
}
