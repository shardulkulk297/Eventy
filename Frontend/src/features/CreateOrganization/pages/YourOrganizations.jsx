import React from 'react'
import { useState, useEffect } from 'react'
import { app, database } from '@/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, where } from 'firebase/firestore';
import { query } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '@/shared/ui/button';
import { useNavigate } from 'react-router-dom';
const YourOrganizations = () => {
    const [organizations, setOrganizations] = useState([]);
    const [user, setUser] = useState(null);
    const auth = getAuth(app);
    const dbInstance = collection(database, "organizations");
    const navigate = useNavigate();
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

    const fetchOrganizations = async (uid) => {
        try {
            const q = query(collection(database, 'organizations'), where("creatorId", "==", uid));
            const querySnapshot = await getDocs(q);
            const orgList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrganizations(orgList);

        } catch (error) {
            console.log(error);
            toast.error("Error fetching organizations");
        }

    }

    const goToAdminDashboard = ()=>{
        navigate('/posts/adminDashboard')
    }


    return (

        <div className="max-w-7xl mx-auto p-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Organizations</h2>
            {organizations.length === 0 ? (
                <p className="text-gray-500">No organizations found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((org) => (
                        <div key={org.id} className="bg-white shadow-lg rounded-lg p-6">
                            <h3 className="font-bold text-lg">{org.organizationName}</h3>
                            <p className={`mt-2 text-sm font-semibold ${org.verificationStatus === 'verified' ? 'text-green-600' : 'text-yellow-500'
                                }`}>
                                {org.verificationStatus === 'verified' ? "✔ Verified" : "⏳ Pending Verification"}
                            </p>
                            <Button onClick={goToAdminDashboard} className="mt-4 w-full bg-slate-50 hover:bg-blue-700">
                                Manage
                            </Button>
                        </div>
                    ))}

                </div>
            )}

        </div>


    )
}

export default YourOrganizations