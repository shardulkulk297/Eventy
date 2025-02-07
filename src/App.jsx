import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from './components/ui/button'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1 className='text-2xl text-red-800'>Pokemon</h1>
      <Button>Hello</Button>
    </>
  )
}

export default App
