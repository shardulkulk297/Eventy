
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'; // Import Navigate component
import Auth from './features/auth/ui/pages/Auth';
import Posts from './pages/Posts';
import './App.css';
import { Toaster } from 'react-hot-toast';
import Layout from './shared/components/Layout';
import Hackathons from './pages/Hackathons';
import Upcoming from './pages/Upcoming';
import SettingsPage from './pages/Settings';
import Host from './pages/Host';
import RegisterData from './features/auth/ui/pages/RegisterData';
import CreateOrganization from './features/CreateOrganization/CreateOrganization';
import ProtectedRoute from './shared/components/ProtectedRoute';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebaseConfig";
import YourOrganizations from './features/CreateOrganization/pages/YourOrganizations';
import AdminDashboard from './features/CreateOrganization/pages/AdminDashboard';
import FormDashboard from './features/CreateEvent/pages/Dashboard';
import FormBuilder from './features/CreateEvent/pages/Builder'; // Use pages/Builder
import FormPreview from './features/CreateEvent/pages/Preview';
import FormResponses from './features/CreateEvent/pages/Responses';
import FormNotFound from './features/CreateEvent/pages/NotFound';


function App() {
  const auth = getAuth(app);
  // Use navigateHook or just navigate directly if needed globally
  // const navigateHook = useNavigate();

  // Optional: Add state management for the user if needed globally
  // const [currentUser, setCurrentUser] = useState(null);
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setCurrentUser(user);
  //   });
  //   return () => unsubscribe();
  // }, [auth]);

  return (
    <>
      <Toaster position='top-center' />
      <Routes>
        {/* Public Routes */}
        <Route path='/' element={<Auth />} />

        {/* Protected Routes */}
        <Route path='/registerData' element={
          <ProtectedRoute>
            <RegisterData />
          </ProtectedRoute>
        } />

        {/* Main Protected Layout Route */}
        <Route path='posts' element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Nested Routes under /posts */}
          <Route index element={<Posts />} />
          <Route path='createorganization' element={<CreateOrganization />} />
          <Route path='hackathons' element={<Hackathons />} />
          <Route path='upcoming' element={<Upcoming />} />
          <Route path='settings' element={<SettingsPage />} />
          <Route path='yourOrg' element={<YourOrganizations />} />
          <Route path='adminDashboard' element={<AdminDashboard />} />

          {/* === Event/Form Related Routes === */}
          {/* Redirect /posts/createevent to the new form builder */}
          <Route path='createevent' element={<Navigate to="/posts/builder/new" replace />} />

          {/* Form Builder (handles '/new' and '/:formId') */}
          <Route path='builder/:formId' element={<FormBuilder />} />

          {/* Form Dashboard */}
          <Route path='forms' element={<FormDashboard />} />

          {/* Form Preview */}
          <Route path='preview/:formId' element={<FormPreview />} />

          {/* Form Responses */}
          <Route path='responses/:formId' element={<FormResponses />} />

        </Route> {/* End of /posts nesting */}

        {/* Catch-all 404 Route */}
        <Route path="*" element={<FormNotFound />} />

      </Routes>
    </>
  )
}

export default App;