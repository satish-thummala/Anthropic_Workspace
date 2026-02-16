import React, { useMemo, useState, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Box, FormControl, InputLabel, Select, MenuItem, Stack, Typography } from '@mui/material';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useChores } from '../../contexts/ChoreContext';
import { useTeam } from '../../contexts/TeamContext';
import { ChoreEventComponent } from './ChoreEventComponent';
import type { ChoreInstance } from '../../types/chore.types';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    'en-US': enUS,
  },
});

// Custom event style getter for calendar
function eventStyleGetter(event: { resource: ChoreInstance }) {
  return {
    style: {
      backgroundColor: event.resource.color,
      border: 'none',
      borderRadius: '4px',
      padding: '2px',
    },
  };
}

export function ChoreCalendar() {
  const { getChoreInstances } = useChores();
  const { members } = useTeam();

  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>('all');

  // Calculate date range for fetching chore instances
  // Add buffer of ±1 month to handle recurring chores properly
  const { startDate, endDate } = useMemo(() => {
    const start = subMonths(date, 1);
    const end = addMonths(date, 2);
    return { startDate: start, endDate: end };
  }, [date]);

  // Get chore instances and convert to calendar events
  const events = useMemo(() => {
    let instances = getChoreInstances(startDate, endDate);

    // Filter by assignee if selected
    if (filterAssigneeId !== 'all') {
      instances = instances.filter((instance) => instance.assigneeId === filterAssigneeId);
    }

    // Convert to calendar event format
    return instances.map((instance) => ({
      id: instance.id,
      title: instance.title,
      start: new Date(instance.date),
      end: new Date(instance.date),
      allDay: true,
      resource: instance,
    }));
  }, [getChoreInstances, startDate, endDate, filterAssigneeId]);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  // Custom event component
  const components = useMemo(
    () => ({
      event: ChoreEventComponent,
    }),
    []
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h5">Chore Calendar</Typography>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Assignee</InputLabel>
          <Select
            value={filterAssigneeId}
            label="Filter by Assignee"
            onChange={(e) => setFilterAssigneeId(e.target.value)}
          >
            <MenuItem value="all">All Team Members</MenuItem>
            {members.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
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
      </Stack>

      <Box
        sx={{
          height: 600,
          backgroundColor: '#fff',
          borderRadius: 1,
          padding: 2,
          '& .rbc-event': {
            padding: 0,
          },
          '& .rbc-event-label': {
            display: 'none',
          },
          '& .rbc-event-content': {
            padding: 0,
          },
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          eventPropGetter={eventStyleGetter}
          components={components}
          popup
          views={['month', 'week', 'agenda']}
        />
      </Box>

      {events.length === 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No chores to display. Add some chores to see them on the calendar!
          </Typography>
        </Box>
      )}
    </Box>
  );
}
