import { useContext } from 'react';
import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

export default function AdminRoute() {
  const { user, loading } = useContext(AuthContext);
  
  // We grab the context from the PARENT route (MainLayout)
  const context = useOutletContext(); 

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If user is admin, render the child route (Outlet)
  // We pass the context (darkMode, etc.) down to the child
  if (user && user.role === 'admin') {
    return <Outlet context={context} />; 
  }

  // Otherwise, kick them out
  return <Navigate to="/home" replace />;
}