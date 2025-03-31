/* src/App.jsx */
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Auth from './features/auth/ui/pages/Auth';
import Posts from './pages/Posts';
import './App.css';
// --- FIX: Use Sonner Toaster (if you use it elsewhere) or remove react-hot-toast ---
// import { Toaster } from 'react-hot-toast'; // Keep if used, otherwise remove
import { Toaster } from "@/shared/ui/sonner"; // Use Sonner if that's your primary toaster
// --- END FIX ---
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

// --- Event/Form Related Imports ---
import EventDashboard from './features/CreateEvent/pages/EventDashboard'; // Import the new dashboard
import FormDashboard from './features/CreateEvent/pages/EventFormsDashboard'; // This might be repurposed or removed
import FormBuilder from './features/CreateEvent/pages/Builder';
import FormPreview from './features/CreateEvent/pages/Preview';
import FormResponses from './features/CreateEvent/pages/Responses';
import FormNotFound from './features/CreateEvent/pages/NotFound';
import ManageEventPage from './features/CreateEvent/pages/ManageEventPage'; // Placeholder for event management page
import EventFormsDashboard from './features/CreateEvent/pages/EventFormsDashboard'; // Placeholder for event-specific forms

// --- Context Provider Renaming (Step 3 anticipates this) ---
import { EventManagerProvider } from './features/CreateEvent/context/EventManagerContext'; // Renamed from FormProvider

function App() {
  const auth = getAuth(app);

  return (
     // Wrap with the renamed EventManagerProvider
    <EventManagerProvider>
      <Toaster position='top-center' richColors /> {/* Use Sonner Toaster */}
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
          <Route index element={<Posts />} /> {/* Default page */}
          <Route path='createorganization' element={<CreateOrganization />} />
          <Route path='hackathons' element={<Hackathons />} />
          <Route path='upcoming' element={<Upcoming />} />
          <Route path='settings' element={<SettingsPage />} />
          <Route path='yourOrg' element={<YourOrganizations />} />
          <Route path='adminDashboard' element={<AdminDashboard />} />

          {/* === NEW Event Dashboard Route === */}
          <Route path='events' element={<EventDashboard />} />

           {/* === Event Specific Routes (Placeholder Structure) === */}
           <Route path='events/:eventId/manage' element={<ManageEventPage />} /> {/* Placeholder */}
           <Route path='events/:eventId/forms' element={<EventFormsDashboard />} /> {/* Placeholder */}

          {/* === Form Builder/Preview/Responses (Now potentially linked from Event Dashboard/Management) === */}
          {/* These routes need eventId context now. One way is via URL params */}
          {/* Builder for a NEW form within an event */}
           <Route path='events/:eventId/forms/builder/new' element={<FormBuilder />} />
           {/* Builder for an EXISTING form within an event */}
          <Route path='events/:eventId/forms/builder/:formId' element={<FormBuilder />} />
          {/* Preview for a specific form within an event */}
           <Route path='events/:eventId/forms/preview/:formId' element={<FormPreview />} />
           {/* Responses for a specific form within an event */}
           <Route path='events/:eventId/forms/responses/:formId' element={<FormResponses />} />

           {/* --- REMOVED/Redirected Old Routes --- */}
           {/* <Route path='createevent' element={<Navigate to="/posts/events" replace />} /> Redirect old create link */}
           {/* <Route path='builder/:formId' element={<FormBuilder />} /> Old builder route */}
           {/* <Route path='forms' element={<FormDashboard />} /> Old general forms dashboard */}
           {/* <Route path='preview/:formId' element={<FormPreview />} /> Old preview route */}
           {/* <Route path='responses/:formId' element={<FormResponses />} /> Old responses route */}

        </Route> {/* End of /posts nesting */}

        {/* Catch-all 404 Route */}
        <Route path="*" element={<FormNotFound />} />
      </Routes>
    </EventManagerProvider>
  )
}

export default App;