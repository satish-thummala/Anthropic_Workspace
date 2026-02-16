# 🚀 Setup Guide - Chore Manager

Complete setup instructions for the Chore Manager full-stack application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)
- **Text Editor** - VS Code, Sublime, etc.
- **(Optional)** **Postman** - For API testing

### Verify Installation

```bash
node --version    # Should show v14 or higher
npm --version     # Should show 6 or higher
git --version     # Should show git version
```

## 📥 Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/satish-thummala/Anthropic_Workspace.git

# Navigate to project directory
cd Anthropic_Workspace/chore_manager
```

## 🔧 Step 2: Backend Setup

### 2.1 Install Backend Dependencies

```bash
cd server
npm install
```

This will install:
- express
- cors
- dotenv
- bcryptjs
- jsonwebtoken
- uuid
- body-parser

### 2.2 Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file (optional - defaults work fine)
nano .env  # or use your preferred editor
```

**Default .env configuration:**
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

> ⚠️ **Important:** Change `JWT_SECRET` in production!

### 2.3 Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

**Expected output:**
```
🚀 Chore Manager Server is running on port 5000
📍 API Base URL: http://localhost:5000/api
🏥 Health Check: http://localhost:5000/api/health

✅ Default users initialized
✅ Default team members initialized
✅ Sample chores initialized
✅ Database initialized with sample data
```

### 2.4 Verify Backend is Running

Open your browser or use curl:
```bash
# Check health endpoint
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"Chore Manager Server is running","timestamp":"..."}
```

## 🎨 Step 3: Frontend Setup

**Open a NEW terminal** (keep the backend running in the first one)

### 3.1 Install Frontend Dependencies

```bash
cd client
npm install
```

This will install:
- react
- react-dom
- typescript
- @mui/material
- react-big-calendar
- vite
- And other dependencies

### 3.2 Start the Frontend Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 3.3 Access the Application

1. Open your browser
2. Go to `http://localhost:5173`
3. You should see the login screen

### 3.4 Login

Use any of these demo accounts:

| Username | Password | Description |
|----------|----------|-------------|
| admin | admin123 | Admin account |
| user | user123 | Regular user |
| demo | demo | Demo account |

## ✅ Step 4: Verify Everything Works

### 4.1 Test Frontend
- ✅ Login successfully
- ✅ See the calendar view
- ✅ Navigate between tabs (Calendar, Chores, Team)
- ✅ Create a new chore
- ✅ Add a team member

### 4.2 Test Backend with Postman

#### Import Postman Collection

1. Open Postman
2. Click **Import**
3. Select file: `server/postman_collection.json`
4. Collection "Chore Manager API" will be imported

#### Test Authentication

1. In Postman, go to **Authentication** → **Login**
2. Send the request
3. Copy the `token` from the response
4. Token will be auto-saved as environment variable

#### Test Other Endpoints

All other endpoints will automatically use the saved token!

Try these:
- **GET** `/chores` - Get all chores
- **GET** `/team` - Get all team members
- **GET** `/chores/stats/summary` - Get statistics

## 🔗 Step 5: Connecting Frontend to Backend (Optional)

Currently, the frontend uses mock authentication. To connect it to the real backend:

### 5.1 Update AuthContext

Edit `client/src/contexts/AuthContext.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api';

const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    return true;
  }
  return false;
};
```

### 5.2 Update Other Contexts

Similarly, update:
- `ChoreContext.tsx` - for chore CRUD operations
- `TeamContext.tsx` - for team management

## 📁 Project Structure Overview

```
chore_manager/
├── client/              # React frontend (Port 5173)
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Node.js backend (Port 5000)
│   ├── routes/
│   ├── database/
│   ├── middleware/
│   └── server.js
├── README.md            # Main documentation
├── SETUP.md            # This file
└── .gitignore
```

## 🐛 Troubleshooting

### Port Already in Use

**Backend (Port 5000):**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5000   # Windows (find PID, then taskkill /PID xxx /F)

# Or change port in server/.env
PORT=5001
```

**Frontend (Port 5173):**
```bash
# Start on different port
npm run dev -- --port 3000
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Backend Not Starting

1. Check if Node.js is installed: `node --version`
2. Check if .env file exists: `ls -la server/`
3. Check server logs for errors
4. Ensure port 5000 is available

### Frontend Build Errors

```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Rebuild
npm run build
```

### CORS Errors (when connecting frontend to backend)

Backend already has CORS enabled. If issues persist:

Edit `server/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## 🔒 Security Notes

### For Development
- Default JWT_SECRET is fine
- CORS is open to all origins
- In-memory database resets on restart

### For Production
1. **Change JWT_SECRET** to a strong random key
2. **Configure CORS** to allow only your domain
3. **Use a real database** (MongoDB, PostgreSQL, etc.)
4. **Enable HTTPS**
5. **Add rate limiting**
6. **Implement proper error handling**
7. **Add request validation**

## 📚 Next Steps

After setup:

1. **Explore the App** - Try creating chores, adding team members
2. **Test the API** - Use Postman to test all endpoints
3. **Read Documentation** - Check out README.md for full features
4. **Customize** - Modify theme, add features, etc.
5. **Deploy** - Deploy to Heroku, Vercel, or your preferred platform

## 📞 Need Help?

- Check the [main README](./README.md)
- Look at [server README](./server/README.md)
- Check [client README](./client/README.md)
- Review code comments
- Open an issue on GitHub

## ✨ You're All Set!

Your development environment is ready. Happy coding! 🎉

**Quick Start Commands:**

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev

# Open: http://localhost:5173
```
