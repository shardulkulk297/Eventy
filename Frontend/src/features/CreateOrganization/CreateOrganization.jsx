import React from 'react'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { useState } from 'react'

const CreateOrganization = () => {
  const [orgData, setOrgData] = useState({
    organizationName: '',
    organizationDesc: '',
    photoURL: '',
    verificationStatus: '',
    verificationDocURL: '',
    creatorId: '',
    createdAt: '',
    updatedAt: '',

  })

  const handleOrgSubmit = (e) => {
    
  }

  return (
    <div>
      <div className="container flex items-center justify-center h-screen mx-auto">

        <form onSubmit={handleOrgSubmit}>

          <div>

            Pokemon

          </div>


        </form>


      </div>


    </div>
  )
}

export default CreateOrganization