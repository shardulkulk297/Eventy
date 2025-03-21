import React, { useRef } from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useState } from 'react';
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'
import { app, database, storage } from '@/firebaseConfig';
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { ref } from 'firebase/storage'
import { uploadBytesResumable } from 'firebase/storage'
import { getDownloadURL } from 'firebase/storage'


const CreateOrganization = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
 

  const auth = getAuth(app);
  const dbInstance = collection(database, "organizations");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchOrganizations(currentUser.uid);
      }
      // console.log(currentUser.uid);

    });
    return () => unsubscribe();
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
 
  // useEffect(() => {
  //   if (!user) {
  //     return;
  //   }

   

  //   const checkVerificationStatus = async () => {
  //     try {
  //       const orgQuery = query(collection(database, "organizations"), where("creatorId", "==", user.uid));
  //       const querySnapshot = await getDocs(orgQuery);
  
  //       if (!querySnapshot.empty) {
  //         querySnapshot.forEach(async (docSnap) => {
  //           const orgData = docSnap.data();
  //           setOrgData(orgData);
  //           console.log(orgData);
  
  //           if (orgData.verificationStatus === 'verified') {
  //             toast.success('Organization is Verified');
  //             clearInterval(intervalId);
  //             setTimeout(() => {
  //               window.location.reload();
  //             }, 100);
              
  //           }

  //         })
  //       }

  //     } catch (error) {
  //       console.log(error);

  //     }

    

  //     // 2*60*60*1000
  //   }

  //   let intervalId= setInterval(checkVerificationStatus(), 10*1000);
  //   return () => clearInterval(intervalId);

  // }, [user]);



 

  const handleOrgSubmit = async (e) => {
    e.preventDefault()
    // console.log(orgData);
    await createOrganization();
  }
  const updateUserDocument = async (newData) => {
    if (!auth.currentUser) {
      console.log("No authenticated user found.");
      return;
    }

    const userAuthId = auth.currentUser.uid; // Get the current user's UID

    try {
      const q = query(collection(database, "users"), where("uid", "==", userAuthId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (document) => {
          const userDocRef = doc(database, "users", document.id); // Get document reference
          await updateDoc(userDocRef, newData);
          console.log("User document updated successfully!");
        });
      } else {
        console.log("No Firestore document found for this UID.");
      }
    } catch (error) {
      console.error("Error updating user document:", error);
    }
  };


  const createOrganization = async () => {
    try {

      const orgRef = query(dbInstance, where("organizationName", "==", orgData.organizationName));
      const orgName = await getDocs(orgRef);

      if (!orgName.empty) {
        setError("Organization name already exists");
        toast.error("Organization name already exists");
        return;

      }
      let orgImageURL = "https://api.dicebear.com/7.x/avatars/svg";
      let VerificationDocURL = "https://api.dicebear.com/7.x/avatars/svg";

      if (orgData.photoURL) {
        const storageRef = ref(storage, `organizations/${orgData.organizationName}/logo/${orgData.photoURL.name}`);
        const uploadTaskSnapshot = await uploadBytesResumable(storageRef, orgData.verificationFile);
        orgImageURL = await getDownloadURL(uploadTaskSnapshot.ref);
        console.log("File uploaded successfully", orgImageURL);
      }
      if (orgData.verificationFile) {
        const storageRef = ref(storage, `organizations/${orgData.organizationName}/verificationDoc/${orgData.verificationFile.name}`);
        const uploadTaskSnapshot = await uploadBytesResumable(storageRef, orgData.verificationFile);
        VerificationDocURL = await getDownloadURL(uploadTaskSnapshot.ref);
        console.log("File uploaded successfully", VerificationDocURL);
      }


      const docRef = await addDoc(dbInstance, {
        organizationName: orgData.organizationName,
        organizationDesc: orgData.organizationDesc,
        photoURL: orgImageURL,
        verificationStatus: 'pending',
        verificationDocURL: VerificationDocURL,
        creatorId: user.uid,
        admin: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateUserDocument({ createdOrganizations: arrayUnion(orgData.organizationName), updatedAt: serverTimestamp() });

      toast.success("Organization Created Successfully");

      // if(orgData.verificationFile){
      //   await UpdateDoc(doc(database, "organizations", docRef.id), {
      //     verificationStatus: 'verified',
      //     updatedAt: serverTimestamp(),
      //   })
      // }
      // else{
      //   await UpdateDoc(doc(database, "organizations", docRef.id), {
      //     verificationStatus: 'pending',
      //     updatedAt: serverTimestamp(),
      // })
      // }

      console.log("Document written with ID: ", docRef.id);
      console.log("Updated user document");
      window.location.reload();



    } catch (e) {
      toast.error(e.message || "An error occurred");
      console.error("Error adding document: ", e);
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-10 p-4">
     


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
            <Label>Upload Organization Logo</Label>
            <Input
              type="file"
              onChange={(e) => setOrgData({ ...orgData, photoURL: e.target.files[0] })}
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
            Create  Organization
          </Button>
        </form>
      </div>
    </div>
  )
}

export default CreateOrganization