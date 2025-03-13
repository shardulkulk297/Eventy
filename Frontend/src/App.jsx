import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Auth from './features/auth/ui/pages/Auth'
import Posts from './pages/Posts'
import './App.css'
import { Toaster } from 'react-hot-toast'
import Layout from './shared/components/Layout'
import { ThemeProvider } from './shared/themes/ThemeProvider'
import Hackathons from './pages/Hackathons'
import Upcoming from './pages/Upcoming'
import { Settings } from 'lucide-react'
import Host from './pages/Host'
import RegisterData from './features/auth/ui/pages/RegisterData'
import CreateEvent from './features/CreateEvent/CreateEvent'
import CreateOrganization from './features/CreateOrganization/CreateOrganization'

function App() {
  

  return (
    <>
      <Toaster position='top-center' />
      <Routes>
        <Route path='/' element={<Auth />} />
        <Route path = '/registerData' element={<RegisterData />} />

        <Route path='posts' element={<Layout />}>
          <Route index element={<Posts />} />
          <Route path='createevent' element={<CreateEvent/>} />
          <Route path = 'createorganization' element={<CreateOrganization/>} />
          <Route path='hackathons' element={<Hackathons />} />
          <Route path='upcoming' element={<Upcoming />} />
          <Route path='settings' element={<Settings />} />  
          <Route path='host' element={<Host />} />  

        </Route>

      </Routes>
    </>
  )
}

export default App
