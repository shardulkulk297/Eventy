import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Auth from './features/auth/ui/pages/Auth'
import Posts from './pages/Posts'
import './App.css'
import { Toaster } from 'react-hot-toast'
import Layout from './shared/components/Layout'
import Hackathons from './pages/Hackathons'
import Upcoming from './pages/Upcoming'
import { Settings } from 'lucide-react'
import Host from './pages/Host'
import RegisterData from './features/auth/ui/pages/RegisterData'
import CreateEvent from './features/CreateEvent/CreateEvent'
import CreateOrganization from './features/CreateOrganization/CreateOrganization'
import ProtectedRoute from './shared/components/ProtectedRoute'
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, database } from "./firebaseConfig";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import YourOrganizations from './features/CreateOrganization/pages/YourOrganizations'
import AdminDashboard from './features/CreateOrganization/pages/AdminDashboard'
import Dashboard from './features/CreateEvent/pages/Dashboard'
import Builder from './features/CreateEvent/pages/Builder'
import Preview from './features/CreateEvent/pages/Preview'
import Responses from './features/CreateEvent/pages/Responses'
import NotFound from './features/CreateEvent/pages/NotFound'


function App() {

  const auth = getAuth(app);

  return (
    <>
    
      <Toaster position='top-center' />
      <Routes>
        <Route path='/' element={<Auth />} /> //public
        <Route path='/registerData' element={
          <ProtectedRoute>
            <RegisterData />
          </ProtectedRoute>
        } />
        <Route path='posts' element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Posts />} />
          <Route path='createorganization' element={<CreateOrganization />} />
          <Route path='hackathons' element={<Hackathons />} />
          <Route path='upcoming' element={<Upcoming />} />
          <Route path='settings' element={<Settings />} />
          <Route path='yourOrg' element={<YourOrganizations />} />
          <Route path='adminDashboard' element={<AdminDashboard />} />
          <Route path='createevent' element={<CreateEvent />} />


        </Route>

      

        
        
  
         


       


      </Routes>
    </>
  )
}

export default App
