import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiService } from '../services/api.service';

export const BareSignatureCallback = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnError, setIsOnError] = useState<boolean>(false);

  useEffect(() => {
    init();
  }, [])
  
  const init = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams(window.location.search)
      const token       = queryParams.get("code");
      const state       = JSON.parse(queryParams.get("state") || '{}');

      if(!token || !state?.bareSignatureId) {
        throw new Error();
      }

      const { bareSignatureId } = state;
      console.log('BareSignatureCallback : ', { token, state });  

      await saveAccessToken(token, bareSignatureId);
      // TODO GO TO THE LISTING INSTED OF GETTING THE PROOF
      await getProof(bareSignatureId);

    } catch (e) {
      console.error(e); 
      setIsOnError(true);
    } finally {
      setIsLoading(true);
    }
  }
  
  const saveAccessToken = async (token: string, bareSignatureId: string) => {
    await ApiService.bareSignatureSaveAccessToken(bareSignatureId, token);
  }

  const getProof = async (bareSignatureId: string) => {
    const proof = await ApiService.bareSignatureGetProof(bareSignatureId);
    console.log('getProof : ', proof);
  }

  if(isLoading) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  if(isOnError) {
    return (
      <div>
        Error
      </div>
    )
  }

  return (
    <div>
      BareSignatureCallback : TODO DISPLAY PROOF ? 
    </div>
  )
}