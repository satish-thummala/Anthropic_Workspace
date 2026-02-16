# 🗂️ Chore Manager - Full Stack Application

A complete office chore management system built with React, TypeScript, Node.js, and Express. This application helps teams organize, track, and manage office chores with features like recurring tasks, team member assignments, and calendar views.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Frontend (React)
- 📅 **Calendar View** - Outlook-style monthly calendar with color-coded chores
- ✅ **Chore Management** - Create, edit, delete, and track chores
- 🔄 **Recurring Chores** - Set up daily, weekly, or monthly recurring tasks
- 👥 **Team Management** - Add/remove team members and assign chores
- 🔐 **Authentication** - Secure login/logout with JWT tokens
- 📊 **Dashboard** - View chore statistics and team workload
- 🎨 **Material-UI** - Beautiful, responsive design
- 💾 **Local Storage** - Persist data between sessions

### Backend (Node.js + Express)
- 🔒 **JWT Authentication** - Secure token-based authentication
- 🗄️ **RESTful API** - Complete CRUD operations for all resources
- 👤 **User Management** - Register, login, profile management
- 📋 **Chore API** - Full chore lifecycle management with filters
- 👥 **Team API** - Team member management and workload statistics
- 📊 **Statistics** - Real-time stats for chores and team workload
- 🔐 **Password Hashing** - Secure password storage with bcrypt
- ✅ **Request Validation** - Input validation and error handling

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **React Big Calendar** - Calendar component
- **Vite** - Build tool and dev server
- **Context API** - State management

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **UUID** - Unique ID generation
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
chore_manager/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── Auth/             # Login screen
│   │   │   ├── Calendar/         # Calendar view
│   │   │   ├── Chores/           # Chore management
│   │   │   ├── Layout/           # App layout
│   │   │   └── TeamMembers/      # Team management
│   │   ├── contexts/             # React contexts
│   │   │   ├── AuthContext.tsx   # Authentication
│   │   │   ├── ChoreContext.tsx  # Chore state
│   │   │   └── TeamContext.tsx   # Team state
│   │   ├── types/                # TypeScript types
│   │   ├── utils/                # Helper functions
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── public/                   # Static assets
│   ├── package.json
│   └── README.md
│
├── server/                         # Node.js backend
│   ├── database/
│   │   └── db.js                 # In-memory database
│   ├── middleware/
│   │   └── auth.js               # JWT authentication
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── chores.js             # Chore endpoints
│   │   ├── team.js               # Team endpoints
│   │   └── users.js              # User endpoints
│   ├── .env                      # Environment variables
│   ├── server.js                 # Main server file
│   ├── postman_collection.json   # Postman API collection
│   ├── package.json
│   └── README.md
│
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/satish-thummala/Anthropic_Workspace.git
   cd Anthropic_Workspace/chore_manager
   ```

2. **Set up the backend:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   Server will start on `http://localhost:5000`

3. **Set up the frontend (in a new terminal):**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Client will start on `http://localhost:5173`

4. **Access the application:**
   - Open your browser to `http://localhost:5173`
   - Login with default credentials:
     - **Admin:** `admin` / `admin123`
     - **User:** `user` / `user123`
     - **Demo:** `demo` / `demo`

## 💻 Development

### Backend Development

```bash
cd server

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

**Environment Variables (.env):**
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

### Frontend Development

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing the API

#### Option 1: Import Postman Collection
1. Open Postman
2. Click **Import**
3. Select `server/postman_collection.json`
4. All API endpoints are ready to test!

#### Option 2: Use cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get all chores (replace <token> with your JWT token)
curl -X GET http://localhost:5000/api/chores \
  -H "Authorization: Bearer <token>"
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/me` | Get current user | ✅ |
| GET | `/chores` | Get all chores | ✅ |
| POST | `/chores` | Create new chore | ✅ |
| PUT | `/chores/:id` | Update chore | ✅ |
| DELETE | `/chores/:id` | Delete chore | ✅ |
| GET | `/team` | Get all team members | ✅ |
| POST | `/team` | Create team member | ✅ |
| GET | `/team/stats/workload` | Get workload stats | ✅ |
| GET | `/users` | Get all users | ✅ |

**Full API documentation:** See [server/README.md](./server/README.md)

## 📸 Screenshots

### Login Screen
Beautiful gradient login page with demo account options.

### Calendar View
Outlook-style calendar showing all chores with color coding and filtering.

### Chore Management
Create and manage chores with recurring options and team assignments.

### Team Management
Add/remove team members and view workload statistics.

## 🔐 Default Test Accounts

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin123 | admin | Full access |
| user | user123 | user | Standard access |
| demo | demo | user | Demo account |

## 🗄️ Database

Currently uses **in-memory storage** with sample data:
- ✅ 3 default users (admin, user, demo)
- ✅ 3 sample team members (Alice, Bob, Carol)
- ✅ 2 example chores

**Note:** Data resets when the server restarts.

**For Production:** Replace in-memory storage with:
- MongoDB
- PostgreSQL
- MySQL
- Or any other database

## 🔄 Connecting Frontend to Backend

The frontend can be connected to the backend by:

1. **Update API base URL** in `client/src/contexts/*.tsx`:
   ```typescript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```

2. **Add JWT token to requests**:
   ```typescript
   const token = localStorage.getItem('authToken');
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

3. **Handle CORS** (already configured in server)

## 🚢 Deployment

### Backend (Server)

**Deploy to Heroku/Railway/Render:**
1. Set environment variables
2. Push code to platform
3. Platform will auto-detect Node.js and run `npm start`

### Frontend (Client)

**Deploy to Vercel/Netlify:**
1. Build the project: `npm run build`
2. Upload `dist/` folder or connect GitHub repo
3. Set environment variables if needed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Satish Thummala**
- GitHub: [@satish-thummala](https://github.com/satish-thummala)

## 🙏 Acknowledgments

- Built as a learning project for full-stack development
- Uses Material-UI for beautiful React components
- Express.js for robust backend API
- React Big Calendar for the calendar view

## 📞 Support

If you have any questions or issues, please:
1. Check the [Issues](https://github.com/satish-thummala/Anthropic_Workspace/issues) page
2. Open a new issue with details
3. Check server logs for debugging

---

**Happy Coding! 🎉**
