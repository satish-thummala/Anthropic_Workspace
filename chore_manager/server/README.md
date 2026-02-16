# Chore Manager Server

Backend API server for the Office Chore Manager application built with Node.js and Express.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy .env file and update if needed
# Default settings work out of the box
```

3. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### 🔐 Authentication Endpoints

#### 1. Register New User
**POST** `/api/auth/register`

**Body:**
```json
{
  "username": "john_doe",
  "password": "password123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2026-02-13T10:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

---

#### 2. Login
**POST** `/api/auth/login`

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "username": "admin",
    "name": "Admin User",
    "email": "admin@chore-manager.com",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

**Default Test Accounts:**
- Username: `admin` | Password: `admin123`
- Username: `user` | Password: `user123`
- Username: `demo` | Password: `demo`

---

#### 3. Get Current User
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "username": "admin",
  "name": "Admin User",
  "email": "admin@chore-manager.com",
  "role": "admin"
}
```

---

#### 4. Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

---

#### 5. Change Password
**POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

---

### 📋 Chore Endpoints

#### 1. Get All Chores
**GET** `/api/chores`

**Query Parameters:**
- `assigneeId` - Filter by team member ID
- `status` - Filter by status (pending, in-progress, completed, cancelled)
- `startDate` - Filter by start date (YYYY-MM-DD)
- `endDate` - Filter by end date (YYYY-MM-DD)

**Example:**
```
GET /api/chores?status=pending&assigneeId=abc123
```

**Response:**
```json
{
  "count": 2,
  "chores": [
    {
      "id": "uuid",
      "title": "Clean Kitchen",
      "description": "Wipe counters, clean sink",
      "date": "2026-02-13",
      "assigneeId": "team_member_id",
      "recurring": false,
      "status": "pending",
      "color": "#ff9800",
      "createdAt": "2026-02-13T10:00:00.000Z",
      "updatedAt": "2026-02-13T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Single Chore
**GET** `/api/chores/:id`

**Response:**
```json
{
  "id": "uuid",
  "title": "Clean Kitchen",
  "description": "Wipe counters, clean sink",
  "date": "2026-02-13",
  "assigneeId": "team_member_id",
  "recurring": false,
  "status": "pending",
  "color": "#ff9800"
}
```

---

#### 3. Create Chore
**POST** `/api/chores`

**Body:**
```json
{
  "title": "Clean Kitchen",
  "description": "Wipe counters, clean sink, take out trash",
  "date": "2026-02-13",
  "assigneeId": "team_member_id",
  "recurring": true,
  "recurrenceRule": {
    "frequency": "weekly",
    "interval": 1
  },
  "color": "#ff9800"
}
```

**Response:**
```json
{
  "message": "Chore created successfully",
  "chore": {
    "id": "new_uuid",
    "title": "Clean Kitchen",
    ...
  }
}
```

---

#### 4. Update Chore
**PUT** `/api/chores/:id`

**Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "date": "2026-02-14",
  "assigneeId": "new_assignee_id",
  "status": "in-progress",
  "color": "#4caf50"
}
```

---

#### 5. Update Chore Status
**PATCH** `/api/chores/:id/status`

**Body:**
```json
{
  "status": "completed"
}
```

**Valid statuses:** `pending`, `in-progress`, `completed`, `cancelled`

---

#### 6. Delete Chore
**DELETE** `/api/chores/:id`

**Response:**
```json
{
  "message": "Chore deleted successfully",
  "chore": { ... }
}
```

---

#### 7. Get Chore Statistics
**GET** `/api/chores/stats/summary`

**Response:**
```json
{
  "total": 10,
  "pending": 5,
  "inProgress": 2,
  "completed": 3,
  "cancelled": 0,
  "recurring": 4,
  "assigned": 8,
  "unassigned": 2
}
```

---

### 👥 Team Member Endpoints

#### 1. Get All Team Members
**GET** `/api/team`

**Response:**
```json
{
  "count": 3,
  "members": [
    {
      "id": "uuid",
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "role": "Team Lead",
      "color": "#1976d2",
      "createdAt": "2026-02-13T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Single Team Member
**GET** `/api/team/:id`

**Response:**
```json
{
  "id": "uuid",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "role": "Team Lead",
  "color": "#1976d2",
  "assignedChores": 5,
  "chores": [ ... ]
}
```

---

#### 3. Create Team Member
**POST** `/api/team`

**Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "role": "Developer",
  "color": "#ff5722"
}
```

---

#### 4. Update Team Member
**PUT** `/api/team/:id`

**Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "role": "Senior Developer",
  "color": "#9c27b0"
}
```

---

#### 5. Delete Team Member
**DELETE** `/api/team/:id`

**Response:**
```json
{
  "message": "Team member deleted successfully",
  "member": { ... },
  "unassignedChores": 5
}
```

Note: Deleting a team member will unassign all their chores.

---

#### 6. Get Team Member's Chores
**GET** `/api/team/:id/chores`

**Response:**
```json
{
  "member": "Alice Johnson",
  "count": 5,
  "chores": [ ... ]
}
```

---

#### 7. Get Team Workload Statistics
**GET** `/api/team/stats/workload`

**Response:**
```json
{
  "workload": [
    {
      "memberId": "uuid",
      "memberName": "Alice Johnson",
      "totalChores": 10,
      "pending": 5,
      "completed": 5,
      "completionRate": 50
    }
  ],
  "unassignedChores": 2
}
```

---

### 👤 User Endpoints

#### 1. Get All Users
**GET** `/api/users`

**Response:**
```json
{
  "count": 3,
  "users": [
    {
      "id": "uuid",
      "username": "admin",
      "name": "Admin User",
      "email": "admin@chore-manager.com",
      "role": "admin",
      "createdAt": "2026-02-13T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Single User
**GET** `/api/users/:id`

---

#### 3. Update User Profile
**PUT** `/api/users/:id`

**Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

Note: Users can only update their own profile unless they're admin.

---

#### 4. Delete User (Admin Only)
**DELETE** `/api/users/:id`

---

### 🏥 Health Check

#### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "status": "OK",
  "message": "Chore Manager Server is running",
  "timestamp": "2026-02-13T10:00:00.000Z"
}
```

---

## 🧪 Testing with Postman

### Setup

1. Import the collection (create in Postman):
   - Base URL: `http://localhost:5000/api`

2. Authentication Flow:
   ```
   1. POST /api/auth/login
   2. Copy the token from response
   3. Add to Authorization header: Bearer <token>
   4. Use token for all protected endpoints
   ```

### Example Postman Collection Structure

```
Chore Manager API
├── Authentication
│   ├── Register
│   ├── Login
│   ├── Get Current User
│   ├── Logout
│   └── Change Password
├── Chores
│   ├── Get All Chores
│   ├── Get Single Chore
│   ├── Create Chore
│   ├── Update Chore
│   ├── Update Status
│   ├── Delete Chore
│   └── Get Statistics
├── Team
│   ├── Get All Members
│   ├── Get Single Member
│   ├── Create Member
│   ├── Update Member
│   ├── Delete Member
│   ├── Get Member Chores
│   └── Get Workload Stats
└── Users
    ├── Get All Users
    ├── Get Single User
    ├── Update Profile
    └── Delete User
```

---

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire in 7 days
- Protected routes require valid JWT token
- CORS is enabled for all origins (configure for production)

---

## 📝 Data Storage

Currently uses **in-memory storage** (data resets on server restart).

For production, replace with:
- MongoDB
- PostgreSQL
- MySQL
- etc.

---

## 🐛 Error Handling

All errors return JSON in this format:
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## 📦 Project Structure

```
chore_manager_server/
├── database/
│   └── db.js              # In-memory database
├── middleware/
│   └── auth.js            # JWT authentication
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── chores.js          # Chore management routes
│   ├── team.js            # Team member routes
│   └── users.js           # User management routes
├── .env                   # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js              # Main server file
```

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

---

## 📄 License

ISC

---

## 👨‍💻 Author

Created for Office Chore Manager Application
