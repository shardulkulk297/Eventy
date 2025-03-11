import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useState } from 'react'
const RegisterData = () => {
  const navigate = useNavigate()
  const [registerData, setLoginData] = useState({ 
    College: '', 
    Age: '' })
  const handleClick = () => {
    // navigate('/posts')
  }
  return (
    <div>

      <main className='flex flex-col items-center justify-center h-screen'>

        <div>
          <h1 className='text-2xl font-bold'>Register Data</h1>
          <p className='text-sm text-gray-500'>Please fill in the form</p>
          <form onSubmit={handleClick} className="space-y-4">
            <div>
              <Label htmlFor="email">College</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Age</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={registerData.password}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              />
            </div>

            <Button onClick={handleClick} type="submit" className="w-full bg-blue-600 text-white">
              Submit
            </Button>
          </form>



        </div>


      </main>



     
    </div>

  )
}

export default RegisterData