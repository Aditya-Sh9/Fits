// src/components/Navbar.js
import * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StraightenIcon from '@mui/icons-material/Straighten';
import PersonIcon from '@mui/icons-material/Person';
import Paper from '@mui/material/Paper';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';


const StyledBottomNavigation = styled(BottomNavigation)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: '24px 24px 0 0',
  position: 'fixed',
  bottom: 0,
  width: '100%',
  maxWidth: '600px',
  left: '50%',
  transform: 'translateX(-50%)',
  boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  '& .Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [value, setValue] = React.useState(
    location.pathname === '/' ? 0 : 
    location.pathname === '/measurements' ? 1 : 
    location.pathname === '/workouts' ? 2 :
    location.pathname === '/profile' ? 3 : 4
  );
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
    handleMenuClose();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLogoutDialogOpen(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      backgroundColor: alpha('#ffffff', 0.8),
      backdropFilter: 'blur(10px)',
    }}>
      <StyledBottomNavigation
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      >
        <BottomNavigationAction 
          label="Home" 
          icon={<HomeIcon />} 
          component={Link} 
          to="/" 
        />
        <BottomNavigationAction 
          label="Measurements" 
          icon={<StraightenIcon />} 
          component={Link} 
          to="/measurements" 
        />
        <BottomNavigationAction 
          label="Workouts" 
          icon={<FitnessCenterIcon />} 
          component={Link} 
          to="/workouts" 
        />
        <BottomNavigationAction 
          label="Profile" 
          icon={<PersonIcon />} 
          component={Link} 
          to="/profile" 
        />
        {currentUser && (
          <BottomNavigationAction
            label="Logout"
            icon={<LogoutIcon />}
            onClick={handleLogoutClick}
          />
        )}
      </StyledBottomNavigation>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel}>Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}