import { useState } from 'react'
import {Routes, Route} from 'react-router-dom'
import Auth from './components/Auth'
import Posts from './components/Posts'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route index path='/' element={<Auth />} />
        <Route index path='/posts' element = {<Posts />} />
      </Routes>
    </>
  )
}

export default App
