
import {
  IGNISIGN_APPLICATION_ENV,
  IGNISIGN_SIGNER_CREATION_INPUT_REF,
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE,
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF,
  IGNISIGN_WEBHOOK_ACTION_SIGNATURE_REQUEST,
  IGNISIGN_WEBHOOK_MESSAGE_NATURE,
  IgnisignDocument_InitializationDto,
  IgnisignSignatureRequest_Context,
  IgnisignSignatureRequest_IdContainer,
  IgnisignSignatureRequest_UpdateDto,
  IgnisignSignerProfile,
  IgnisignSigner_CreationRequestDto,
  IgnisignSigner_CreationResponseDto,
  IgnisignWebhook,
  IgnisignWebhookDto_Signature,
  IgnisignWebhookDto_SignatureProof_Success,
  IgnisignWebhookDto_SignatureRequest,
  IgnisignWebhook_ActionDto,
  IgnisignWebhook_CallbackParams
} from '@ignisign/public';
import { IgnisignSdk, IgnisignSdkFileContentUploadDto } from '@ignisign/sdk';
import { Readable } from 'stream';
import { ContractService } from './contract.service';
import _ = require('lodash');
import * as fs from 'fs';


const DEBUG_LOG_ACTIVATED = true;
const _logIfDebug = (...message) => {
  if(DEBUG_LOG_ACTIVATED)
    console.log(...message)
}

let ignisignSdkInstance: IgnisignSdk = null;
let ignisignSdkInstanceInitialized = false;

export const IgnisignSdkManagerService = {
  init,
  createNewSigner,
  revokeSigner,
  consumeWebhook,
  updateSignatureRequest,
  publishSignatureRequest,
  // getSignatureProfiles,
  getSignerProfile,
  initSignatureRequest,
  uploadHashDocument,
  uploadDocument,
  getSignerInputsConstraintsFromSignerProfileId,
  getSignatureRequestContext,
  // getSignatureProfile,
  getWebhookEndpoints,
  downloadSignatureProof,
}

let ignisignSdkSealInstance: IgnisignSdk = null;
let ignisignSdkSealInstanceInitialized = false;


export const IgnisignSealSdkManagerService = {
  init: initSeal,
  ignisignSdkSealInstanceInitialized,
  createM2mSignatureRequest,
}

const IGNISIGN_APP_ID     = process.env.IGNISIGN_APP_ID
const IGNISIGN_APP_ENV: IGNISIGN_APPLICATION_ENV = IGNISIGN_APPLICATION_ENV[process.env.IGNISIGN_APP_ENV]
const IGNISIGN_APP_SECRET = process.env.IGNISIGN_APP_SECRET

/******************************************************************************************** ***************************************************************************************/
/******************************************************************************************** INIT **********************************************************************************/
/******************************************************************************************** ***************************************************************************************/

