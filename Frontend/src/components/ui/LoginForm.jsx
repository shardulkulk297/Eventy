import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "./select";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


export function LoginForm() {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    displayName: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",

  })
  const [activeTab, setActiveTab] = useState("login")

  const navigate = useNavigate();

  const registerUser = async (e) => {

    e.preventDefault();

    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        displayName: registerData.displayName,
        username: registerData.username,
        password: registerData.password,
        role: registerData.role
      })
      
    })

    const data = await response.json();
    console.log(data);

    if(data.status === 'ok'){
      toast.success('Registration Successful');
      goToPosts();
    }

    else{
      if (data.error && Array.isArray(data.error)) {
        data.error.forEach(errorMessage => toast.error(errorMessage));
      } else {
        toast.error('Check for existing credentials or try again later');
      }
    }
    
  }

  const loginUser = async(e)=>{
    e.preventDefault();

    const response = await fetch(`http://localhost:5000/api/login`, {
      method: 'POST',

      headers: {
        'Content-type': 'application/json',
      },

      body: JSON.stringify({
        email: loginData.email,
        password: loginData.password
      })


    })

    const data = response.json();
    console.log(data);


    if(data.user)
    {
      localStorage.setItem('token', data.user);
      toast.success('Login Successful');
      goToPosts();
      
    }
    else{
      if(data.error && Array.isArray(data.error)){
        data.error.forEach(errorMessage => toast.error(errorMessage))
      }
      else{
        toast.error('Invalid Credentials, Please try again');
      }
    }


  }

  const goToPosts = ()=>{
    navigate('/posts');
  }

  const handleChange = (e, setData) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }))
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", loginData);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();

  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen">

      <div
        className="hidden lg:block lg:w-1/2 h-1/3 lg:h-full bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1527891751199-7225231a68dd")',
        }}
      ></div>
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-gray-50 p-4 sm:p-6">
        <div className="w-full max-w-sm mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">

          <h1 className="text-2xl sm:text-4xl text-center font-bold p-1" >Welcome to Eventy</h1>
          <p className="text-center text-gray-700 text-sm sm:text-base mb-4 mt-2">
            <i>Connect, Engage & Explore</i>
          </p>

          <div className="flex justify-center mb-6">

            <button onClick={() => {
              handleTabSwitch("login");

            }}
              className={`px-4 py-2 mr-1 rounded-xl ${activeTab == "login" ? "bg-blue-500 text-white"
                : " bg-gray-100 text-gray-700"
                }rounded-l-lg `}
            >
              Login
            </button>

            <button onClick={() => {
              handleTabSwitch("register")
            }} className={`px-4 py-2 rounded-xl ${activeTab == "register" ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700"
              }rounded-r-lg`}>
              Register
            </button>

          </div>

          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => handleChange(e, setLoginData)}
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
                  value={loginData.password}
                  onChange={(e) => handleChange(e, setLoginData)}
                  required
                />
              </div>

              <Button onClick={loginUser} type="submit" className="w-full bg-blue-600 text-white">
                Login
              </Button>
            </form>


          )}
          {activeTab === "register" && (

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>

                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={registerData.displayName}
                  onChange={(e) => handleChange(e, setRegisterData)}
                  required
                />
              </div>

              <div>

                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e) => handleChange(e, setRegisterData)}
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
                  value={registerData.password}
                  onChange={(e) => handleChange(e, setRegisterData)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) => handleChange(e, setRegisterData)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  name="role"
                  value={registerData.role}
                  onValueChange={(value) => setRegisterData((prev) => ({ ...prev, role: value }))}
                  className="relative w-full"


                >
                  <SelectTrigger className="w-full border-gray-300 rounded-lg mb-4">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="absolute z-50 w-full bg-white shadow-lg rounded-lg">
                    <SelectGroup>
                      <SelectLabel>Role</SelectLabel>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Organization">Organization</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={registerUser} type="submit" className="w-full bg-blue-600 text-white">
                Register
              </Button>
            </form>


          )}



        </div>
      </div>
    </div>
  );
}
