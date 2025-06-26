import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid,
  Container,
  Stack,
  Divider,
  useTheme
} from '@mui/material';
import { Link } from 'react-router-dom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import StraightenIcon from '@mui/icons-material/Straighten';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { styled } from '@mui/material/styles';

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: theme.shadows[4],
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  margin: '0 auto 24px',
  fontSize: 40,
}));

export default function Home() {
  const theme = useTheme();

  const features = [
    {
      icon: <StraightenIcon fontSize="large" />,
      title: "Track Your Progress",
      description: "Monitor your body measurements with beautiful visualizations and track your transformation journey.",
      buttonText: "Go to Measurements",
      path: "/measurements"
    },
    {
      icon: <FitnessCenterIcon fontSize="large" />,
      title: "Your Workout Plan",
      description: "Customize and follow personalized workout routines tailored to your body type and goals.",
      buttonText: "Go to Workouts",
      path: "/workouts"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6, px: { xs: 2, sm: 3 } }}>
      
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography 
          variant="h3" 
          component="h1"
          sx={{ 
            fontWeight: 700,
            mb: 2,
            color: theme.palette.primary.main,
            [theme.breakpoints.down('sm')]: {
              fontSize: '2rem'
            }
          }}
        >
          Transform Your Body
        </Typography>
        <Typography 
          variant="h6" 
          component="h2"
          color="text.secondary"
          sx={{ maxWidth: 700, mx: 'auto' }}
        >
          Your personalized fitness journey starts here. Track, plan, and achieve your body goals.
        </Typography>
      </Box>

      {/* Pear-Shaped Body Card */}
      <Card sx={{ 
        borderRadius: 4,
        boxShadow: theme.shadows[4],
        overflow: 'hidden',
        mb: 6
      }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          alignItems="center"
          divider={
            <Divider 
              orientation="vertical" 
              flexItem 
              sx={{ display: { xs: 'none', md: 'block' } }} 
            />
          }
        >
          <Box sx={{ p: 4, flex: 1 }}>
            <FeatureIcon sx={{ mb: 3 }}>
              <SelfImprovementIcon fontSize="large" />
            </FeatureIcon>
            <Typography 
              variant="h5" 
              component="h3" 
              align="center" 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              About Pear-Shaped Bodies
            </Typography>
            <Typography 
              variant="body1" 
              align="center" 
              color="text.secondary"
              paragraph
            >
              Pear-shaped bodies typically have narrower shoulders and bust with wider hips and thighs.
              The goal is to create balance through targeted exercises.
            </Typography>
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 500
              }}
            >
              Remember: Every body is unique and beautiful. Focus on feeling confident and strong.
            </Typography>
          </Box>
          <Box sx={{ 
            p: 4, 
            flex: 1,
            backgroundColor: theme.palette.grey[50]
          }}>
            <Typography 
              variant="h6" 
              component="h4" 
              align="center" 
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Quick Tips
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2,
              '& li': { 
                mb: 1,
                color: theme.palette.text.secondary
              }
            }}>
              <li>Measure consistently at the same time each week</li>
              <li>Focus on full-body workouts for balanced development</li>
              <li>Celebrate small progress - it all adds up</li>
              <li>Stay hydrated and get enough rest</li>
              <li>Listen to your body and adjust as needed</li>
            </Box>
          </Box>
        </Stack>
      </Card>

      {/* Two Feature Cards - Side by Side */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Grid 
          container 
          spacing={4} 
          justifyContent="center" 
          alignItems="stretch"
        >
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} key={index}>
              <FeatureCard>
                <CardContent 
                  sx={{ 
                    p: 4, 
                    flexGrow: 1,
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between' 
                  }}
                >
                  <FeatureIcon>
                    {feature.icon}
                  </FeatureIcon>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    align="center" 
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    align="center" 
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    {feature.description}
                  </Typography>
                  <Box textAlign="center">
                    <Button
                      component={Link}
                      to={feature.path}
                      variant="contained"
                      size="large"
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        fontWeight: 600
                      }}
                    >
                      {feature.buttonText}
                    </Button>
                  </Box>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
