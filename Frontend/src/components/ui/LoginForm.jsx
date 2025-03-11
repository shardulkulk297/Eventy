import { useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Label } from "./label";
// import { Link } from "react-router-dom";
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
import {app, database} from "../../firebaseConfig";
import { collection } from "firebase/firestore";
import {getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile} from "firebase/auth";
import { addDoc } from "firebase/firestore";
import { Avatar } from "@radix-ui/react-avatar";
import {getStorage, ref, uploadBytes, getDownloadURL} from "firebase/storage";






export function LoginForm() {

  const auth = getAuth(app);
  const dbInstance = collection(database, "users");


  
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    imageFile: "",

  })
  const [activeTab, setActiveTab] = useState("login")

  const navigate = useNavigate();

 

  const loginUser = ()=>{
    signInWithEmailAndPassword(auth, loginData.email, loginData.password)
    .then((response)=>{
      toast.success("Login Successful");
      console.log(response);
      goToPosts();
    })
    .catch((err)=>{
      console.log(err);
      toast.error(err.message);
    })
  }

  const registerUser = async()=>{

    if(registerData.password !== registerData.confirmPassword){
      toast.error("Passwords do not match"); 
      return;
    }

    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        registerData.email, 
        registerData.password
      )

      const user = response.user;

      let imageURL = "https://api.dicebear.com/7.x/avatars/svg";

      // if(registerData.imageFile){
      //to be done when firebase storage is setup
      // }

      await updateProfile(user, {
        displayName: registerData.displayName,
        photoURL: imageURL
      })

      await addDoc(dbInstance, {
        uid: user.uid,
        displayName: registerData.displayName,
        email: registerData.email,
        photoURL: imageURL
      })

      toast.success("Registration Successful");
      goToRegisterData();
      
    } catch (error) {
      console.log(error)
      
    }

   
  }


  const goToRegisterData = ()=>{
    navigate('/registerData');
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
                <Label htmlFor="imageFile">Upload Profile pic</Label>
                <Input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  placeholder="imageFile"
                  value={registerData.imageFile}
                  onChange={(e) => handleChange(e, setRegisterData)}
                  required
                />
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
