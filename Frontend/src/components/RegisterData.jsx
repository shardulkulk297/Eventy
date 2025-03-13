import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Button } from './ui/button'
import { useState } from 'react'
import { DatePicker } from './ui/DatePicker'
import { useLocation } from 'react-router-dom'
import { collection, doc } from 'firebase/firestore'
import { database } from '@/firebaseConfig'
import { updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import MultiSelect  from './ui/MultiSelect'
import {
  Cat,
  Guitar,
  Music,
  Play,
  Code,
  Book,
  Camera,
  Coffee,
  Gamepad,
  Activity,
  Leaf,
  Film,
  Edit,
  Moon,
  Briefcase,
  Heart,
  Wrench,
  PenTool,
  Car,
} from "lucide-react";

const RegisterData = () => {
  const navigate = useNavigate()
  const location = useLocation()
  // const { id } = location.state;
  const dbInstance = collection(database, "users");

  const [registerData, setLoginData] = useState({
    age: '',
    dateOfBirth: '',
    collegeUniversity: '',
    designation: '',
    type: "Student",
    userInterests: [],
  })
  const [selectedInterests, setSelectedInterests] = useState([]);
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(registerData);
    
  }
  const handleChange = (e, set) => {
    set({
      ...registerData,
      [e.target.name]: e.target.value
    })
  }
  const handleDateChange = (date)=>{
    setLoginData((prev) => ({ ...prev, dateOfBirth: date }));
  }

  const handleInterestsChange = (values) => {
    setSelectedInterests(values);
    setLoginData((prev) => ({ ...prev, userInterests: values }));
  };

  const registerUser = async () => {

    try {
      const userRef = doc(database, "users", id);

      await updateDoc(userRef, {
        age: registerData.age,
        dateOfBirth: registerData.dateOfBirth,
        collegeUniversity: registerData.collegeUniversity,
        designation: registerData.designation,
        type: registerData.type,
        userInterests: registerData.userInterests,
        updatedAt: new Date()

      })
      toast.success("Data Registered Successfully");
      navigate('/posts')

    } catch (error) {
      toast.error(error);
      console.log(error);

    }

  }

  const InterestsList = [
    { value: "Art", label: "Art", icon: Cat },
    { value: "Music", label: "Music", icon: Guitar },
    { value: "Dance", label: "Dance", icon: Music },
    { value: "Sports", label: "Sports", icon: Play },
    { value: "Coding", label: "Coding", icon: Code },
    { value: "Reading", label: "Reading", icon: Book },
    { value: "Travel", label: "Travel", icon: Car },
    { value: "Photography", label: "Photography", icon: Camera },
    { value: "Cooking", label: "Cooking", icon: Coffee },
    { value: "Gaming", label: "Gaming", icon: Gamepad },
    { value: "Fitness", label: "Fitness", icon: Activity },
    { value: "Nature", label: "Nature", icon: Leaf },
    { value: "Movies", label: "Movies", icon: Film },
    { value: "Writing", label: "Writing", icon: Edit },
    { value: "Meditation", label: "Meditation", icon: Moon },
    { value: "Entrepreneurship", label: "Entrepreneurship", icon: Briefcase },
    { value: "Volunteer", label: "Volunteer", icon: Heart },
    { value: "DIY", label: "DIY", icon: Wrench },
    { value: "Blogging", label: "Blogging", icon: PenTool },
  ];
  return (
    <div>

      <main className='flex flex-col items-center justify-center h-screen'>

        <div>
          <h1 className='text-2xl font-bold'>Register Data</h1>
          <p className='text-sm text-gray-500'>Please fill in the form</p>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <Label htmlFor="Age">Age</Label>
              <Input
                id="age"
                name="age"
                type="age"
                placeholder="Enter your Age"
                value={registerData.age}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              />

            </div>

            <div>
              <Label htmlFor='Interests'>Select Your Interests</Label>
              <MultiSelect className=""
                options={InterestsList}
                onValueChange={handleInterestsChange}
                defaultValue={selectedInterests}
                placeholder="Select Interests"
                variant="inverted"
                animation={2}
                required
              />
             
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker className=""
                id="dateOfBirth"
                name="dateOfBirth"
                type="dateOfBirth"
                placeholder="Enter your Date of Birth"
                value={registerData.dateOfBirth}
                onChange={(date) => setLoginData((prev) => ({ ...prev, dateOfBirth: date }))}
                required
              />
            </div>


            <div>
              <Label htmlFor="collegeUniversity">College/University</Label>
              <Input
                id="collegeUniversity"
                name="collegeUniversity"
                type="collegeUniversity"
                placeholder="Enter your College/University"
                value={registerData.collegeUniversity}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              />
            </div>

            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                type="designation"
                placeholder="Enter your Designation"
                value={registerData.designation}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={registerData.type}
                onChange={(e) => handleChange(e, setLoginData)}
                required
              >
                <option value="Student">Student</option>
                <option value="Professional">Professional</option>
              </select>
            </div>




            <Button onClick={handleSubmit} type="submit" className="w-full bg-blue-600 text-white">
              Register
            </Button>
          </form>



        </div>


      </main>




    </div>

  )
}

export default RegisterData