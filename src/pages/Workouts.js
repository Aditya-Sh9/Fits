// src/pages/Workouts.js
import React, { useState, useEffect, useRef } from 'react';
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
  Paper,
  Switch,
  FormControlLabel,
  Slider,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { db } from '../firebase';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { getYouTubeThumbnail } from '../utils/youtubeUtils';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import ReplayIcon from '@mui/icons-material/Replay';
import AlarmIcon from '@mui/icons-material/Alarm';
import TimerIcon from '@mui/icons-material/Timer';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DragHandleIcon from '@mui/icons-material/DragHandle';

// Timer sound (using Web Audio API)
const playBeepSound = () => {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const beep = (delay) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + delay);
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime + delay);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime + delay);
    oscillator.stop(audioCtx.currentTime + delay + 0.3);
  };

  beep(0);
  beep(0.4);
  beep(0.8);
  beep(1.2);
  beep(1.6);
};

const TimerCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[6],
  },
}));

const TimeDisplay = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 700,
  textAlign: 'center',
  fontFamily: 'monospace',
  letterSpacing: 2,
  margin: theme.spacing(2, 0),
  color: theme.palette.primary.main,
}));

const initialWorkouts = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
};

const ExerciseCard = styled(Card)(({ theme, isDragging }) => ({
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(2),
  backgroundColor: isDragging ? theme.palette.primary.light + '20' : theme.palette.background.paper,
  boxShadow: isDragging ? theme.shadows[6] : theme.shadows[2],
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const DayCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
  },
}));

