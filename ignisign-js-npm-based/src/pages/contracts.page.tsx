import React, { useEffect, useState } from 'react'
import { Button } from '../components/button'
import Card from '../components/card'
import Select from '../components/select'
import { useContract } from '../contexts/contract.context'
import { useCustomer } from '../contexts/customer.context'
import { useGlobal } from '../contexts/global.context'
import { useSeller } from '../contexts/seller.context'
import { FrontUrlProvider } from '../utils/front-url-provider'
import { useHistory } from "react-router";

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

  return (
    <div>
      <Card>
        <div>
          This page emulate the view of a user in the app, allowing him to see his contracts
        </div>
        <div className='mt-2 flex gap-2 items-center'>
          <Select callback={doSelectUser} options={[{key: null, value: ''}, ...users.map(e=>({key: e._id, value: `${e.type} ${e.email}`}))]}/>
        </div>
      </Card>
        {
          isEmbedded && <div className='mt-4'>
            <div>As signers tokens are provided through webhook, it may took some time to display signing button</div>
            <div>If, after a while, the 'Sign my document' button has not appeared, something may have gone wrong. Please check the webhook and backend.</div>
          </div>
        }
      {
        selectedUserId && <>
          {
            isLoading ? <div>Loading...</div> : <>
              <div className='font-medium mt-4'>Contracts</div>
              <div className='mt-2'>
                {
                  !contracts?.length ? <>
                    No contracts
                  </> : <>
                    {
                      contracts.map(e=>(
                        <div key={e._id} className='mb-4'>
                          <Card>
                            <div className='flex justify-between items-center'>
                              <div>
                                Contract n°{e._id}
                              </div>
                              <div>
                                {
                                  e.signers.find(e=>e.userId === selectedUserId).status === 'DONE' ? <>
                                    <div className='text-green-500'>
                                      Signed
                                    </div>
                                  </> : <>
                                    {
                                      isEmbedded ? <>
                                        {
                                          e.signers.find(e=>e.userId === selectedUserId).ignisignSignatureToken ? <>
                                            <Button onClick={() => history.push(FrontUrlProvider.signContract(e._id, selectedUserId))}>Sign my document</Button>
                                          </> : <>
                                            <div className='text-yellow-400'>Waiting webhook, please refresh</div>
                                          </>
                                        }
                                      </> : <>
                                        <div className='text-yellow-400'>Waiting signature</div>
                                      </>
                                    }
                                  </>
                                }
                              </div>
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