
import { faker } from '@faker-js/faker'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/button'
import Card from '../../components/card'
import { Dropzone } from '../../components/dropzone'
import { Input } from '../../components/input'
import Select from '../../components/select'
import { useCustomer } from '../../contexts/customer.context'
import { useGlobal } from '../../contexts/global.context'
import { useSeller } from '../../contexts/seller.context'
import { ApiService } from '../../services/api.service'
import { FrontUrlProvider } from '../../utils/front-url-provider'
import { INPUTS } from '../../utils/inputs'
import { Customers } from './customer'
import { Sellers } from './seller'
import { useHistory } from "react-router";

const MakeContract = () => {
  const history = useHistory();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const {selectedCustomerId} = useCustomer()
  const {selectedSellerId} = useSeller()

  const [isLoading, setIsLoading] = useState(false)

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
    await ApiService.createContract(selectedCustomerId, selectedSellerId, selectedFiles[0])
    await reset()
    history.push(FrontUrlProvider.contractsPage())
    setIsLoading(false)
  }

  return (
    <div>
      <div className='flex gap-4'>
        <Sellers/>
        <Customers/>
      </div>
      <div className='mt-4'>
        <Card>
          <div className='font-medium'>Upload contract</div>
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
        <Button disabled={isLoading || !selectedCustomerId || !selectedSellerId || !selectedFiles.length} onClick={sendContract}>Send contract request</Button>
        {isLoading && <div className='ml-4'>...Loading</div>}
      </div>
    </div>
  )
}

export default MakeContract