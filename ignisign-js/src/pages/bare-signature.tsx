import { useState } from "react";
import { Dropzone } from "../components-ui/dropzone";
import ClientOAuth2 from 'client-oauth2';
import crypto from 'crypto';
import { nanoid } from 'nanoid'
import axios from "axios";
import { Button } from '../components-ui/button'
import { IGNISIGN_APPLICATION_ENV } from "@ignisign/public";
import { ApiService } from "../services/api.service";

// const serverUrl = 'http://localhost:3101/v4';                             // TODO
// const appId     = 'appId_18fbce98-98f5-4fc8-944c-0fe54cf8f09b';           // TODO
// const appEnv    = IGNISIGN_APPLICATION_ENV.DEVELOPMENT;                   // TODO
// const appSecret = 'sk_development_1f3426e0-7744-43f0-82f1-60bffe0edf14';  // TODO
// const baseUrl = `${serverUrl}/envs/${appEnv}/oauth2`;                     // TODO
    
export const BareSignature = () => {
  const [selectedFile, setSelectedFile] = useState<File>(null);
  // const [hashes, setHashes]               = useState<string[]>([]);
  const [isLoading, setIsLoading]       = useState<boolean>(false);
  const [bareSignatureId, setBareSignatureId] = useState<string>('');

  /* 
  const handleFileChange = async (files : File[]) => {
    console.log('handleFileChange_1 : ', files);
    const generatedHashes = await Promise.all(files.map(generateHashFromFile));
    console.log('handleFileChange_2 : ', generatedHashes);
    setHashes(generatedHashes);
  };

  const generateHashFromFile = async (file: File) : Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result;
        if (fileData instanceof ArrayBuffer) {
          const buffer = Buffer.from(fileData);
          const hash = crypto.createHash('sha256');
          hash.update(buffer);
          const hex = hash.digest('hex');
          resolve(hex);
        } else {
          reject(new Error('File data is not an ArrayBuffer'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const goSign = async () => {
    try {
      const state = {
        hashes,
        nonce : nanoid()
      };

      const { data } = await axios.get(
        `${baseUrl}/authorize`, 
        { params: {
            response_type          : 'code',
            client_id              : appId,
            redirect_uri           : 'http://localhost:3456/callback',
            state                  : JSON.stringify(state),
            code_challenge         : 'code_challenge', // TODO
            code_challenge_method  : 'S256'
          }
        }
      );

      console.log('goSign_0 : ', data);
      window.location.href = data;
    } catch (e) {
      console.error('goSign_Error : ', e);
    }
    
    // const oAuthClient = new ClientOAuth2({
    //   clientId          :  appId,
    //   clientSecret      :  appSecret,
    //   accessTokenUri    : `${baseUrl}/token`,
    //   authorizationUri  : `${baseUrl}/authorize`,
    //   redirectUri       : 'http://localhost:3456/callback',
    //   scopes            : [], // TODO
    //   state             : JSON.stringify(state)
    // });

    axios.get(`${baseUrl}/authorize`, {
      params: {
        response_type          : 'code',
        client_id              : appId,
        redirect_uri           : 'http://localhost:3456/callback',
        state                  : JSON.stringify(state),
        code_challenge         : 'code_challenge',
        code_challenge_method  : 'S256'
      }
    }).then((response) => {
      console.log('goSign_1 : ', response);
      // TODO
    }).catch((error) => {
      console.log('goSign_2 : ', error);
    });
  } */

  
  const createBareSignature = async () => {
    try {
      setIsLoading(true);
      const savedBareSignature = await ApiService.bareSignatureUploadFile(selectedFile);
      setBareSignatureId(savedBareSignature._id);
      console.log('createBareSignature_0 : ', savedBareSignature);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async () => {
    try {
      setIsLoading(true);
      const { redirectUrl } = await ApiService.bareSignatureLogin(bareSignatureId);
      window.location.href = redirectUrl;
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Dropzone
        onDrop={async files => setSelectedFile(files[0])}
        files={[selectedFile]}
        maxFiles={1}
        multiple={false}
      />

      <Button 
        onClick={createBareSignature}
        disabled={!selectedFile} 
        loading={isLoading}
      >
        Create Bare Signature
      </Button>

      <Button 
        onClick={login}
        disabled={!bareSignatureId} 
        loading={isLoading}
      >
        Login
      </Button>

      {/* <Button 
        onClick={goSign}
        disabled={!hashes?.length} 
        loading={isLoading}
      >
        Sign
      </Button> */}
    </div>
  )
}