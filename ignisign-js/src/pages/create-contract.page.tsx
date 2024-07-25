
import React, { useEffect, useState } from 'react'

import { Button } from '../components-ui/button'
import Card from '../components-ui/card'
import { Dropzone } from '../components-ui/dropzone'
import { useCustomer } from '../contexts/customer.context'
import { useEmployee } from '../contexts/employee.context'
import { ApiService } from '../services/api.service'
import { FrontUrlProvider } from '../utils/front-url-provider'
import { Customers } from '../components/customer'
import { Employees } from '../components/employee'
import { useHistory } from "react-router";

const CreateContract = () => {
  const history                           = useHistory();
  const {selectedCustomerId}              = useCustomer();
  const {selectedEmployeeId}                = useEmployee();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading]         = useState(false);

  const handleFileChange = (files : File[], fullPrivacy : boolean = false) => {
    const keepFiles = selectedFiles.filter(e=>e.fullPrivacy !== fullPrivacy)
    const newFiles = files.map(e=>({
      fullPrivacy,
      file: e
    }))
    setSelectedFiles([...keepFiles, ...newFiles]);
  };

  const reset = async () => {
    setSelectedFiles([])
  }

  const sendContract = async () => {
    setIsLoading(true)
    await ApiService.createContract(selectedCustomerId, selectedEmployeeId, selectedFiles[0])
    await reset()
    history.push(FrontUrlProvider.contractsPage())
    setIsLoading(false)
  }

  return (
    <div className='w-full'>
      <div className='flex gap-4 w-full'>
        <Employees/>
        <Customers/>
      </div>
      <div className='mt-4'>
        <Card className='flex-col'>
          <div className='font-medium'>Upload Contract</div>
          <div className='mt-2'>
            <Dropzone
              onDrop={async files => handleFileChange(files)}
              files={selectedFiles}
              maxFiles={1}
              multiple={false}
            />
          </div>
        </Card>
      </div>
      <div className='mt-4 flex justify-center items-center'>
        <Button disabled={isLoading || !selectedCustomerId || !selectedEmployeeId || !selectedFiles.length} onClick={sendContract}>Send Contract Request</Button>
        {isLoading && <div className='ml-4'>...Loading</div>}
      </div>
    </div>
  )
}

export default CreateContract