async function init() {
  _logIfDebug("IgnisignSdkManagerService: init")
  
  if(!IGNISIGN_APP_ID || !IGNISIGN_APP_ENV || !IGNISIGN_APP_SECRET)
    throw new Error(`IGNISIGN_APP_ID, IGNISIGN_APP_ENV and IGNISIGN_APP_SECRET are mandatory to init IgnisignSdkManagerService`);
    
  try {
    if(ignisignSdkInstanceInitialized)
      return;

    ignisignSdkInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkInstance = new IgnisignSdk({
      appId           : IGNISIGN_APP_ID,
      appEnv          : (<IGNISIGN_APPLICATION_ENV>IGNISIGN_APP_ENV),
      appSecret       : IGNISIGN_APP_SECRET,
      displayWarning  : true,
    })

    await ignisignSdkInstance.init();
    await _registerWebhookCallback();

  
  } catch (e){
    ignisignSdkInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
}


async function initSeal() {
  const {
    IGNISIGN_SEAL_APP_ID,
    IGNISIGN_SEAL_ENV,
    IGNISIGN_SEAL_SECRET,
    IGNISIGN_SEAL_M2M_ID,
  } = process.env;

  _logIfDebug("IgnisignSdkManagerService: init")
  
  if(!IGNISIGN_SEAL_APP_ID || !IGNISIGN_SEAL_ENV || !IGNISIGN_SEAL_SECRET)
    throw new Error(`IGNISIGN_SEAL_APP_ID, IGNISIGN_SEAL_ENV and IGNISIGN_SEAL_SECRET are mandatory to init IgnisignSdkManagerService`);
  
  if(!IGNISIGN_SEAL_M2M_ID)
    throw new Error(`IGNISIGN_SEAL_M2M_ID is mandatory to init IgnisignSdkManagerService`);
  
  try {
    if(ignisignSdkSealInstanceInitialized)
      return;

    ignisignSdkSealInstanceInitialized = true;
    
    // initialization of the Ignisign SDK
    ignisignSdkSealInstance = new IgnisignSdk({
      appId           : IGNISIGN_SEAL_APP_ID,
      appEnv          : (<IGNISIGN_APPLICATION_ENV>IGNISIGN_SEAL_ENV),
      appSecret       : IGNISIGN_SEAL_SECRET,
      displayWarning  : true,
    })

    await ignisignSdkSealInstance.init();

    console.log('init seal', IGNISIGN_SEAL_APP_ID,
    IGNISIGN_SEAL_ENV,
    IGNISIGN_SEAL_SECRET,
    IGNISIGN_SEAL_M2M_ID,);
    
    // await ignisignSdkInstance.init();
    // await _registerWebhookCallback();

  
  } catch (e){
    ignisignSdkSealInstanceInitialized = false;
    console.error("Error when initializing Ignisign Manager Service", e)
  }
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

    if(signersBySide || signersEmbedded)
      await ContractService.handleLaunchSignatureRequestWebhook(signatureRequestExternalId, signatureRequestId, [...signersBySide, ...signersEmbedded])
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

    await ContractService.handleFinalizeSignatureWebhook(signatureRequestExternalId, signatureRequestId, signerExternalId)
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

    await ContractService.handleSignatureProofWebhook(signatureRequestExternalId, signatureProofUrl)
  }

  
  await ignisignSdkInstance.registerWebhookCallback_SignatureProof(   // Registering the webhookHandler_SignatureProofGenerated callback function
    webhookHandler_SignatureProofGenerated, 
    IGNISIGN_WEBHOOK_ACTION_SIGNATURE_PROOF.GENERATED);

  await checkWebhookEndpoint();
}




// This function is used to check if a webhook endpoint is registered in the Ignisign Console.
async function checkWebhookEndpoint() : Promise<void>{
  
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();
    if(webhookEndpoints.length === 0)
      console.warn("WARN: No webhook endpoints found, please create one in the Ignisign Console - In dev mode, you can use ngrok to expose your localhost to the internet")

  } catch(e) {
    console.error("IgnisignSdkManagerService: Error when checking webhook endpoint", e)
    throw e
  }
}

// This function is used to retrieve all webhook endpoints registered in the Ignisign Console.
// This function retrieve only the webhook endpoints created for the IGNISIGN_APP_ID && IGNISIGN_APP_ENV.
async function getWebhookEndpoints() : Promise<IgnisignWebhook[]>{
  try {
    const webhookEndpoints : IgnisignWebhook[] = await ignisignSdkInstance.getWebhookEndpoints();

    _logIfDebug("getWebhookEndpoints", webhookEndpoints)

    return webhookEndpoints;
  } catch(e) {
    console.error("IgnisignSdkManagerService: Error when checking webhook endpoint", e)
    throw e
  } 
}


