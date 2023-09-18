import { useEffect, useState } from 'react';
import { Button } from '../components/button';
import { useHistory, useLocation, useParams } from "react-router";
import { useUsers } from '../contexts/user.context';
import { ApiService } from '../services/api.service';
import { useSignatureRequests } from '../contexts/signature-request.context';
import { useSignatureProfiles } from '../contexts/signature-profile.context';
import { Snackbar } from '@mui/material';
import { useStateWithRef } from '../utils/useStateWithRef';
import { IGNISIGN_APPLICATION_ENV, IgnisignDocument_PrivateFileDto, IgnisignSignatureRequest_Context } from '@ignisign/public';
import { IgnisignJs } from '@ignisign/js';
import { MySignatureRequest, Signer } from '../models/signature-request.front.model';
import { BiUserCircle } from "react-icons/bi";
import { HiArrowNarrowRight } from "react-icons/hi";
import { useIgniSnackbar } from '../contexts/snackbar.context';
import { LoadingSpinner } from '../components/loadingSpinner';

const IGNISIGN_CLIENT_SIGN_URL = process.env.REACT_APP_IGNISIGN_CLIENT_SIGN_URL || 'https://sign.ignisign.io';

const EmbeddedSignature = ({signatureRequestId, signerId, token, authSecret}) => {

  useEffect(() => {
    start();
  }, [])
  
  const handlePrivateFileInfoProvisioning = async (documentId) : Promise<IgnisignDocument_PrivateFileDto> => {
    const url = await ApiService.getPrivateFileUrl(documentId);
    return url;
  }

  const start = async () => {
    try {
      const appId  = process.env.REACT_APP_IGNISIGN_APP_ID;
      const appEnv = process.env.REACT_APP_IGNISIGN_APP_ENV;
      
      const ignisign = new IgnisignJs(appId, appEnv as IGNISIGN_APPLICATION_ENV, IGNISIGN_CLIENT_SIGN_URL);

      ignisign.initSignatureRequest({
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
      );
      
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


const SignatureRequestsDetailPage = () => {
  const history                                               = useHistory();
  const location                                              = useLocation();
  const { notifyError }                                       = useIgniSnackbar();
  const { users }                                             = useUsers();
  const { signatureRequests }                                 = useSignatureRequests();
  const { selectedSignatureProfileId }                        = useSignatureProfiles();
  const { signatureRequestId: internalSignatureRequestId }    = useParams<{ signatureRequestId: string }>();
  const [userSelectToSign, setUserSelectToSign]               = useState<Signer>(null);
  const [, setIsDemmoSnackbarOpen, isDemmoSnackbarOpenRef]    = useStateWithRef(false);
  const [signatureRequest, setSignatureRequest]               = useState<MySignatureRequest>();
  const [signatureRequestContext, setSignatureRequestContext] = useState<IgnisignSignatureRequest_Context>();
  const [signers, setSigners]                                 = useState<Signer[]>([]);
  const [signatureRequestId, setSignatureRequestId]           = useState<string>()
  const [isLoading, setIsLoading]                             = useState<boolean>(true);

  const getSignatureRequestContext = async (internalSignatureRequestId: string) => {
    try {
        const srContext = await ApiService.getSignatureRequestContext(internalSignatureRequestId);
        setSignatureRequestContext(srContext);
    } catch (e) {
      console.error(e);
      notifyError('Error while getting signature request context');
    }
  }

  const getSignatureRequestUsers = async (internalSignatureRequestId: string) => {
    setIsLoading(true);
    try {
      const sr = await ApiService.getSignatureRequestSigners(internalSignatureRequestId);
      setSignatureRequestId(sr?.signatureRequestId)
      const signers = sr?.signers?.map(({myUserId, signerId, token}) => {
        const user = users.find(u => u._id.toString() === myUserId);
  
        if(!user) 
          return null;
  
        const { firstName, lastName, authSecret, _id } = user;
        
        return {
          _id,
          firstName,
          lastName,
          authSecret,
          token,
          signerId
        }
      }).filter(e=>e !== null)
  
      setSigners(signers);
    } catch (e) {
      console.error(e);
      notifyError('Error while getting signature request users'); 
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    setSignatureRequest(signatureRequests.find(e => e._id?.toString() === internalSignatureRequestId));
    getSignatureRequestContext(internalSignatureRequestId);
    getSignatureRequestUsers(internalSignatureRequestId);
  }, [users])

  const SignerItem = ({ signer } : { signer: Signer }) => (
    <div className='cursor-pointer flex gap-5 items-center justify-between shadow bg-gray-900 rounded px-3 py-2' 
      onClick={() => setUserSelectToSign(signer)}
      key={`signer-item-${signer._id}`} 
    >
      <div className='flex gap-3 items-center'> 
        <span className='text-primary-500'>
          <BiUserCircle size={30}/>
        </span>

        <div className='font-bold'>
          {signer.firstName} {signer.lastName}
        </div>
        
      </div>
      

      <div className='text-primary-500'>
        <HiArrowNarrowRight size={25}/>
      </div> 
    </div>
  )

  const openSignatureProofs = () => window.open(signatureRequestContext?.signatureProofsUrl, '_blank');
  

  return (
    <div>
      <Snackbar
        open={isDemmoSnackbarOpenRef.current}
        autoHideDuration={6000}
        onClose={()=>setIsDemmoSnackbarOpen(false)}
        message="Need start auth"
      />
      {isLoading ? 
        <div className='w-full flex justify-center'>
          <LoadingSpinner/> 
        </div>
      :
        userSelectToSign ? <>

          { signatureRequestContext?.signatureProofsUrl && 
            <div className="flex justify-end mb-3">
              <Button onClick={openSignatureProofs}>
                See signature proofs
              </Button>
            </div>
          }

          <div>
            <Button onClick={()=>setUserSelectToSign(null)}>Back</Button>
            {/* { signatureRequest &&  */}
              <EmbeddedSignature 
                signatureRequestId={signatureRequestId}
                signerId={userSelectToSign.signerId}
                token={userSelectToSign.token} 
                authSecret={userSelectToSign.authSecret}
              />
            {/* } */}
          </div>
        </> :
        <>
          {
            signers && 
            <div className='mt-5'>
              <div className='flex flex-col gap-3 w-full'>
                {signers.length ? 
                    signers?.map(s => <SignerItem key={`signer-${s?._id}`} signer={s}/>) :
                    <>
                      Check if webhook is linked
                    </>
                }
              </div>
            </div>
          }
        </>
      }
    </div>
  )
}



export default SignatureRequestsDetailPage  