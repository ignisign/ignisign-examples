import { useEffect, useState } from 'react';
import { ApiService } from '../services/api.service';
import { useHistory, useLocation } from "react-router";
import { FrontUrlProvider } from '../utils/front-url-provider';

export const BareSignatureCallback = () => {
  const history                   = useHistory();
  const [isOnError, setIsOnError] = useState<boolean>(false);

  useEffect(() => {
    init();
  }, [])
  
  const init = async () => {
    try {
      const queryParams = new URLSearchParams(window.location.search)
      const token       = queryParams.get("code");
      const state       = JSON.parse(queryParams.get("state") || '{}');

      if(!token || !state?.bareSignatureId) {
        throw new Error('Token or bareSignatureId not found');
      }

      const { bareSignatureId } = state;

      await saveAccessToken(token, bareSignatureId);
      history.replace(FrontUrlProvider.bareSignaturePage());

    } catch (e) {
      console.error('BareSignatureCallback : ', e); 
      setIsOnError(true);
    }
  }
  
  const saveAccessToken = async (token: string, bareSignatureId: string) => {
    await ApiService.bareSignatureSaveAccessToken(bareSignatureId, token);
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
      Loading...
    </div>
  )
}