import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Button, 
  TextField, 
  Divider, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { 
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { auth } from '../firebase';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import { Cloudinary } from '@cloudinary/url-gen';

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME
  }
});

export default function Profile() {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setLoading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG)');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size should be less than 5MB');
      }

      // Create form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'profile_pictures');
      formData.append('public_id', currentUser.uid);
      formData.append('tags', 'profile,avatar');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      const data = await uploadPromise;
      const photoURL = data.secure_url;

      // Update Firebase profile with the new photoURL
      await updateProfile(auth.currentUser, { photoURL });
      
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => window.location.reload(), 1000); // Small delay to show success message
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      console.error('Profile picture update error:', err);
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleNameUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      await updateProfile(auth.currentUser, { displayName });
      setSuccess('Display name updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      await updateEmail(auth.currentUser, email);
      setSuccess('Email updated successfully!');
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setReAuthOpen(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const openPasswordDialog = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setError('');
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      return setError("Passwords don't match");
    }
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    setError('');
    
    try {
      // First reauthenticate with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Then update password
      await updatePassword(auth.currentUser, newPassword);
      
      setSuccess('Password updated successfully!');
      setPasswordDialogOpen(false);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReauthenticate = async () => {
    try {
      setLoading(true);
      setError('');
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      setReAuthOpen(false);
      setCurrentPassword('');
      setSuccess('Reauthentication successful. Please try your update again.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, pb: 10, maxWidth: '800px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        My Profile
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar Navigation */}
        <Paper sx={{ 
          p: 2, 
          width: { xs: '100%', md: 200 }, 
          height: 'fit-content',
          borderRadius: 2,
          boxShadow: 3
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 3
          }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={currentUser?.photoURL}
                sx={{ 
                  width: 80, 
                  height: 80,
                  mb: 1
                }}
              />
              <IconButton
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'background.paper'
                }}
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
              >
                <CameraAltIcon />
              </IconButton>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={isUploading}
              />
            </Box>
            {isUploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant={uploadProgress > 0 ? 'determinate' : 'indeterminate'} 
                  value={uploadProgress} 
                />
                {uploadProgress > 0 && (
                  <Typography variant="caption" display="block" textAlign="center">
                    {uploadProgress}% uploaded
                  </Typography>
                )}
              </Box>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
              {currentUser?.displayName || 'User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentUser?.email}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Button
            fullWidth
            startIcon={<EditIcon />}
            sx={{ 
              justifyContent: 'flex-start',
              mb: 1,
              fontWeight: activeSection === 'profile' ? 600 : 400
            }}
            onClick={() => setActiveSection('profile')}
          >
            Profile Info
          </Button>

          

          <Button
            fullWidth
            startIcon={<LockIcon />}
            sx={{ 
              justifyContent: 'flex-start',
              fontWeight: activeSection === 'password' ? 600 : 400
            }}
            onClick={() => {
              setActiveSection('password');
              openPasswordDialog();
            }}
          >
            Password
          </Button>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {activeSection === 'profile' && (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Profile Information
              </Typography>
              <TextField
                fullWidth
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                onClick={handleNameUpdate}
                disabled={loading || !displayName}
                startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
              >
                Update Name
              </Button>
            </Paper>
          )}

          {activeSection === 'email' && (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                variant="contained"
                onClick={handleEmailUpdate}
                disabled={loading || !email || email === currentUser.email}
                startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
              >
                Update Email
              </Button>
            </Paper>
          )}

          {activeSection === 'password' && (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Change Password
              </Typography>
              <Button
                variant="contained"
                onClick={openPasswordDialog}
                startIcon={<LockIcon />}
              >
                Change Password
              </Button>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={closePasswordDialog} fullWidth maxWidth="sm">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            To change your password, please enter your current password and then your new password.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button 
            onClick={handlePasswordUpdate}
            variant="contained"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reauthentication Dialog */}
      <Dialog open={reAuthOpen} onClose={() => setReAuthOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reauthentication Required</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            For security reasons, please enter your current password to continue.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReAuthOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleReauthenticate} 
            variant="contained"
            disabled={loading || !currentPassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}