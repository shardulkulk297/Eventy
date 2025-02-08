import { useState } from 'react'
import {Routes, Route} from 'react-router-dom'
import Auth from './components/ui/Auth'
import Register from './components/Register'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route index path='/auth' element={<Auth />} />
        <Route index path='/register' element = {<Register />} />
      </Routes>
    </>
  )
}

export default App
