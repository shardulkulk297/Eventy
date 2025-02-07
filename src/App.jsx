import { useState } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './App.css'
import Auth from './components/auth';
function App() { 
  

  return (
    <>
      <Routes>
        <Route index path='auth' element={<Auth/>} />
      </Routes>
      
    </>
  )
}

export default App
