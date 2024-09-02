import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { ApiService } from '../../services/api.service';
import EmbeddedSignature from '../../components/embedded-signature';
import { useSeal } from '../../contexts/seal.context';


const SignASeal = () => {
  const location                  = useLocation();
  const [isLoaded, setIsLoaded]    = useState(false)
  const [ignisignUserAuthSecret, setIgnisignUserAuthSecret]  = useState('')

  const {
    seals,
    isSealLoading,
  } = useSeal()

  const seal  = useMemo(() => {
    const a           = location?.pathname?.split('/seal/')
    const contractId  = a[1].replace('/sign', '')
    console.log({seals, contractId});
    
    const seal = seals.find(e=>e._id.toString() === contractId)
    return seal
  }, [location, seals])

  const getNewSignerAuthSecret = async () => {
    try {
      setIsLoaded(false)
      const authSecret = await ApiService.getNewSignerAuthSecret(seal.ignisignSignerId)
      console.log({authSecret});
      
      setIgnisignUserAuthSecret(authSecret)
    } catch (error) {
      
    }
    setIsLoaded(true)
  }

  useEffect(() => {
    console.log({seal});
    
    if(seal){
      getNewSignerAuthSecret()
    }
  }, [seal])

  return (
    <div>
      <div className='text-xl flex justify-center'>Sign a contract</div>

      <div>
        {(isSealLoading || !isLoaded) && <div>Loading...</div>}
        {
          seal && ignisignUserAuthSecret && <>
            <EmbeddedSignature
              signatureRequestId={seal.signatureRequestId}
              signerId={seal.ignisignSignerId}
              signatureSessionToken={seal.ignisignSignatureToken} 
              signerAuthSecret={ignisignUserAuthSecret}
              appId={seal.ignisignAppId}
              appEnv={seal.ignisignAppEnv}
            />
          </>
        }
      </div>
    </div>
  )
}

export default SignASeal