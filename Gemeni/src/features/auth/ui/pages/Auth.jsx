import React from 'react'
import { LoginForm } from '../components/LoginForm'
import {getAuth, onAuthStateChanged} from "firebase/auth";
import { useEffect } from 'react';
import {app, database} from "../../../../firebaseConfig";
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const auth = getAuth(app);
  const navigate = useNavigate();
  useEffect(()=>{

    const unsubscribe =  onAuthStateChanged(auth, (user)=>{
      if(user){
        navigate("/posts", {replace: true});
      }
      
    })

    return ()=> unsubscribe();
   
  }, [auth, navigate])
  return (
    <div>
      
      <LoginForm/>
    </div>
  )
}

export default Auth
