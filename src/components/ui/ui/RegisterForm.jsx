import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { Link } from "react-router-dom";

export function RegisterForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
  };

  return (
    <div className="flex h-screen w-screen">

<div
        className="w-1/2 h-full bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1527891751199-7225231a68dd")',
        }}
      ></div>
      <div className="w-1/2 flex justify-center items-center bg-gray-50">
        <div className="max-w-sm w-full mx-auto p-6 bg-white shadow-lg rounded-lg ">
          <h1 className="text-4xl text-center font-bold p-1" >Welcome to Eventy</h1>
          
          <h2 className="text-2xl font-semibold text-center mb-4 mt-4">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <p>Don't have an account? <Link to="/register" className="font-bold"> Register Here</Link></p>
            <Button type="submit" className="w-full bg-blue-600 text-white">
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
