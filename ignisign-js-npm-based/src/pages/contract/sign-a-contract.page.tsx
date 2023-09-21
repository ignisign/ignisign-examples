import { IgnisignJs, IgnisignJS_SignatureRequest_Initialization_Params } from '@ignisign/js';
import { IgnisignDocument_PrivateFileDto, IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { useHistory } from "react-router";
import { Button } from '../../components/button';
import { useContract } from '../../contexts/contract.context';
import { ApiService } from '../../services/api.service';

const IGNISIGN_CLIENT_SIGN_URL = process?.env?.REACT_APP_IGNISIGN_CLIENT_SIGN_URL || 'https://sign.ignisign.io';

const EmbeddedSignature = ({signatureRequestId, signerId, token, authSecret, appId, appEnv}) => {

  useEffect(() => {
    start();
  }, [])
  
  const handlePrivateFileInfoProvisioning = async (documentId) : Promise<IgnisignDocument_PrivateFileDto> => {
    const url = await ApiService.getPrivateFileUrl(documentId);
    return url;
  }

  const start = async () => {
    try {
      const ignisign = new IgnisignJs(appId, appEnv as IGNISIGN_APPLICATION_ENV, IGNISIGN_CLIENT_SIGN_URL);
      const params: IgnisignJS_SignatureRequest_Initialization_Params = {
        signerId,
        signatureRequestId,
        closeOnFinish: true,
        token,
        signerAuthSecret: authSecret,
        iFrameMessagesCallbacks:{
          handlePrivateFileInfoProvisioning
        },
        htmlElementId: 'test-ignisign-sdk',
        iFrameOptions: {
          width:"100%",
          height:"710"
        }
      }
      ignisign.initSignatureRequest(params);
    } catch (e) {
      console.error(e);
    }
  }

  return(
    <div>
      <div className='mt-3'>
        <div id='test-ignisign-sdk'/>
      </div>
    </div>
  )
}

const SignAContract = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false)
  const [contract, setContract] = useState(null)

  const {contractId, userId} = useMemo(() => {
    const a = location?.pathname?.split('/user/')
    const contractId  = a[0].replace('/contract/', '')
    const userId = a[1].replace('/sign', '')
    return {contractId, userId}
  }, [location])

  const getContractContext = async () => {
    setIsLoading(true)
    const contract = await ApiService.getContractContext(contractId, userId)
    setContract(contract)
    setIsLoading(false)
  }

  useEffect(() => {
    if(contractId && userId){
      getContractContext()
    }
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
              token={contract.ignisignSignatureToken} 
              authSecret={contract.ignisignUserAuthSecret}
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