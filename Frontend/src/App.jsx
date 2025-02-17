import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Auth from './components/Auth'
import Posts from './components/Posts'
import './App.css'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Toaster position='top-center' />
      <Routes>
        <Route path='/' element={<Auth />} />
        <Route path='posts' element = {<Layout />}>
          <Route index element={<Posts />} />

        </Route>
      </Routes>
    </>
  )
}

export default App
