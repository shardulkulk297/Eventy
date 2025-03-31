/* src/features/CreateEvent/CreateEvent.jsx */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Dashboard from './pages/Dashboard'; // No longer needed here

const CreateEvent = () => {
  const navigate = useNavigate();

  // Redirect to the new event dashboard immediately
  useEffect(() => {
    navigate('/posts/events', { replace: true });
  }, [navigate]);

  // Return null or a loading indicator while redirecting
  return null;
  // Or return <div className="p-8 text-center">Redirecting to Event Dashboard...</div>;
};

export default CreateEvent;