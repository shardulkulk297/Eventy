import { useState } from 'react'
import {Routes, Route} from 'react-router-dom'
import Auth from './components/ui/Auth'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route index path='/auth' element={<Auth />} />
      </Routes>
    </>
  )
}

export default App
