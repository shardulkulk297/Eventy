import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Auth from './components/Auth'
import Posts from './components/Posts'
import './App.css'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import CreateNewPost from './components/CreateNewPost'
import Hackathons from './components/Hackathons'
import Upcoming from './components/Upcoming'
import { Settings } from 'lucide-react'
import Host from './components/Host'
import RegisterData from './components/RegisterData'

function App() {
  

  return (
    <>
      <Toaster position='top-center' />
      <Routes>
        <Route path='/' element={<Auth />} />
        <Route path = '/registerData' element={<RegisterData />} />

        <Route path='posts' element={<Layout />}>
          <Route index element={<Posts />} />
          <Route path='createnewpost' element={<CreateNewPost />} />
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
