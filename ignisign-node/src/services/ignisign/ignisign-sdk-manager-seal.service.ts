import { IGNISIGN_APPLICATION_ENV, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_SIGNER_CREATION_INPUT_REF, IGNISIGN_WEBHOOK_ACTION_SIGNATURE, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST, IGNISIGN_WEBHOOK_MESSAGE_NATURE, IgnisignSignerProfile, IgnisignWebhook, IgnisignWebhookDto_Signature, IgnisignWebhookDto_SignatureProof_Success, IgnisignWebhookDto_SignatureRequest, IgnisignWebhook_ActionDto, IgnisignWebhook_CallbackParams } from "@ignisign/public";
import { IgnisignSdk, IgnisignSdkUtilsService } from "@ignisign/sdk";
import { IgnisignSdkManagerCommonsService } from "./ignisign-sdk-manager-commons.service";
const crypto = require('crypto');
const fs = require('fs');


let isIgnisignSdkInstanceInitialized : boolean = false;
let ignisignSdkInstance: IgnisignSdk = null;

let m2mId = null;
let m2mPrivateKey = null;

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}


export const IgnisignSdkManagerSealService = {
  init,
  isEnabled,
  createM2mSignatureRequest,
  checkWebhookEndpoint,
  getWebhookEndpoints,
  consumeWebhook,
  getSignerProfiles,
  getSignerProfile,
  getSignerInputsConstraintsFromSignerProfileId,
  
}


/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

function isEnabled(): boolean {
  return isIgnisignSdkInstanceInitialized;
}

async function init(appId: string, appEnv: IGNISIGN_APPLICATION_ENV, appSecret: string, m2mIdParam : string, m2mPrivateKeyParam: string) {
  _logIfDebug("IgnisignSdkManagerSignatureService: init")
  
  if(!appId || !appEnv || !appSecret)
    throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_SECRET are mandatory to init IgnisignSdkManagerSignatureService`);
  
  m2mId         = m2mIdParam;
  m2mPrivateKey = m2mPrivateKeyParam
  try {
    if(isIgnisignSdkInstanceInitialized)
      return;

    isIgnisignSdkInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkInstance = new IgnisignSdk({
      appId,
      appEnv,
      appSecret,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
    await _registerWebhookCallback();

  
  } catch (e){
    isIgnisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

async function createM2mSignatureRequest(fileBuffer : Buffer, asPrivateFile : boolean, mimeType : string ): Promise<void> {
  
  const documentType  = asPrivateFile ? IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE : IGNISIGN_DOCUMENT_TYPE.FILE;
  const documentHash  = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const documentBase64 = fileBuffer.toString('base64');

  const { signature :documentHashSignedByM2MPrivateKey } = IgnisignSdkUtilsService.sealM2M_doSignPayload(m2mPrivateKey, documentHash)

  const {signatureRequestId, documentId } = await ignisignSdkInstance.signM2M({
    m2mId,
    document : {
      documentType,
      contentB64 : documentBase64,
      documentHash,
      mimeType,
    },
    documentHashSignedByM2MPrivateKey,
  });

}


async function getSignerProfile(signerProfileId: string): Promise<IgnisignSignerProfile> {
  try {
    return await ignisignSdkInstance.getSignerProfile(signerProfileId);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getSignerProfiles(): Promise<IgnisignSignerProfile[]> {
  try {
    return await ignisignSdkInstance.getSignerProfiles();
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function getSignerInputsConstraintsFromSignerProfileId(signatureProfileId: string): Promise<IGNISIGN_SIGNER_CREATION_INPUT_REF[]> {
  
  const result = await ignisignSdkInstance.getSignerInputsConstraintsFromSignerProfileId(signatureProfileId);
  return result.inputsNeeded;
}



/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** WEBHOOKS *********************************************************************************/
/******************************************************************************************** ******************************************************************************************/


// Registration of webhooks handlers when whe initialize the Ignisign SDK.
async function _registerWebhookCallback(): Promise<void> {
  _logIfDebug("_registerWebhookCallback")

  // The callback function is called when a webhook is received about the lauch of a signature request
  const webhookHandler_LaunchSignatureRequest = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureRequest>): Promise<void> => {
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_LaunchSignatureRequest ERROR : ", error);
      return;
    }

    const { signatureRequestExternalId, signatureRequestId, signers } = content as IgnisignWebhookDto_SignatureRequest;

    _logIfDebug("webhookHandler_LaunchSignatureRequest", {signatureRequestExternalId, signatureRequestId})

    // TODO
  }

  
  await ignisignSdkInstance.registerWebhookCallback_SignatureRequest(     // Registering the webhookHandler_LaunchSignatureRequest callback function
    webhookHandler_LaunchSignatureRequest, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST.LAUNCHED
  );


  // The callback function is called when a webhook is received when a signature has been finalized
  const webhookHandler_signatureFinalized = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_Signature>): Promise<void> => {
    
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_signatureFinalized ERROR : ", error);
      return;
    }
    const {signatureRequestExternalId, signatureRequestId, signerExternalId} = content as IgnisignWebhookDto_Signature;

    _logIfDebug("webhookHandler_signatureFinalized", {signatureRequestExternalId, signatureRequestId, signerExternalId})

    // TODO
  }

  
  await ignisignSdkInstance.registerWebhookCallback_Signature(    // Registering the webhookHandler_signatureFinalized callback function
    webhookHandler_signatureFinalized, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE.FINALIZED);
  

  // The callback function is called when a webhook is received when a signature proof has been generated
  const webhookHandler_SignatureProofGenerated = async ({ content, error, msgNature, action, topic }: IgnisignWebhook_CallbackParams<IgnisignWebhookDto_SignatureProof_Success>): Promise<void> => {
    if(msgNature === IGNISIGN_WEBHOOK_MESSAGE_NATURE.ERROR) {
      console.error("webhookHandler_SignatureProofGenerated ERROR : ", error);
      return;
    }
    const { signatureRequestExternalId, signatureProofUrl } = content as IgnisignWebhookDto_SignatureProof_Success;

    _logIfDebug("webhookHandler_SignatureProofGenerated", {signatureRequestExternalId, signatureProofUrl})

    // TODO
  }

  
  await ignisignSdkInstance.registerWebhookCallback_SignatureProof(   // Registering the webhookHandler_SignatureProofGenerated callback function
    webhookHandler_SignatureProofGenerated, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF.GENERATED);

  await checkWebhookEndpoint();
}


// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint() : Promise<void>{
  return IgnisignSdkManagerCommonsService.checkWebhookEndpoint(ignisignSdkInstance);
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints() : Promise<IgnisignWebhook[]>{
  return IgnisignSdkManagerCommonsService.getWebhookEndpoints(ignisignSdkInstance);
    
}


// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  return IgnisignSdkManagerCommonsService.consumeWebhook(ignisignSdkInstance, actionDto);
}






