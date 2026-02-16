import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTeam, useNextDefaultColor } from '../../contexts/TeamContext';
import { useChores } from '../../contexts/ChoreContext';
import { DEFAULT_COLORS } from '../../constants/colors';
import type { TeamMember } from '../../types/team.types';

interface MemberFormData {
  name: string;
  color: string;
}

export function TeamManagement() {
  const { members, addMember, updateMember, deleteMember } = useTeam();
  const { chores } = useChores();
  const nextColor = useNextDefaultColor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>({
    name: '',
    color: nextColor,
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({ name: member.name, color: member.color });
    } else {
      setEditingMember(null);
      setFormData({ name: '', color: nextColor });
    }
    setErrorMessage('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setFormData({ name: '', color: nextColor });
    setErrorMessage('');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    if (editingMember) {
      updateMember(editingMember.id, formData);
    } else {
      addMember(formData);
    }

    handleCloseDialog();
  };

  const handleDelete = (member: TeamMember) => {
    // Check if member has assigned chores
    const hasChores = chores.some((chore) => chore.assigneeId === member.id);

    if (hasChores) {
      setErrorMessage(
        `Cannot delete ${member.name} because they have assigned chores. Please reassign or delete their chores first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
      deleteMember(member.id);
      setErrorMessage('');
    }
  };

  return (
    <Box>
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Team Members</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Team Member
        </Button>
      </Stack>

      {members.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              No team members yet. Add your first team member to get started!
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {members.map((member) => (
            <Card key={member.id} sx={{ mb: 2 }}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(member)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(member)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: member.color,
                    mr: 2,
                    border: '2px solid #e0e0e0',
                  }}
                />
                <ListItemText
                  primary={member.name}
                  secondary={
                    <Chip
                      label={member.color}
                      size="small"
                      sx={{ mt: 0.5, fontFamily: 'monospace' }}
                    />
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMember ? 'Edit Team Member' : 'Add Team Member'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Color
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {DEFAULT_COLORS.map((color) => (
              <Box
                key={color}
                onClick={() => setFormData({ ...formData, color })}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: formData.color === color ? '4px solid #1976d2' : '2px solid #e0e0e0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Stack>

          <TextField
            margin="dense"
            label="Custom Color (Hex)"
            type="text"
            fullWidth
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            sx={{ mt: 2 }}
            placeholder="#FF6B6B"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMember ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
