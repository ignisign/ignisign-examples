import React, { useEffect, useState } from 'react'
import { Button } from '../components-ui/button'
import Card from '../components-ui/card'
import Select from '../components-ui/select'
import { useContract } from '../contexts/contract.context'
import { useCustomer } from '../contexts/customer.context'
import { useGlobal } from '../contexts/global.context'
import { useSeller } from '../contexts/seller.context'
import { FrontUrlProvider } from '../utils/front-url-provider'
import { useHistory } from "react-router";
import { ApiService } from '../services/api.service'
import FileSaver from 'file-saver'

const Explanation_Contract_Header = () => {
  return ( <div>
  This page emulate the view of a user in the app, allowing him to see his contracts
</div>)
} 

const Explanation_Contract_Embedded = () => {
  const {isEmbedded}  = useGlobal()
  if(!isEmbedded) return (<></>)


  return ( <div className='mt-4 border border-blue-600 bg-blue-100 text-xs text-blue-600 p-4 rounded'>
    <div className='font-semibold'>Embedded Mode</div>
    <div>As signers tokens are provided through webhook, it may took some time to display signing button</div>
    <div>If after a while, the 'Sign my document' button has not appeared, something may have gone wrong. Please check the webhook and backend.</div>
  </div>)
} 

const Contracts = () => {
  const history       = useHistory()
  const {isEmbedded}  = useGlobal()
  
  const {sellers}     = useSeller()
  const {customers}   = useCustomer()
  const {contracts, getContracts, reset, isLoading} = useContract()

  const users = [...sellers ?? [], ...customers ?? []]
  const [selectedUserId, setSelectedUserId] = useState()

  const doSelectUser = (e) => {
    setSelectedUserId(e)
    if(!e){
      reset()
    }
    else{
      getContracts(e)
    }
  }

  const downloadSignatureProof = async (contractId) => {
    const blob = await ApiService.downloadSignatureProof(contractId)
    FileSaver.saveAs(blob, 'signature-proof.pdf');
  }

  const openSignatureProofUrl = async (url) => {
    window.open(url, '_blank')
  }

  return (
    <div>
      <Card className='flex-col'>
        <Explanation_Contract_Header/>
        {(!users.length)? 
          <> No Users - Please create a client or a seller</> : 
          <div className='mt-2 flex gap-2 items-center'>
            <Select callback={doSelectUser} options={[{key: null, value: ''}, ...users.map(e=>({key: e._id, value: `${e.type} ${e.email}`}))]}/>
          </div>
        }
      </Card>
        <Explanation_Contract_Embedded/>
      { (selectedUserId) && 
        <>
          { isLoading ? 
              <div>Loading...</div> : 
              <>
                <div className='font-medium mt-4'>Contracts</div>
                <div className='mt-2'>
                  {(!contracts?.length)? 
                    <>
                      No contracts
                    </> : 
                    <>
                      {
                        contracts.map( e=> (
                          <div key={e._id} className='mb-4'>
                            <Card>
                              <div className='flex justify-between items-center'>
                                <div className='mr-2'>
                                  Contract n°{e._id}
                                </div>
                                
                                {/* The User has signed the contract */}
                                <div>
                                  {(e.signers.find(e=>e.userId === selectedUserId).status === 'DONE')? 
                                    <div className='text-green-500 text-xs py-1 px-2 bg-green-50 border-green-500 border rounded mr-2 '> 
                                      Signed 
                                    </div> : 
                                    <>
                                      {(isEmbedded) ? 
                                        <>
                                          {(e.signers.find(e=>e.userId === selectedUserId).ignisignSignatureToken) ? 
                                              <Button 
                                                onClick={() => history.push(FrontUrlProvider.signContract(e._id, selectedUserId))}>
                                                  Sign my document
                                              </Button> :
                                              <div className='text-yellow-500 text-xs py-1 px-2 bg-yellow-50 border-yellow-500 border rounded mr-2 '>
                                                Waiting webhook, please refresh
                                              </div>
                                          }
                                        </> : 
                                        <div className='text-yellow-500 text-xs py-1 px-2 bg-green-50 border-yellow-500 border rounded mr-2 '>Waiting signature - Request have been sent by email</div>
                                      }
                                    </>
                                  }
                                </div>
                                { (e.signers.find(e=>e.userId === selectedUserId).status === 'DONE' && !e.isSignatureProofReady )? 
                                  <>
                                    <div className='text-yellow-500 text-xs py-1 px-2 bg-yellow-50 border-yellow-500 border rounded  mr-2 '>Waiting signature proof generation</div>
                                  </> : 
                                  <div className='flex flex-row gap-2'>
                                    { e.isSignatureProofReady && 
                                      <Button className="mr-2" onClick={()=>downloadSignatureProof(e._id)}>
                                        Download signature proof
                                      </Button> }
                                      
                                    { e.signatureProofUrl && 
                                      <Button className="mr-2" onClick={()=>openSignatureProofUrl(e.signatureProofUrl)}>
                                        Detailed signature proof
                                      </Button> }
                                  </div>
                                }

                              </div>
                            </Card>
                          </div>
                        )
                      )}
                    </>
                  }
                </div>
              </>
          }
        </>
      }

    </div>
  )
}

export default Contracts