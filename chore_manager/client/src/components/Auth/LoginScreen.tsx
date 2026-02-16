import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Container,
  Divider,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'primary.main',
                borderRadius: '50%',
                width: 64,
                height: 64,
                mb: 2,
              }}
            >
              <AssignmentIcon sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Office Chore Manager
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage your team's chores
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              sx={{ mb: 2 }}
              disabled={isLoading}
            />

            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              sx={{ mb: 3 }}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Demo Accounts Section */}
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 2 }}>
              <Chip label="Demo Accounts" size="small" />
            </Divider>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try these demo accounts:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('admin', 'admin123')}
                disabled={isLoading}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Admin Account
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Username: admin | Password: admin123
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('user', 'user123')}
                disabled={isLoading}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="body2" fontWeight="bold">
                    User Account
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Username: user | Password: user123
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDemoLogin('demo', 'demo')}
                disabled={isLoading}
                sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
              >
                <Box sx={{ textAlign: 'left', width: '100%' }}>
                  <Typography variant="body2" fontWeight="bold">
                    Demo Account
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Username: demo | Password: demo
                  </Typography>
                </Box>
              </Button>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              © 2026 Office Chore Manager. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
