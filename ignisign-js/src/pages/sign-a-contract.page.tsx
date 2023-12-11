import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { ApiService } from '../services/api.service';
import EmbeddedSignature from '../components/embedded-signature';


const SignAContract = () => {

  const location                  = useLocation();
  const [isLoading, setIsLoading] = useState(false)
  const [contract, setContract]   = useState(null)

  const { contractId, userId }    = useMemo(() => {
    const a           = location?.pathname?.split('/user/')
    const contractId  = a[0].replace('/contract/', '')
    const userId      = a[1].replace('/sign', '')
    return { contractId, userId }

  }, [location])

  const getContractContext = async () => {
    setIsLoading(true)
    const contract = await ApiService.getContractContext(contractId, userId)
    setContract(contract)
    setIsLoading(false)
  }

  useEffect(() => {
    if(contractId && userId)
      getContractContext()

  }, [contractId, userId])

  return (
    <div>
      <div className='text-xl flex justify-center'>Sign a contract</div>

      <div>
        {isLoading && <div>Loading...</div>}
        {
          contract && <>
            <EmbeddedSignature
              signatureRequestId={contract.signatureRequestId}
              signerId={contract.ignisignSignerId}
              signatureSessionToken={contract.ignisignSignatureToken} 
              signerAuthSecret={contract.ignisignUserAuthSecret}
              appId={contract.ignisignAppId}
              appEnv={contract.ignisignAppEnv}
            />
          </>
        }
      </div>
    </div>
  )
}

export default SignAContract