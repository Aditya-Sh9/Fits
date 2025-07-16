// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import Measurements from './pages/Measurements';
import Workouts from './pages/Workouts';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function PageTitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const pageTitles = {
      '/': 'Home | Your Fitness Journey',
      '/measurements': 'Measurements | Your Fitness Journey',
      '/workouts': 'Workouts | Your Fitness Journey',
      '/profile': 'Profile | Your Fitness Journey'
    };
    
    document.title = pageTitles[location.pathname] || 'Your Fitness Journey';
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Home />
                </>
              </ProtectedRoute>
            } />
            <Route path="/measurements" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Measurements />
                </>
              </ProtectedRoute>
            } />
            <Route path="/workouts" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Workouts />
                </>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Profile />
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;