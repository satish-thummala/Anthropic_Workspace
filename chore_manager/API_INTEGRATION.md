# 🔗 API Integration Guide

This document explains how the React client connects to the Node.js backend server.

## ✅ What Has Been Done

The client application has been updated to connect to the backend API instead of using mock data.

### Changes Made:

1. **✅ API Utility Layer** (`src/utils/api.ts`)
   - Centralized API request handling
   - Automatic JWT token injection
   - Error handling and 401 redirect
   - API endpoint constants

2. **✅ Updated Contexts**
   - `AuthContext` - Real login/logout with JWT tokens
   - `ChoreContext` - CRUD operations via API
   - `TeamContext` - Team management via API

3. **✅ Environment Configuration**
   - `.env` file for API base URL
   - `.env.example` template

4. **✅ Authentication Flow**
   - Login stores JWT token in localStorage
   - All API requests include Authorization header
   - Token validation on app load
   - Automatic logout on 401 Unauthorized

## 🚀 Quick Start

### Step 1: Start the Backend Server

```bash
# Terminal 1: Start backend
cd server
npm install  # if not already installed
npm run dev

# Server will run on http://localhost:5000
```

### Step 2: Configure Client Environment

```bash
# Navigate to client folder
cd client

# Copy environment file (already done)
# The .env file is already configured with:
# VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 3: Start the Frontend

```bash
# Still in client folder
npm install  # if not already installed
npm run dev

# Client will run on http://localhost:5173
```

### Step 4: Test the Integration

1. Open browser: `http://localhost:5173`
2. Login with backend credentials:
   - **admin** / **admin123**
   - **user** / **user123**
   - **demo** / **demo**
3. Create a chore - it will be saved to the backend!
4. Refresh the page - data persists via API

## 📡 API Endpoints Being Used

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Validate token and get current user
- `POST /api/auth/logout` - Logout (clears server session)

### Chores
- `GET /api/chores` - Get all chores
- `POST /api/chores` - Create new chore
- `PUT /api/chores/:id` - Update chore
- `DELETE /api/chores/:id` - Delete chore

### Team Members
- `GET /api/team` - Get all team members
- `POST /api/team` - Create team member
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member

## 🔐 Authentication Flow

```
1. User enters username/password
   ↓
2. POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend returns { user, token }
   ↓
5. Client stores token in localStorage
   ↓
6. All subsequent API calls include:
   Header: Authorization: Bearer <token>
   ↓
7. Backend validates token on each request
   ↓
8. If token invalid: 401 → Client redirects to login
```

## 🔧 Configuration

### Change API URL

Edit `client/.env`:

```env
# For local development
VITE_API_BASE_URL=http://localhost:5000/api

# For production (when deployed)
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### CORS Configuration

The backend is already configured to accept requests from any origin (development mode).

For production, update `server/server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

## 🧪 Testing the Integration

### Test 1: Login

```bash
# Open browser console (F12)
# Try logging in
# Check Network tab - you should see:

POST http://localhost:5000/api/auth/login
Status: 200
Response: { user: {...}, token: "jwt_token_here" }
```

### Test 2: Create Chore

```bash
# After login, create a chore
# Check Network tab:

POST http://localhost:5000/api/chores
Headers: Authorization: Bearer <token>
Status: 201
Response: { message: "...", chore: {...} }
```

### Test 3: Verify Data Persistence

```bash
# Stop the frontend (Ctrl+C)
# Restart frontend: npm run dev
# Login again
# Your chores should still be there (loaded from backend)
```

## 🐛 Troubleshooting

### Problem: "Failed to fetch"

**Cause:** Backend server not running

**Solution:**
```bash
cd server
npm run dev
```

### Problem: "CORS error"

**Cause:** CORS not properly configured

**Solution:** Backend already has CORS enabled. Check if backend is running.

### Problem: "401 Unauthorized"

**Cause:** Token expired or invalid

**Solution:** App will automatically redirect to login. Just login again.

### Problem: "Network request failed"

**Cause:** Wrong API URL in .env

**Solution:** Check `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
# Make sure port matches your backend port
```

### Problem: Login fails with correct credentials

**Cause:** Backend not running or database not initialized

**Solution:**
```bash
# Restart backend server
cd server
npm run dev

# Check logs - should see:
# ✅ Default users initialized
```

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ HTTP Request
       │ Authorization: Bearer <token>
       │
       ▼
┌─────────────┐
│  API Layer  │
│  (api.ts)   │
└──────┬──────┘
       │
       │ Fetch + Headers
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       │ Validate Token
       │
       ▼
┌─────────────┐
│  Database   │
│ (In-Memory) │
└─────────────┘
```

## 🔄 Migration from Mock Data

### Before (Mock Data)
```typescript
// Old AuthContext
const MOCK_USERS = [...]
const login = async () => {
  // Check mock users
  const user = MOCK_USERS.find(...)
}
```

### After (Real API)
```typescript
// New AuthContext
import { apiRequest } from '../utils/api'
const login = async () => {
  // Call real backend
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({...})
  })
}
```

## 📝 Next Steps

### For Development
- ✅ Client and server connected
- ✅ Authentication working
- ✅ CRUD operations working
- ⏳ Add error notifications (toast/snackbar)
- ⏳ Add loading states in UI
- ⏳ Add form validation feedback

### For Production
- ⏳ Deploy backend to Heroku/Railway/Render
- ⏳ Deploy frontend to Vercel/Netlify
- ⏳ Update .env with production API URL
- ⏳ Configure CORS for production domain
- ⏳ Use real database (MongoDB/PostgreSQL)
- ⏳ Enable HTTPS
- ⏳ Add rate limiting

## 📚 Related Documentation

- [Backend API Documentation](../server/README.md)
- [Frontend Setup Guide](./README.md)
- [Main Project README](../README.md)

## 🎉 Success!

Your React frontend is now connected to your Node.js backend! All data is being stored and retrieved through the API.

**What works now:**
- ✅ Real authentication with JWT
- ✅ Persistent data storage
- ✅ CRUD operations for chores
- ✅ CRUD operations for team members
- ✅ Token-based authorization

Happy coding! 🚀
