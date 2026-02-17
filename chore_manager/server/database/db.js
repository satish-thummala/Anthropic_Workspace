const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// In-memory database (replace with real database in production)
const db = {
  users: [],
  teamMembers: [],
  chores: [],
};

// Initialize with default users
function initializeUsers() {
  const defaultUsers = [
    {
      id: uuidv4(),
      username: 'admin',
      password: 'admin123',
      name: 'Admin User',
      email: 'admin@chore-manager.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'user',
      password: 'user123',
      name: 'Regular User',
      email: 'user@chore-manager.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'demo',
      password: 'demo',
      name: 'Demo User',
      email: 'demo@chore-manager.com',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
  ];

  defaultUsers.forEach((user) => {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    db.users.push({ ...user, password: hashedPassword });
  });

  console.log('✅ Default users initialized');
}

// Initialize with default team members
function initializeTeamMembers() {
  const defaultMembers = [
    {
      id: uuidv4(),
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'Team Lead',
      color: '#FF6B6B',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'Developer',
      color: '#4ECDC4',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Carol Williams',
      email: 'carol@example.com',
      role: 'Designer',
      color: '#45B7D1',
      createdAt: new Date().toISOString(),
    },
  ];

  db.teamMembers.push(...defaultMembers);
  console.log('✅ Default team members initialized');
}

// Initialize with sample chores using the client-compatible data structure:
// recurrence: { type: 'none' | 'weekly' | 'monthly', daysOfWeek?, dayOfMonth?, endDate? }
function initializeChores() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sampleChores = [
    {
      id: uuidv4(),
      title: 'Clean Kitchen',
      notes: 'Wipe counters, clean sink, take out trash',
      date: today.toISOString().split('T')[0],
      assigneeId: db.teamMembers[0]?.id,
      recurrence: { type: 'none' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Weekly Team Meeting',
      notes: 'Discuss weekly goals and progress',
      date: tomorrow.toISOString().split('T')[0],
      assigneeId: db.teamMembers[1]?.id,
      recurrence: {
        type: 'weekly',
        daysOfWeek: [1], // Monday
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Monthly Report',
      notes: 'Compile and send monthly chore report',
      date: today.toISOString().split('T')[0],
      assigneeId: db.teamMembers[2]?.id,
      recurrence: {
        type: 'monthly',
        dayOfMonth: new Date().getDate(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  db.chores.push(...sampleChores);
  console.log('✅ Sample chores initialized');
}

// Initialize database
function initializeDatabase() {
  initializeUsers();
  initializeTeamMembers();
  initializeChores();
  console.log('✅ Database initialized with sample data\n');
}

initializeDatabase();

module.exports = db;
