import React from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useState } from 'react'
import {getAuth} from "firebase/auth";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'
import { app,database } from '@/firebaseConfig';
import { useEffect } from 'react'

const CreateOrganization = () => {
  const [user, setUser] = useState(null);

  const auth = getAuth(app);
  const dbInstance = collection(database, "organizations");

  useEffect(()=>{
    const getCurrentUser = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(currentUser);
      
    });
    return getCurrentUser;
  })

  const [orgData, setOrgData] = useState({
    organizationName: '',
    organizationDesc: '',
    photoURL: '',
    verificationFile: '',
    verificationStatus: '',
    verificationDocURL: '',
    creatorId: '',
    createdAt: '',
    updatedAt: '',  
  })
  
  const handleOrgSubmit = (e) => {
    e.preventDefault()
    console.log(orgData);
    createOrganization();
  }

  const createOrganization =  async() => {
    try {
      const docRef = await addDoc(dbInstance, {
        organizationName: orgData.organizationName,
        organizationDesc: orgData.organizationDesc,
        photoURL:'',
        verificationFile: '',
        verificationStatus: '',
        verificationDocURL: '',
        creatorId: user.uid,
        admin: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  return (
    <div>
      <div className="container flex items-center justify-center h-screen mx-auto">
        <form className='space-y-4' onSubmit={handleOrgSubmit}>
          <h1 className='text-2xl font-bold'>Create Organization</h1>
          <p className='text-sm text-gray-500'>Please fill in the form</p>
          <div>
            <Label>Organization Name</Label>
            <Input
              type="text"
              placeholder="Organization Name"
              value={orgData.organizationName}
              onChange={(e) => setOrgData({ ...orgData, organizationName: e.target.value })} />
          </div>
          <div>

            <Label>Organization Description</Label>
            <Input
              type="text"
              placeholder="Organization Description"
              value={orgData.organizationDesc}
              onChange={(e) => setOrgData({ ...orgData, organizationDesc: e.target.value })} />
          </div>
          <div>
            <Label>Upload Verification Letter</Label>
            <Input
              type="file"
              placeholder="File"
              value={orgData.verificationFile}
              onChange={(e) => setOrgData({ ...orgData, verificationFile: e.target.value })} />
          </div>
          <Button onSubmit={handleOrgSubmit} type="submit">Create Organization</Button>

        </form>
      </div>


    </div>
  )
}

export default CreateOrganization