import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../../../../shared/ui/input';
import { Label } from '../../../../shared/ui/label';
import { Select } from '../../../../shared/ui/select';
import { Button } from '../../../../shared/ui/button';
import { Datepicker } from 'flowbite-datepicker';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { database } from '@/firebaseConfig';
import toast from 'react-hot-toast';
import MultiSelect from '../../../../shared/ui/MultiSelect';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = location.state;
  const dbInstance = collection(database, "users");

  const [registerData, setLoginData] = useState({
    age: '',
    dateOfBirth: '',
    collegeUniversity: '',
    designation: '',
    type: "Student",
    userInterests: [],
  });
  const [selectedInterests, setSelectedInterests] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(registerData);
    registerUser();
  };

  const handleChange = (e) => {
    setLoginData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setLoginData((prev) => ({ ...prev, dateOfBirth: selectedDate }));
  };

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
        updatedAt: new Date(),
      });
      toast.success("Data Registered Successfully");
      navigate('/posts');
    } catch (error) {
      toast.error(error.message || "An error occurred");
      console.log(error);
    }
  };

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
        
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                placeholder="Enter your Age"
                value={registerData.age}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor='Interests'>Select Your Interests</Label>
              <MultiSelect
                className=""
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
              <Input type="date" 
               id="dateOfBirth"
               name="dateOfBirth"
               placeholder="Enter your Date of Birth"
               value={registerData.dateOfBirth}
               onChange={handleDateChange}
               required
              />
            </div>

            <div>
              <Label htmlFor="collegeUniversity">College/University</Label>
              <Input
                id="collegeUniversity"
                name="collegeUniversity"
                type="text"
                placeholder="Enter your College/University"
                value={registerData.collegeUniversity}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                type="text"
                placeholder="Enter your Designation"
                value={registerData.designation}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={registerData.type}
                onChange={handleChange}
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
  );
};

export default RegisterData;
