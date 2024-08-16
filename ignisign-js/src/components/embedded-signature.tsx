import { IgnisignJs, IgnisignJS_SignatureSession_Initialization_Params } from '@ignisign/js';
import { IgnisignDocument_PrivateFileDto, IGNISIGN_APPLICATION_ENV, IGNISIGN_ERROR_CODES } from '@ignisign/public';
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom';
import { ApiService } from '../services/api.service';

const IGNISIGN_CLIENT_SIGN_URL = process?.env?.REACT_APP_IGNISIGN_CLIENT_SIGN_URL || 'https://sign.ignisign.io';

// Define the EmbeddedSignature component
const EmbeddedSignature = ({signatureRequestId, signerId, signatureSessionToken, signerAuthSecret, appId, appEnv}) => {

  useEffect(() => {
    start();
  }, [])
  
  // Function to handle private file info provisioning
  const handlePrivateFileInfoProvisioning = async (documentId: string, externalDocumentId: string, signerId: string, signatureRequestId: string) : Promise<IgnisignDocument_PrivateFileDto> => {
    console.debug('handlePrivateFileInfoProvisioning', documentId, externalDocumentId, signerId, signatureRequestId);
    const privateFileDto: IgnisignDocument_PrivateFileDto = await ApiService.getPrivateFileUrl(documentId);
    return privateFileDto;
  }

  const handleSignatureSessionError = async (errorCode: IGNISIGN_ERROR_CODES, errorContext: any, signerId: string, signatureRequestId: string) : Promise<void> => {
    console.debug('handleSignatureSessionError', errorCode, errorContext, signerId, signatureRequestId);
    console.error("Ignisign Signature Session Error: " + errorCode, {errorContext, signerId, signatureRequestId});
  }

  const handleSignatureSessionFinalized = async (signatureIds: string[], signerId: string, signatureRequestId: string) : Promise<void> => {
    console.debug('handleSignatureSessionFinish', signatureIds, signerId, signatureRequestId);
  }

  const start = async () => {
    try {
      // Create a new instance of IgnisignJs
      const ignisign = new IgnisignJs(appId, appEnv as IGNISIGN_APPLICATION_ENV, IGNISIGN_CLIENT_SIGN_URL);

      // Define the params to initialize the signature request
      const params: IgnisignJS_SignatureSession_Initialization_Params = {
        signatureRequestId,                           // The signature request id
        signatureSessionToken,                        // The token that allows to initialize a signature session related to the signature request and the signer
        signerId,                                     // The signer id
        signerAuthSecret,                             // The signer auth secret - required to initialize a signature session in embedded mode
        sessionCallbacks: {
          handlePrivateFileInfoProvisioning,           // The function to handle private file info provisioning
          handleSignatureSessionError,                 // The function to handle signature session errors
          handleSignatureSessionFinalized              // The function to handle signature session finalization
        },
        closeOnFinish: true,                          // Close the signature session when the signature request is signed 
        htmlElementId: 'test-ignisign-sdk',           // The id of the html element where the signature session will be initialized
        dimensions: { width: "100%", height: "710px" }
      }

      // Initialize the signature session
      ignisign.initSignatureSession(params);
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

export default EmbeddedSignature