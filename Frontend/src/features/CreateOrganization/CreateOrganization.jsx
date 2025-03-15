import React from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useState } from 'react'
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'
import { app, database } from '@/firebaseConfig';
import { useEffect } from 'react'
import toast from 'react-hot-toast'


const CreateOrganization = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const auth = getAuth(app);
  const dbInstance = collection(database, "organizations");

  useEffect(() => {
    const getCurrentUser = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(currentUser);

    });
    return()=> getCurrentUser;
  }, [auth])

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

  const handleOrgSubmit = async(e) => {
    e.preventDefault()
    // console.log(orgData);
    await createOrganization();
  }

  const createOrganization = async () => {
    try {

      const orgRef = query(dbInstance, where("organizationName", "==", orgData.organizationName));
      const orgName = await getDocs(orgRef);

      if (!orgName.empty) {
        setError("Organization name already exists");
        toast.error("Organization name already exists");
        return;

      }




      const docRef = await addDoc(dbInstance, {
        organizationName: orgData.organizationName,
        organizationDesc: orgData.organizationDesc,
        photoURL: '',
        verificationFile: '',
        verificationStatus: 'pending',
        verificationDocURL: '',
        creatorId: user.uid,
        admin: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("Document written with ID: ", docRef.id);
       toast.success("Organization Created Successfully");
    } catch (e) {
      toast.error(e.message || "An error occurred");
      console.error("Error adding document: ", e);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-3xl font-semibold text-center text-gray-800">Create Organization</h1>
        <p className="text-center text-gray-500 mb-4">Fill in the form to register</p>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <form className="space-y-4" onSubmit={handleOrgSubmit}>
          <div>
            <Label>Organization Name</Label>
            <Input
              type="text"
              placeholder="Enter organization name"
              value={orgData.organizationName}
              onChange={(e) => setOrgData({ ...orgData, organizationName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Organization Description</Label>
            <textarea
              className="w-full border rounded-md p-2 h-24"
              placeholder="Describe your organization"
              value={orgData.organizationDesc}
              onChange={(e) => setOrgData({ ...orgData, organizationDesc: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Upload Verification Letter</Label>
            <Input
              type="file"
              onChange={(e) => setOrgData({ ...orgData, verificationFile: e.target.files[0] })}
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Create Organization
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CreateOrganization