// The function to call when a webhook is received.
// This function have to be called in a route of your application that is registered into the Ignisign Console as an webhook endpoint.
async function consumeWebhook(actionDto: IgnisignWebhook_ActionDto) {
  _logIfDebug("consumeWebhook", actionDto)
  return await ignisignSdkInstance.consumeWebhook(actionDto);
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE PROFILES ***********************************************************************/
/******************************************************************************************** ******************************************************************************************/

// async function getSignatureProfiles(): Promise<IgnisignSignatureProfile[]> {  
//   return await ignisignSdkInstance.getSignatureProfiles()
// }


async function getSignerProfile(signerProfileId: string): Promise<IgnisignSignerProfile> {
  try {
    return await ignisignSdkInstance.getSignerProfile(signerProfileId);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

// async function getSignatureProfile(signatureProfileId): Promise<IgnisignSignatureProfile> {
//   try {
//     const profiles = await ignisignSdkInstance.getSignatureProfiles()
//     const profile  = profiles?.find(p => p._id === signatureProfileId)
    
//     if(!profile)
//       throw new Error("Cannot find signature profile with id : " + signatureProfileId)
//     return profile;

//   } catch (e){
//     console.error("IgnisignSdkManagerService: Error when retieveing signature profile", e)
//     throw e
//   }
// }


async function getSignerInputsConstraintsFromSignerProfileId(signatureProfileId: string): Promise<IGNISIGN_SIGNER_CREATION_INPUT_REF[]> {
  console.log(ignisignSdkInstance);
  
  const result = await ignisignSdkInstance.getSignerInputsConstraintsFromSignerProfileId(signatureProfileId);
  return result.inputsNeeded;
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNERS **********************************************************************************/
/******************************************************************************************** ******************************************************************************************/

async function createNewSigner(signerProfileId, inputs: { [key in IGNISIGN_SIGNER_CREATION_INPUT_REF] ?: string } = {}, externalId: string = null): Promise<IgnisignSigner_CreationResponseDto> {  

  const dto : IgnisignSigner_CreationRequestDto = {
    signerProfileId,
    ...inputs,
    ...(externalId && {externalId})
  }

  // _logIfDebug("createNewSigner", dto)
  try {
    return await ignisignSdkInstance.createSigner(dto);
  } catch (error) {
    console.error(error.toString());
    throw error
  }
}

async function revokeSigner(signerId: string) : Promise<{signerId : string}> {
  return await ignisignSdkInstance.revokeSigner(signerId);
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE REQUEST & DOCUMENTS ***********************************************************/
/******************************************************************************************** ******************************************************************************************/

// This function is used to initialize a signature request.
// See the Ignisign SDK documentation for more information about the global signature request creation process.
async function initSignatureRequest(): Promise<string>{
  const { signatureRequestId } = await ignisignSdkInstance.initSignatureRequest()
  return signatureRequestId
}



async function updateSignatureRequest(signatureRequestId : string, dto: IgnisignSignatureRequest_UpdateDto): Promise<IgnisignSignatureRequest_Context> {
  try {
    _logIfDebug("updateSignatureRequest", {signatureRequestId, dto})
    const data = await ignisignSdkInstance.updateSignatureRequest(signatureRequestId, dto);
  //TODO:

    return null //data
  } catch (error) {
    throw error;
  }
}

async function publishSignatureRequest(signatureRequestId : string) : Promise<IgnisignSignatureRequest_IdContainer>{
  try {
    _logIfDebug("publishSignatureRequest", signatureRequestId)
    const data = await ignisignSdkInstance.publishSignatureRequest(signatureRequestId);
    return data
  } catch (error) {
    throw error;
    
  }
}

// Retrieve the context(all related information) related to a signature request
async function getSignatureRequestContext(signatureRequestId: string): Promise<IgnisignSignatureRequest_Context> {
  _logIfDebug("getSignatureRequestContext", signatureRequestId)
  return await ignisignSdkInstance.getSignatureRequestContext(signatureRequestId);
}

// Upload a hash of a document to Ignisign related to private files.
async function uploadHashDocument(signatureRequestId, fileHash, label): Promise<string> {
  _logIfDebug("uploadHashDocument", {signatureRequestId, fileHash, label})

  const dto : IgnisignDocument_InitializationDto = { signatureRequestId, label };

  const { documentId } = await ignisignSdkInstance.initializeDocument(dto)
  await ignisignSdkInstance.provideDocumentContent_PrivateContent(documentId, fileHash)
  return documentId 
}

// Upload a document to Ignisign related to standard files.
async function uploadDocument(signatureRequestId, uploadDto : IgnisignSdkFileContentUploadDto): Promise<string>{
  _logIfDebug("uploadDocument", {signatureRequestId, fileName : uploadDto.fileName, contentType : uploadDto.contentType})

  const dto : IgnisignDocument_InitializationDto = { signatureRequestId };
  const { documentId } = await ignisignSdkInstance.initializeDocument(dto);

  await ignisignSdkInstance.provideDocumentContent_File(documentId, uploadDto)
  return documentId
}

/******************************************************************************************** ******************************************************************************************/
/******************************************************************************************** SIGNATURE PROOFS *************************************************************************/
/******************************************************************************************** ******************************************************************************************/

// Retrieve the signature proof of a signature
async function downloadSignatureProof(documentId): Promise<Readable> {
  _logIfDebug("downloadSignatureProof", documentId)
  return await ignisignSdkInstance.downloadSignatureProofDocument(documentId);
}

async function createM2mSignatureRequest(m2mId: string, documentHash: string): Promise<void> {
  // _logIfDebug("createM2mSignatureRequest", {signatureRequestId, documentHash})
  const {signatureRequestId} = await ignisignSdkSealInstance.createM2mSignatureRequest({
    m2mId,
    documentHash
  });
  const privateKey = fs.readFileSync('./seal-secret.pem', 'utf8')

  const {signature} = ignisignSdkSealInstance.doSignM2MPayload(privateKey, {signatureRequestId, documentHash})
  await ignisignSdkSealInstance.signM2mSignatureRequest({
    signatureRequestId,
    documentHash,
    signature,
  })
}









