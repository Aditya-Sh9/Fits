// src/pages/Measurements.js
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  Divider,
  Grid,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip as MuiTooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import { getUserDocRef } from '../firebase';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);



const measurementFields = [
  { id: 'hips', label: 'Hips (cm)' },
  { id: 'highHips', label: 'High Hips (cm)' },
  { id: 'waist', label: 'Waist (cm)' },
  { id: 'bust', label: 'Bust (cm)' },
  { id: 'thighs', label: 'Thighs (cm)' },
  { id: 'innerThighs', label: 'Inner Thighs (cm)' },
];

export default function Measurements() {
  const { currentUser } = useAuth();
  const [current, setCurrent] = useState(Object.fromEntries(
    measurementFields.map(field => [field.id, ''])
  ));
  const [goals, setGoals] = useState(Object.fromEntries(
    measurementFields.map(field => [field.id, ''])
  ));
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMeasurements, setSelectedMeasurements] = useState(['hips', 'waist']);
  const [timeRange, setTimeRange] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load user data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const docRef = getUserDocRef(currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrent(data.current || Object.fromEntries(
            measurementFields.map(field => [field.id, ''])
          ));
          setGoals(data.goals || Object.fromEntries(
            measurementFields.map(field => [field.id, ''])
          ));
          setHistory(data.history || []);
        } else {
          // Initialize with empty data if document doesn't exist
          const initialData = {
            current: Object.fromEntries(
              measurementFields.map(field => [field.id, ''])
            ),
            goals: Object.fromEntries(
              measurementFields.map(field => [field.id, ''])
            ),
            history: []
          };
          await setDoc(docRef, initialData);
          setCurrent(initialData.current);
          setGoals(initialData.goals);
          setHistory(initialData.history);
        }
      } catch (error) {
        console.error('Error fetching measurements:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load measurements',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const saveToFirestore = async (updatedHistory) => {
    await setDoc(getUserDocRef(currentUser.uid), {
      current: Object.fromEntries(
        Object.entries(current).map(([key, value]) => [key, value ? parseFloat(value) : ''])
      ),
      goals: Object.fromEntries(
        Object.entries(goals).map(([key, value]) => [key, value ? parseFloat(value) : ''])
      ),
      history: updatedHistory,
    }, { merge: true });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    const hasMeasurements = Object.values(current).some(val => val !== '');
    if (!hasMeasurements) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one measurement',
        severity: 'warning'
      });
      return;
    }

    setSaveLoading(true);
    try {
      const newEntry = { 
        date, 
        ...Object.fromEntries(
          Object.entries(current).map(([key, value]) => [key, value ? parseFloat(value) : null])
        )
      };
      
      const updatedHistory = [...history, newEntry];
      await saveToFirestore(updatedHistory);
      setHistory(updatedHistory);
      setSnackbar({
        open: true,
        message: 'Measurements saved successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving measurements:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save measurements',
        severity: 'error'
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    
    try {
      const updatedHistory = history.filter(entry => 
        entry.date !== entryToDelete.date || 
        JSON.stringify(entry) !== JSON.stringify(entryToDelete)
      );
      
      await saveToFirestore(updatedHistory);
      setHistory(updatedHistory);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      setSnackbar({
        open: true,
        message: 'Entry deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete entry',
        severity: 'error'
      });
    }
  };

  const openDeleteDialog = (entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  // Filter history based on selected time range
  const filteredHistory = () => {
    if (timeRange === 'all' || history.length === 0) return history;
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case '3months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6months':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case 'year':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return history;
    }
    
    return history.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const filteredData = filteredHistory();
    const labels = filteredData.map(entry => 
      new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );
    
    const datasets = selectedMeasurements.map(measurementId => {
      const field = measurementFields.find(f => f.id === measurementId);
      const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
      return {
        label: field?.label || measurementId,
        data: filteredData.map(entry => entry[measurementId]),
        borderColor: color,
        backgroundColor: color.replace(')', ', 0.2)').replace('hsl', 'hsla'),
        tension: 0.3,
        borderWidth: 2
      };
    });

    return {
      labels,
      datasets
    };
  };

  const chartData = prepareChartData();

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} cm`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Centimeters (cm)'
        }
      }
    }
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
        Body Measurements
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 4,
            borderRadius: 2
          }
        }}
        centered
      >
        <Tab label="Enter Measurements" sx={{ fontWeight: 600 }} />
        <Tab label="View Progress" sx={{ fontWeight: 600 }} />
      </Tabs>

      {activeTab === 0 ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              p: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 500, flexGrow: 1 }}>
                  Current Measurements
                </Typography>
                <MuiTooltip title="Enter your current body measurements">
                  <InfoIcon color="action" />
                </MuiTooltip>
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {measurementFields.map(field => (
                  <Grid item xs={6} key={field.id}>
                    <TextField
                      fullWidth
                      label={field.label}
                      type="number"
                      value={current[field.id]}
                      onChange={(e) => setCurrent(prev => ({
                        ...prev,
                        [field.id]: e.target.value
                      }))}
                      variant="outlined"
                      size="small"
                      disabled={loading}
                      InputProps={{
                        endAdornment: 'cm'
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 500, flexGrow: 1 }}>
                  Goals
                </Typography>
                <MuiTooltip title="Set your target measurements">
                  <InfoIcon color="action" />
                </MuiTooltip>
              </Box>
              
              <Grid container spacing={2}>
                {measurementFields.map(field => (
                  <Grid item xs={6} key={field.id}>
                    <TextField
                      fullWidth
                      label={field.label}
                      type="number"
                      value={goals[field.id]}
                      onChange={(e) => setGoals(prev => ({
                        ...prev,
                        [field.id]: e.target.value
                      }))}
                      variant="outlined"
                      size="small"
                      disabled={loading}
                      InputProps={{
                        endAdornment: 'cm'
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Date"
                  type="date"
                  fullWidth
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                  disabled={loading}
                />
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleSave}
                  size="large"
                  disabled={saveLoading || loading}
                  startIcon={saveLoading ? <CircularProgress size={20} /> : null}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  {saveLoading ? 'Saving...' : 'Save Measurements'}
                </Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              p: 3,
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
                Measurement History
              </Typography>
              {history.length > 0 ? (
                <List sx={{ maxHeight: '500px', overflow: 'auto', py: 0 }}>
                  {[...history].reverse().map((entry, index) => (
                    <Paper key={index} elevation={2} sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {new Date(entry.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          }
                          secondary={
                            <Grid container spacing={1} sx={{ mt: 1 }}>
                              {measurementFields.map(field => (
                                entry[field.id] && (
                                  <Grid item xs={6} key={field.id}>
                                    <Typography variant="body2">
                                      {field.label}: <strong>{entry[field.id]} cm</strong>
                                    </Typography>
                                  </Grid>
                                )
                              ))}
                            </Grid>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => openDeleteDialog(entry)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.default'
                }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    No measurements recorded yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter your measurements to track your progress
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <FormControl sx={{ minWidth: 120 }} size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Measurements</InputLabel>
              <Select
                multiple
                value={selectedMeasurements}
                label="Measurements"
                onChange={(e) => setSelectedMeasurements(e.target.value)}
                renderValue={(selected) => selected.map(id => 
                  measurementFields.find(f => f.id === id)?.label || id).join(', ')}
                sx={{ borderRadius: 2 }}
              >
                {measurementFields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {filteredHistory().length > 0 ? (
            <>
              <Card sx={{ 
                p: 3, 
                mb: 4,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                  Progress Line Chart
                </Typography>
                <Box sx={{ height: '400px' }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </Card>
              
              <Card sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                  Progress Bar Chart
                </Typography>
                <Box sx={{ height: '400px' }}>
                  <Bar data={chartData} options={chartOptions} />
                </Box>
              </Card>
            </>
          ) : (
            <Card sx={{ 
              p: 3, 
              textAlign: 'center',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <Typography variant="body1" color="text.secondary">
                No measurement data available for the selected time range.
              </Typography>
            </Card>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this measurement entry from {entryToDelete && 
            new Date(entryToDelete.date).toLocaleDateString()}?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={closeDeleteDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteEntry}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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