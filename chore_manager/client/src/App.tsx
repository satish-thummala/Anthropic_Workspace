import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TeamProvider } from "./contexts/TeamContext";
import { ChoreProvider } from "./contexts/ChoreContext";
import { AppLayout } from "./components/Layout/AppLayout";
import { TeamManagement } from "./components/TeamMembers/TeamManagement";
import { ChoreList } from "./components/Chores/ChoreList";
import { ChoreCalendar } from "./components/Calendar/ChoreCalendar";
import { LoginScreen } from "./components/Auth/LoginScreen";
import { Box } from "@mui/material";
import { theme } from "./theme";

function CalendarView() {
  return (
    <Box sx={{ p: 2 }}>
      <ChoreCalendar />
    </Box>
  );
}

function ChoresView() {
  return (
    <Box sx={{ p: 2 }}>
      <ChoreList />
    </Box>
  );
}

function TeamView() {
  return (
    <Box sx={{ p: 0 }}>
      <TeamManagement />
    </Box>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <TeamProvider>
      <ChoreProvider>
        <AppLayout
          calendarView={<CalendarView />}
          choresView={<ChoresView />}
          teamView={<TeamView />}
        />
      </ChoreProvider>
    </TeamProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
