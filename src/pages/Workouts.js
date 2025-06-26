// src/pages/Workouts.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Stack,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { getYouTubeThumbnail } from '../utils/youtubeUtils';
import { getWorkoutsDocRef } from '../firebase';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const initialWorkouts = days.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

const ExerciseCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(2),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const DayCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}));

export default function Workouts() {
  const { currentUser } = useAuth();
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const [openModal, setOpenModal] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [newExercise, setNewExercise] = useState({
    name: "",
    sets: 3,
    reps: "10-12",
    time: "",
    timeUnit: "seconds",
    videoUrl: "",
    description: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const docRef = getWorkoutsDocRef(currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const completeWorkouts = { ...initialWorkouts, ...data };
          setWorkouts(completeWorkouts);
        } else {
          // Initialize with empty workouts if document doesn't exist
          await setDoc(docRef, initialWorkouts);
          setWorkouts(initialWorkouts);
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load workouts',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleSaveWorkouts = async () => {
    if (!currentUser) return;
    
    setSaveLoading(true);
    try {
      await setDoc(getWorkoutsDocRef(currentUser.uid), workouts);
      setSnackbar({
        open: true,
        message: 'Workouts saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving workouts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save workouts',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOpenModal = (day) => {
    setCurrentDay(day);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setNewExercise({
      name: "",
      sets: 3,
      reps: "10-12",
      time: "",
      timeUnit: "seconds",
      videoUrl: "",
      description: ""
    });
    setEditingId(null);
  };

  const handleAddExercise = () => {
    if (!newExercise.name) return;
    
    const exerciseToAdd = editingId ? 
      { ...newExercise, id: editingId } : 
      { ...newExercise, id: Date.now() };
    
    const updatedWorkouts = { ...workouts };
    
    if (!updatedWorkouts[currentDay]) {
      updatedWorkouts[currentDay] = [];
    }
    
    if (editingId) {
      updatedWorkouts[currentDay] = updatedWorkouts[currentDay].map(ex => 
        ex.id === editingId ? exerciseToAdd : ex
      );
    } else {
      updatedWorkouts[currentDay] = [...updatedWorkouts[currentDay], exerciseToAdd];
    }
    
    setWorkouts(updatedWorkouts);
    handleCloseModal();
  };

  const handleEditExercise = (day, exercise) => {
    setNewExercise({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      time: exercise.time || "",
      timeUnit: exercise.timeUnit || "seconds",
      videoUrl: exercise.videoUrl,
      description: exercise.description
    });
    setEditingId(exercise.id);
    setCurrentDay(day);
    setOpenModal(true);
  };

  const handleDeleteExercise = (day, id) => {
    const updatedWorkouts = { ...workouts };
    updatedWorkouts[day] = updatedWorkouts[day].filter(ex => ex.id !== id);
    setWorkouts(updatedWorkouts);
  };

  const renderExerciseDetails = (exercise) => {
    let details = [];
    details.push(`${exercise.sets} sets`);
    
    if (exercise.reps) {
      details.push(`${exercise.reps} reps`);
    }
    
    if (exercise.time) {
      details.push(`${exercise.time} ${exercise.timeUnit}`);
    }
    
    return details.join(' × ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, pb: 10, maxWidth: '1200px', margin: '0 auto' }}>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          mb: 4, 
          fontWeight: 700,
          textAlign: 'center',
          color: 'primary.main',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        Workout Plans
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={handleSaveWorkouts}
        sx={{ mb: 4, width: '100%' }}
        disabled={saveLoading}
        startIcon={saveLoading ? <CircularProgress size={20} /> : null}
      >
        {saveLoading ? 'Saving...' : 'Save Workout Plan'}
      </Button>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day) => (
          <DayCard key={day}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h5" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                  {day}
                </Typography>
                <Chip 
                  label={`${workouts[day]?.length || 0} exercises`} 
                  color="primary" 
                  size="small"
                />
              </Box>
              
              {workouts[day]?.length > 0 ? (
                <Box>
                  {workouts[day].map((exercise) => {
                    const thumbnailUrl = getYouTubeThumbnail(exercise.videoUrl);
                    return (
                      <ExerciseCard key={exercise.id}>
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            {thumbnailUrl && (
                              <Avatar 
                                variant="rounded" 
                                src={thumbnailUrl} 
                                sx={{ width: 120, height: 90 }}
                                onClick={() => window.open(exercise.videoUrl, '_blank')}
                                style={{ cursor: 'pointer' }}
                              />
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1
                              }}>
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                  {exercise.name}
                                </Typography>
                                {exercise.videoUrl && !thumbnailUrl && (
                                  <IconButton 
                                    href={exercise.videoUrl} 
                                    target="_blank"
                                    rel="noopener"
                                    size="small"
                                  >
                                    <YouTubeIcon color="error" />
                                  </IconButton>
                                )}
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {exercise.description}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {renderExerciseDetails(exercise)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'flex-end' }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleEditExercise(day, exercise)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteExercise(day, exercise.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardActions>
                      </ExerciseCard>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100px',
                  textAlign: 'center',
                  my: 2
                }}>
                  <FitnessCenterIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No exercises added yet
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenModal(day)}
                fullWidth
                sx={{ mx: 2, mb: 2 }}
              >
                Add Exercise
              </Button>
            </CardActions>
          </DayCard>
        ))}
      </Box>

      {/* Add/Edit Exercise Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingId ? 'Edit Exercise' : 'Add New Exercise'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ py: 2 }}>
            <TextField
              fullWidth
              label="Exercise Name"
              value={newExercise.name}
              onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
              variant="outlined"
              size="medium"
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sets"
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: parseInt(e.target.value)})}
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Reps (or duration)"
                  value={newExercise.reps}
                  onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})}
                  variant="outlined"
                  size="medium"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time (optional)"
                  type="number"
                  value={newExercise.time}
                  onChange={(e) => setNewExercise({...newExercise, time: e.target.value})}
                  variant="outlined"
                  size="medium"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Time Unit</InputLabel>
                  <Select
                    value={newExercise.timeUnit}
                    label="Time Unit"
                    onChange={(e) => setNewExercise({...newExercise, timeUnit: e.target.value})}
                    variant="outlined"
                    size="medium"
                  >
                    <MenuItem value="seconds">Seconds</MenuItem>
                    <MenuItem value="minutes">Minutes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="YouTube Video URL"
              value={newExercise.videoUrl}
              onChange={(e) => setNewExercise({...newExercise, videoUrl: e.target.value})}
              variant="outlined"
              size="medium"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newExercise.description}
              onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
              variant="outlined"
              size="medium"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseModal}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddExercise}
            disabled={!newExercise.name}
          >
            {editingId ? 'Update Exercise' : 'Add Exercise'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}