# Chore Manager - Frontend (React)

React + TypeScript frontend for the Office Chore Manager application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will run on `http://localhost:5173`

## 📋 Features

- 📅 **Calendar View** - Outlook-style monthly calendar with color-coded chores
- ✅ **Chore Management** - Create, edit, delete chores with descriptions
- 🔄 **Recurring Chores** - Set up daily, weekly, or monthly recurring tasks
- 👥 **Team Management** - Add/remove team members and assign chores
- 🔐 **Authentication** - Secure login screen with demo accounts
- 💾 **Local Storage** - Persist data between sessions
- 🎨 **Material-UI** - Beautiful, responsive design
- 🔍 **Filtering** - Filter chores by team member
- 📊 **Statistics** - View chore counts and team workload

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **React Big Calendar** - Calendar component
- **Vite** - Build tool and dev server
- **Context API** - State management
- **date-fns** - Date manipulation

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── Auth/               # Login screen
│   │   └── LoginScreen.tsx
│   ├── Calendar/           # Calendar view
│   │   ├── ChoreCalendar.tsx
│   │   └── ChoreEventComponent.tsx
│   ├── Chores/             # Chore management
│   │   ├── ChoreForm.tsx
│   │   ├── ChoreList.tsx
│   │   └── RecurrenceSelector.tsx
│   ├── Layout/             # App layout
│   │   └── AppLayout.tsx
│   └── TeamMembers/        # Team management
│       └── TeamManagement.tsx
├── contexts/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── ChoreContext.tsx   # Chore management
│   └── TeamContext.tsx    # Team management
├── types/                  # TypeScript types
│   ├── chore.types.ts
│   └── team.types.ts
├── utils/                  # Helper functions
│   ├── dateUtils.ts
│   └── recurrenceUtils.ts
├── constants/              # Constants
│   └── colors.ts
├── App.tsx                 # Main component
├── main.tsx                # Entry point
├── theme.ts                # MUI theme
└── index.css               # Global styles
```

## 🔐 Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| user | user123 | User |
| demo | demo | User |

## 💡 Usage

### 1. Login
- Open the app and you'll see the login screen
- Click on any demo account button or enter credentials manually
- After login, you'll see the calendar view

### 2. Managing Chores
- Click "Add Chore" button to create a new chore
- Fill in title, description, date, and assignee
- Check "Recurring Chore" to set up repeating tasks
- View all chores in the calendar or list view

### 3. Team Management
- Go to the "Team" tab
- Click "Add Team Member" to add new members
- Assign colors to members for easy identification
- Delete members (will unassign their chores)

### 4. Calendar Views
- **Month View** - See all chores for the month
- **Week View** - Detailed weekly view
- **Agenda View** - List view of upcoming chores
- Filter by team member using the dropdown

## 🔗 Connecting to Backend

Currently, the frontend uses mock authentication with localStorage. To connect to the real backend:

1. **Update API calls** in context files (`src/contexts/`)
2. **Add API base URL**:
   ```typescript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```
3. **Add JWT token handling**:
   ```typescript
   const token = localStorage.getItem('authToken');
   headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   }
   ```

See the [main README](../README.md) for backend setup instructions.

## 🎨 Customization

### Changing Theme
Edit `src/theme.ts` to customize Material-UI theme:
```typescript
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Change primary color
    },
  },
});
```

### Adding New Chore Fields
1. Update types in `src/types/chore.types.ts`
2. Add fields to `ChoreForm.tsx`
3. Update context in `ChoreContext.tsx`

## 📦 Scripts

```bash
# Development
npm run dev           # Start dev server

# Production
npm run build         # Build for production
npm run preview       # Preview production build

# Linting
npm run lint          # Run ESLint
```

## 🐛 Common Issues

### Port Already in Use
If port 5173 is busy:
```bash
npm run dev -- --port 3000
```

### Build Errors
Clear cache and rebuild:
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Notes

- Data is stored in browser `localStorage`
- Authentication is currently mock-based (localStorage)
- Calendar supports drag-and-drop (view-only)
- Recurring chores generate instances dynamically

## 📖 Full Documentation

For complete project documentation, deployment guides, and backend setup, see:
- [Main Project README](../README.md)
- [Backend README](../server/README.md)

## 🤝 Contributing

See the [main README](../README.md) for contribution guidelines.

## 📄 License

ISC License - See [main README](../README.md) for details.