const DragHandle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
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
  const [loading, setLoading] = useState(true); // Changed to true initially
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Timer/Stopwatch states
  const [isTimerMode, setIsTimerMode] = useState(true);
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const intervalRef = useRef(null);

  // Load workouts from Firestore - Fixed version
  const fetchData = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    
    try {
      const docRef = doc(db, 'workouts', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure we have all days initialized
        const completeWorkouts = { ...initialWorkouts };
        Object.keys(initialWorkouts).forEach(day => {
          if (data[day] && Array.isArray(data[day])) {
            completeWorkouts[day] = data[day];
          }
        });
        setWorkouts(completeWorkouts);
      } else {
        // Initialize with empty data if document doesn't exist
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

  useEffect(() => {
    fetchData();
  }, [currentUser?.uid]); // Only run when uid changes

  // Timer/Stopwatch logic
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (isTimerMode && prevTime <= 0) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            playBeepSound();
            return 0;
          }
          return isTimerMode ? prevTime - 1 : prevTime + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isTimerMode]);

  const handleStartPause = () => {
    if (isTimerMode && time <= 0) {
      setTime(timerDuration);
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(isTimerMode ? timerDuration : 0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerDurationChange = (event, newValue) => {
    setTimerDuration(newValue);
    if (!isActive) {
      setTime(newValue);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const day = source.droppableId;
    const updatedExercises = Array.from(workouts[day]);
    const [removed] = updatedExercises.splice(source.index, 1);
    updatedExercises.splice(destination.index, 0, removed);

    const updatedWorkouts = {
      ...workouts,
      [day]: updatedExercises
    };

    setWorkouts(updatedWorkouts);
  };

  // Fixed save function
  const handleSaveWorkouts = async () => {
    if (!currentUser?.uid) {
      setSnackbar({
        open: true,
        message: 'You must be logged in to save',
        severity: 'error'
      });
      return;
    }
    
    setSaveLoading(true);
    try {
      // Validate data before saving
      const dataToSave = { ...workouts };
      Object.keys(dataToSave).forEach(day => {
        if (!Array.isArray(dataToSave[day])) {
          dataToSave[day] = [];
        }
      });

      await setDoc(doc(db, 'workouts', currentUser.uid), dataToSave);
      setSnackbar({
        open: true,
        message: 'Workout plan saved successfully!',
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
    if (!newExercise.name) {
      setSnackbar({
        open: true,
        message: 'Exercise name is required',
        severity: 'error'
      });
      return;
    }
    
    const exerciseToAdd = {
      ...newExercise,
      id: editingId || Date.now(),
      sets: Number(newExercise.sets) || 3,
      reps: newExercise.reps || "10-12",
      time: newExercise.time ? Number(newExercise.time) : null,
      timeUnit: newExercise.timeUnit || "seconds",
      videoUrl: newExercise.videoUrl || "",
      description: newExercise.description || ""
    };
    
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
    setSnackbar({
      open: true,
      message: 'Exercise deleted',
      severity: 'success'
    });
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
      
      {/* Timer/Stopwatch Section */}
      <TimerCard elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {isTimerMode ? 'Workout Timer' : 'Stopwatch'}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isTimerMode}
                onChange={() => {
                  setIsTimerMode(!isTimerMode);
                  setIsActive(false);
                  setTime(!isTimerMode ? timerDuration : 0);
                }}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isTimerMode ? <TimerIcon sx={{ mr: 1 }} /> : <AlarmIcon sx={{ mr: 1 }} />}
                {isTimerMode ? 'Timer' : 'Stopwatch'}
              </Box>
            }
          />
        </Box>

        {isTimerMode && showTimerSettings && (
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>Set Duration: {timerDuration} seconds</Typography>
            <Slider
              value={timerDuration}
              onChange={handleTimerDurationChange}
              min={5}
              max={300}
              step={5}
              valueLabelDisplay="auto"
              sx={{ width: '95%', mx: 'auto' }}
            />
          </Box>
        )}

        <TimeDisplay>
          {formatTime(time)}
        </TimeDisplay>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {(!isActive || (isTimerMode && time <= 0)) ? (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartPause}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Start
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PauseIcon />}
              onClick={handleStartPause}
              sx={{ borderRadius: 2, px: 3 }}
            >
              Pause
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={isTimerMode ? <ReplayIcon /> : <StopIcon />}
            onClick={handleReset}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {isTimerMode ? 'Reset' : 'Stop'}
          </Button>

          {isTimerMode && (
            <Button
              variant="text"
              onClick={() => setShowTimerSettings(!showTimerSettings)}
              sx={{ borderRadius: 2 }}
            >
              {showTimerSettings ? 'Hide Settings' : 'Set Timer'}
            </Button>
          )}
        </Box>
      </TimerCard>

      {/* Save Button */}
      <Button 
        variant="contained" 
        onClick={handleSaveWorkouts}
        sx={{ 
          mb: 4, 
          width: '100%',
          py: 1.5,
          fontWeight: 600,
          borderRadius: 2
        }}
        disabled={saveLoading}
        startIcon={saveLoading ? <CircularProgress size={20} /> : null}
      >
        {saveLoading ? 'Saving...' : 'Save Workout Plan'}
      </Button>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(initialWorkouts).map(([day]) => (
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
                  <Droppable droppableId={day}>
                    {(provided) => (
                      <Box 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {workouts[day].map((exercise, index) => {
                          const thumbnailUrl = getYouTubeThumbnail(exercise.videoUrl);
                          return (
                            <Draggable 
                              key={exercise.id} 
                              draggableId={String(exercise.id)} 
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <ExerciseCard
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  isDragging={snapshot.isDragging}
                                >
                                  <CardContent>
                                    <Stack direction="row" spacing={1} alignItems="flex-start">
                                      <DragHandle {...provided.dragHandleProps}>
                                        <DragHandleIcon />
                                      </DragHandle>
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
                                          {`${exercise.sets} sets × ${exercise.reps} reps`}
                                          {exercise.time && ` × ${exercise.time} ${exercise.timeUnit}`}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </CardContent>
                                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                                    <Tooltip title="Edit exercise">
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleEditExercise(day, exercise)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete exercise">
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleDeleteExercise(day, exercise.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </CardActions>
                                </ExerciseCard>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </Box>
                    )}
                  </Droppable>
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
                  sx={{ 
                    mx: 2, 
                    mb: 2,
                    borderRadius: 2,
                    fontWeight: 500
                  }}
                >
                  Add Exercise
                </Button>
              </CardActions>
            </DayCard>
          ))}
        </Box>
      </DragDropContext>

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
              required
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sets"
                  type="number"
                  value={newExercise.sets}
                  onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})}
                  variant="outlined"
                  size="medium"
                  inputProps={{ min: 1 }}
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
            sx={{ mr: 2, borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddExercise}
            disabled={!newExercise.name}
            sx={{ borderRadius: 2 }}
          >
            {editingId ? 'Update Exercise' : 'Add Exercise'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({...prev, open: false}))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({...prev, open: false}))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}