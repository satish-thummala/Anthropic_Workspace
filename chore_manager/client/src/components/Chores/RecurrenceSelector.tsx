import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Checkbox,
  Stack,
} from '@mui/material';
import type { RecurrenceRule, RecurrenceType, DayOfWeek } from '../../types/chore.types';

interface RecurrenceSelectorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

const DAYS_OF_WEEK = [
  { value: 0 as DayOfWeek, label: 'Sunday' },
  { value: 1 as DayOfWeek, label: 'Monday' },
  { value: 2 as DayOfWeek, label: 'Tuesday' },
  { value: 3 as DayOfWeek, label: 'Wednesday' },
  { value: 4 as DayOfWeek, label: 'Thursday' },
  { value: 5 as DayOfWeek, label: 'Friday' },
  { value: 6 as DayOfWeek, label: 'Saturday' },
];

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as RecurrenceType;
    onChange({
      type: newType,
      daysOfWeek: newType === 'weekly' ? [1] : undefined, // Default to Monday
      dayOfMonth: newType === 'monthly' ? 1 : undefined, // Default to 1st
      endDate: undefined,
    });
  };

  const handleDayToggle = (day: DayOfWeek) => {
    const currentDays = value.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    onChange({
      ...value,
      daysOfWeek: newDays.length > 0 ? newDays : [day], // Ensure at least one day is selected
    });
  };

  const handleDayOfMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(event.target.value, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      onChange({
        ...value,
        dayOfMonth: day,
      });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      endDate: event.target.value || undefined,
    });
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Recurrence
      </Typography>

      <RadioGroup value={value.type} onChange={handleTypeChange}>
        <FormControlLabel value="none" control={<Radio />} label="One-time" />
        <FormControlLabel value="weekly" control={<Radio />} label="Weekly" />
        <FormControlLabel value="monthly" control={<Radio />} label="Monthly" />
      </RadioGroup>

      {value.type === 'weekly' && (
        <Box sx={{ mt: 2, ml: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Repeat on:
          </Typography>
          <FormGroup>
            <Stack direction="row" flexWrap="wrap" spacing={1}>
              {DAYS_OF_WEEK.map((day) => (
                <FormControlLabel
                  key={day.value}
                  control={
                    <Checkbox
                      checked={value.daysOfWeek?.includes(day.value) || false}
                      onChange={() => handleDayToggle(day.value)}
                    />
                  }
                  label={day.label}
                />
              ))}
            </Stack>
          </FormGroup>
        </Box>
      )}

      {value.type === 'monthly' && (
        <Box sx={{ mt: 2, ml: 4 }}>
          <TextField
            label="Day of Month"
            type="number"
            value={value.dayOfMonth || 1}
            onChange={handleDayOfMonthChange}
            inputProps={{ min: 1, max: 31 }}
            helperText="Day 31 in shorter months will use the last day"
            sx={{ width: 200 }}
          />
        </Box>
      )}

      {value.type !== 'none' && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="End Date (Optional)"
            type="date"
            value={value.endDate || ''}
            onChange={handleEndDateChange}
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank for no end date"
            fullWidth
          />
        </Box>
      )}
    </Box>
  );
}
