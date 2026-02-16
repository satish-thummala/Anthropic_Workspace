import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import type { ChoreInstance } from '../../types/chore.types';
import { useTeam } from '../../contexts/TeamContext';
import { getContrastColor } from '../../constants/colors';
import RepeatIcon from '@mui/icons-material/Repeat';

interface ChoreEventComponentProps {
  event: {
    title: string;
    resource: ChoreInstance;
  };
}

export function ChoreEventComponent({ event }: ChoreEventComponentProps) {
  const { getMemberById } = useTeam();
  const chore = event.resource;
  const member = getMemberById(chore.assigneeId);
  const textColor = getContrastColor(chore.color);

  const tooltipContent = (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
        {chore.title}
      </Typography>
      {member && (
        <Typography variant="caption">
          Assigned to: {member.name}
        </Typography>
      )}
      {chore.isRecurring && (
        <Typography variant="caption" display="block">
          Recurring chore
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Box
        sx={{
          backgroundColor: chore.color,
          color: textColor,
          padding: '2px 4px',
          borderRadius: '4px',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
          },
        }}
      >
        {chore.isRecurring && <RepeatIcon sx={{ fontSize: 12 }} />}
        <Typography
          variant="caption"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
          }}
        >
          {chore.title}
        </Typography>
      </Box>
    </Tooltip>
  );
}
