/* Eventy/Frontend/src/features/CreateOrganization/CreateOrganization.jsx */
import React, { useRef, useState, useEffect } from 'react'; // Added useEffect, useState, useRef
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'; // Removed unused getDoc
import { app, database, storage } from '@/firebaseConfig';
import toast from 'react-hot-toast';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Corrected imports

const CreateOrganization = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // Added loading state

  const auth = getAuth(app);
  const dbInstance = collection(database, "organizations");
  // --- REMOVED: fetchOrganizations call from useEffect as it wasn't defined ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]); // --- FIX: Added dependency array ---

  const [orgData, setOrgData] = useState({
    organizationName: '',
    organizationDesc: '',
    logoFile: null, // Renamed photoURL to logoFile for clarity
    verificationFile: null, // Corrected initialization
    // Removed fields that will be set during creation/upload
  });

  // --- REMOVED: Commented-out useEffect for checking verification ---
  // Needs proper implementation if verification checking is required.
  // Ensure 'user' is checked inside checkVerificationStatus.
  // Fix setInterval usage: setInterval(checkVerificationStatus, 10 * 1000);

  const handleOrgChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setOrgData({ ...orgData, [name]: files[0] });
    } else {
      setOrgData({ ...orgData, [name]: value });
    }
  };

  const handleOrgSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    if (!user) {
      toast.error("You must be logged in to create an organization.");
      setError("User not authenticated.");
      return;
    }
    if (!orgData.organizationName.trim()) {
       toast.error("Organization name cannot be empty.");
       setError("Organization name is required.");
       return;
    }
    setLoading(true); // Set loading state
    await createOrganization();
    setLoading(false); // Reset loading state
  };

  const updateUserDocument = async (organizationName) => { // Pass org name instead of newData
    if (!auth.currentUser) {
      console.error("No authenticated user found for updating user document.");
      return;
    }
    const userAuthId = auth.currentUser.uid;

    try {
      const q = query(collection(database, "users"), where("uid", "==", userAuthId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = doc(database, "users", querySnapshot.docs[0].id);
        // --- FIX: Update user document with the organization name ---
        await updateDoc(userDocRef, {
          createdOrganizations: arrayUnion(organizationName), // Add new org name
          updatedAt: serverTimestamp()
        });
        // --- END FIX ---
        console.log("User document updated successfully with new organization!");
      } else {
        console.warn("No Firestore user document found for UID:", userAuthId);
      }
    } catch (error) {
      console.error("Error updating user document:", error);
      toast.error("Failed to link organization to your profile.");
    }
  };

  const uploadFile = async (file, path) => {
    if (!file) return null;
    const storageRef = ref(storage, path);
    const uploadTaskSnapshot = await uploadBytesResumable(storageRef, file);
    return await getDownloadURL(uploadTaskSnapshot.ref);
  };

  const createOrganization = async () => {
    try {
      // Check if organization name already exists
      const orgQuery = query(dbInstance, where("organizationName", "==", orgData.organizationName.trim()));
      const orgSnapshot = await getDocs(orgQuery);
      if (!orgSnapshot.empty) {
        setError("Organization name already exists. Please choose a different name.");
        toast.error("Organization name already exists.");
        return;
      }

      // --- FIX: Correct file upload logic ---
      const logoURL = await uploadFile(
        orgData.logoFile,
        `organizations/${orgData.organizationName.trim()}/logo/${orgData.logoFile?.name || Date.now()}`
      ) || "https://api.dicebear.com/7.x/initials/svg?seed=" + orgData.organizationName.trim(); // Default logo

      const verificationDocURL = await uploadFile(
        orgData.verificationFile,
        `organizations/${orgData.organizationName.trim()}/verificationDoc/${orgData.verificationFile?.name || Date.now()}`
      );
      // --- END FIX ---

      const docRef = await addDoc(dbInstance, {
        organizationName: orgData.organizationName.trim(),
        organizationDesc: orgData.organizationDesc.trim(),
        photoURL: logoURL,
        verificationStatus: verificationDocURL ? 'pending' : 'unverified', // Status depends on verification file
        verificationDocURL: verificationDocURL || null,
        creatorId: user.uid,
        admins: [user.email], // Store admin emails in an array
        members: [user.uid], // Add creator as the first member
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update the user document after successful organization creation
      await updateUserDocument(orgData.organizationName.trim());

      toast.success("Organization Created Successfully");
      console.log("Organization document written with ID: ", docRef.id);

      // Optionally clear form or navigate
       setOrgData({ // Clear form
         organizationName: '',
         organizationDesc: '',
         logoFile: null,
         verificationFile: null,
       });
      // navigate('/posts/yourOrg'); // Navigate to organizations list

    } catch (e) {
      setError(e.message || "Failed to create organization.");
      toast.error(e.message || "An error occurred during organization creation.");
      console.error("Error adding organization document: ", e);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-center text-gray-800 dark:text-white">Create Organization</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Fill in the form to register your organization.</p>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        <form className="space-y-5" onSubmit={handleOrgSubmit}>
          <div>
            <Label htmlFor="organizationName" className="dark:text-gray-300">Organization Name <span className="text-red-500">*</span></Label>
            <Input
              id="organizationName"
              name="organizationName" // Ensure name matches state key
              type="text"
              placeholder="Enter organization name"
              value={orgData.organizationName}
              onChange={handleOrgChange} // Use generic handler
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="organizationDesc" className="dark:text-gray-300">Organization Description <span className="text-red-500">*</span></Label>
            <textarea
              id="organizationDesc" // Add id for label association
              name="organizationDesc" // Ensure name matches state key
              className="w-full border dark:border-gray-600 rounded-md p-2 h-24 dark:bg-gray-700 dark:text-white"
              placeholder="Describe your organization"
              value={orgData.organizationDesc}
              onChange={handleOrgChange} // Use generic handler
              required
            />
          </div>
          <div>
            <Label htmlFor="logoFile" className="dark:text-gray-300">Upload Organization Logo</Label>
            <Input
              id="logoFile"
              name="logoFile" // Ensure name matches state key
              type="file"
              accept="image/*" // Accept only image files
              onChange={handleOrgChange} // Use generic handler
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white file:text-gray-400"
            />
            {/* Optional: Preview uploaded logo */}
            {orgData.logoFile && (
              <img
                src={URL.createObjectURL(orgData.logoFile)}
                alt="Logo preview"
                className="mt-2 h-16 w-16 object-cover rounded"
              />
            )}
          </div>
          <div>
            <Label htmlFor="verificationFile" className="dark:text-gray-300">Upload Verification Letter (PDF)</Label>
            <Input
              id="verificationFile"
              name="verificationFile" // Ensure name matches state key
              type="file"
              accept=".pdf" // Accept only PDF files
              onChange={handleOrgChange} // Use generic handler
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white file:text-gray-400"
            />
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optional. Uploading a verification letter (e.g., from your institution) helps confirm your organization's legitimacy.</p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600" disabled={loading}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganization;