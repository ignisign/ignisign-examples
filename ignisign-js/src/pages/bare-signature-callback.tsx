import { useEffect, useState } from 'react';
import { ApiService } from '../services/api.service';
import { useHistory, useLocation } from "react-router";
import { FrontUrlProvider } from '../utils/front-url-provider';

export const BareSignatureCallback = () => {
  const history                   = useHistory();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    init();
  }, [])
  
  const init = async () => {
    try {
      const queryParams = new URLSearchParams(window.location.search)
      const error       = queryParams.get("error");

      if(error) {
        throw error;
        return;
      }

      const token       = queryParams.get("code");
      const state       = JSON.parse(queryParams.get("state") || '{}');

      if(!token || !state?.externalId) {
        throw 'Token or bareSignatureId not found';
      }

      const { externalId } = state;

      await saveAccessToken(token, externalId);
      history.replace(FrontUrlProvider.bareSignaturePage());

    } catch (e) {
      console.error('BareSignatureCallback : ', e); 
      setError(e);
    }
  }
  
  const saveAccessToken = async (token: string, bareSignatureId: string) => {
    await ApiService.bareSignatureSaveAccessToken(bareSignatureId, token);
  }

  if(!!error) {
    return (
      <div>
        Error : {error}
      </div>
    )
  }
  
  return (
    <div>
      Loading...
    </div>
  )
}