import { IGNISIGN_APPLICATION_ENV, IGNISIGN_DOCUMENT_TYPE, IGNISIGN_WEBHOOK_ACTION_SIGNATURE, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF, IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST, IGNISIGN_WEBHOOK_MESSAGE_NATURE, IgnisignWebhook, IgnisignWebhookDto_Signature, IgnisignWebhookDto_SignatureProof_Success, IgnisignWebhookDto_SignatureRequest, IgnisignWebhook_ActionDto, IgnisignWebhook_CallbackParams } from "@ignisign/public";
import { IgnisignSdk } from "@ignisign/sdk";
import { IgnisignSdkManagerCommonsService } from "./ignisign-sdk-manager-commons.service";


let isIgnisignSdkM2M_InstanceInitialized : boolean = false;
let ignisignSdkM2MInstance: IgnisignSdk = null;

const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}


export const IgnisignM2MSdkManagerService = {
  init,
  isEnabled,
  createM2mSignatureRequest,
  checkWebhookEndpoint,
  getWebhookEndpoints,
  consumeWebhook,
}


/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

function isEnabled(): boolean {
  return isIgnisignSdkM2M_InstanceInitialized;
}

async function init() {
  const {
    IGNISIGN_SEAL_APP_ID,
    IGNISIGN_SEAL_ENV,
    IGNISIGN_SEAL_SECRET,
    IGNISIGN_SEAL_M2M_ID,
    IGNISIGN_SEAL_M2M_PRIVATE_KEY,
  } = process.env;

  _logIfDebug("IgnisignM2MManagerService: init")
  if(!IGNISIGN_SEAL_APP_ID){
    _logIfDebug("APP Seal not initialized")
  }

  if(!IGNISIGN_SEAL_ENV)
    throw new Error('IGNISIGN_SEAL_ENV not set: mandatory to init IgnisignSdkManagerService');

  if(!IGNISIGN_SEAL_SECRET)
    throw new Error('IGNISIGN_SEAL_SECRET not set: mandatory to init IgnisignSdkManagerService');

  if(!IGNISIGN_SEAL_M2M_ID)
    throw new Error('IGNISIGN_SEAL_M2M_ID not set: mandatory to init IgnisignSdkManagerService');

  if(!IGNISIGN_SEAL_M2M_PRIVATE_KEY)
    throw new Error('IGNISIGN_SEAL_M2M_PRIVATE_KEY not set: mandatory to init IgnisignSdkManagerService');

  try {
    if(isIgnisignSdkM2M_InstanceInitialized)
      return;

    // initialization of the Ignisign SDK
    ignisignSdkM2MInstance = new IgnisignSdk({
      appId           : IGNISIGN_SEAL_APP_ID,
      appEnv          : (<IGNISIGN_APPLICATION_ENV>IGNISIGN_SEAL_ENV),
      appSecret       : IGNISIGN_SEAL_SECRET,
      displayWarning  : true,
    })

    await ignisignSdkM2MInstance.init();
    await _registerWebhookCallback();

    isIgnisignSdkM2M_InstanceInitialized = true;

  
  } catch (e){

    isIgnisignSdkM2M_InstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}

async function createM2mSignatureRequest(m2mId: string, documentHash: string): Promise<void> {
  
  const privateKey = process.env.IGNISIGN_SEAL_M2M_PRIVATE_KEY
    .replace(/\|/g    ,'\n')
    .replace(/\\n/gm  ,'\n');

  const {signature} = ignisignSdkM2MInstance.doSignM2MPayload(privateKey, documentHash)

  const {signatureRequestId, documentId } = await ignisignSdkM2MInstance.signM2M({
    m2mId,
    document : {
      documentType: IGNISIGN_DOCUMENT_TYPE.PRIVATE_FILE, // 'PRIVATE_FILE' | 'FILE' | 'DATA_XML' | 'DATA_JSON'
      documentHash,
    },
    documentHashSignedByM2MPrivateKey: signature,
  });

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

    const { signatureRequestExternalId, signatureRequestId, signersBySide, signersEmbedded } = content as IgnisignWebhookDto_SignatureRequest;

    _logIfDebug("webhookHandler_LaunchSignatureRequest", {signatureRequestExternalId, signatureRequestId})

    // TODO
  }

  
  await ignisignSdkM2MInstance.registerWebhookCallback_SignatureRequest(     // Registering the webhookHandler_LaunchSignatureRequest callback function
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

  
  await ignisignSdkM2MInstance.registerWebhookCallback_Signature(    // Registering the webhookHandler_signatureFinalized callback function
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

  
  await ignisignSdkM2MInstance.registerWebhookCallback_SignatureProof(   // Registering the webhookHandler_SignatureProofGenerated callback function
    webhookHandler_SignatureProofGenerated, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF.GENERATED);

  await checkWebhookEndpoint();
}


// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint() : Promise<void>{
  return IgnisignSdkManagerCommonsService.checkWebhookEndpoint(ignisignSdkM2MInstance);
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints() : Promise<IgnisignWebhook[]>{
  return IgnisignSdkManagerCommonsService.getWebhookEndpoints(ignisignSdkM2MInstance);
    
}


// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  return IgnisignSdkManagerCommonsService.consumeWebhook(ignisignSdkM2MInstance, actionDto);
}







